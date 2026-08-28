#!/usr/bin/env python3
"""
Reconcile Kalliope works against Open Library and Wikidata.

- Recursively finds XML files containing <workhead>.
- Reads title/year from <workhead>.
- Finds the nearest info.xml upwards and reads the author's name and Wikidata Q-id.
- Searches Open Library and Wikidata.
- Scores candidates conservatively.
- Writes a CSV report; DOES NOT modify XML.

Standard library only.

Example:
    python3 tools/identifier-reconciliation/identifier_reconciliation.py \
        ~/src/kalliope

Useful options:
    --entity-type poet
    --entity-type artwork
    --apply
    --cache-dir .cache/kalliope-work-identifiers
    --min-match-score 90
    --review-score 65
    --sleep 0.15
"""

from __future__ import annotations

import argparse
import csv
import hashlib
import json
import re
import sys
import time
import unicodedata
import urllib.error
import urllib.parse
import urllib.request
import xml.etree.ElementTree as ET

from dataclasses import dataclass
from pathlib import Path
from typing import Any, Iterable


USER_AGENT = (
    "KalliopeWorkIdentifierReconciler/1.0 "
    "(https://kalliope.org/; bibliographic reconciliation)"
)

OPENLIBRARY_SEARCH = "https://openlibrary.org/search.json"
WIKIDATA_API = "https://www.wikidata.org/w/api.php"
WIKIDATA_ENTITY = "https://www.wikidata.org/wiki/Special:EntityData/{}.json"

QID_RE = re.compile(r"^Q[1-9][0-9]*$")


@dataclass
class Work:
    path: Path
    title: str
    year: int | None
    author: str | None
    author_qid: str | None
    existing_wikidata: str | None
    existing_openlibrary: str | None
    existing_runeberg_book: str | None


@dataclass
class Poet:
    path: Path
    identifier: str
    name: str
    year_born: int | None
    year_dead: int | None
    existing_wikidata: str | None


@dataclass
class Artwork:
    path: Path
    identifier: str
    title: str
    year: int | None
    artist: str | None
    artist_qid: str | None
    existing_wikidata: str | None


@dataclass
class Candidate:
    identifier: str
    score: int
    reason: str
    label: str = ""
    classification: str = "UNKNOWN"
    classification_reason: str = ""
    types: tuple[str, ...] = ()
    forms: tuple[str, ...] = ()
    cache_status: str = ""


@dataclass
class WikidataClassification:
    kind: str
    reason: str
    types: tuple[str, ...]
    forms: tuple[str, ...]


def local_name(tag: str) -> str:
    return tag.rsplit("}", 1)[-1]


def first_child(parent: ET.Element, name: str) -> ET.Element | None:
    for child in list(parent):
        if local_name(child.tag) == name:
            return child
    return None


def child_text(parent: ET.Element, name: str) -> str | None:
    node = first_child(parent, name)
    if node is None or node.text is None:
        return None
    value = node.text.strip()
    return value or None


def find_descendant(parent: ET.Element, names: Iterable[str]) -> ET.Element | None:
    wanted = set(names)
    for node in parent.iter():
        if local_name(node.tag) in wanted:
            return node
    return None


def parse_xml(path: Path) -> ET.Element:
    # ElementTree does not fetch external DTDs.
    return ET.parse(path).getroot()


def find_workhead(root: ET.Element) -> ET.Element | None:
    if local_name(root.tag) == "workhead":
        return root
    for node in root.iter():
        if local_name(node.tag) == "workhead":
            return node
    return None


def parse_year(value: str | None) -> int | None:
    if not value:
        return None
    m = re.search(r"\b(1[0-9]{3}|20[0-9]{2})\b", value)
    return int(m.group(1)) if m else None


def nearest_info_xml(work_file: Path, stop: Path) -> Path | None:
    cur = work_file.parent.resolve()
    stop = stop.resolve()
    while True:
        p = cur / "info.xml"
        if p.exists() and p.resolve() != work_file.resolve():
            return p
        if cur == stop or cur.parent == cur:
            return None
        cur = cur.parent


def parse_person_info(path: Path | None) -> tuple[str | None, str | None]:
    if path is None:
        return None, None
    try:
        root = parse_xml(path)
    except Exception:
        return None, None

    name = first_child(root, "name")
    author = None
    if name is not None:
        author = child_text(name, "fullname")
        if not author:
            first = child_text(name, "firstname") or ""
            last = child_text(name, "lastname") or ""
            author = (first + " " + last).strip() or None

    identifiers = first_child(root, "identifiers")
    qid = child_text(identifiers, "wikidata") if identifiers is not None else None
    if qid and not QID_RE.match(qid):
        qid = None
    return author, qid


def parse_existing_identifiers(
    workhead: ET.Element,
) -> tuple[str | None, str | None, str | None]:
    identifiers = first_child(workhead, "identifiers")
    if identifiers is None:
        return None, None, None

    wd = child_text(identifiers, "wikidata")
    ol = (
        child_text(identifiers, "openlibrary-work")
        or child_text(identifiers, "openlibrary")
    )
    runeberg = child_text(identifiers, "runeberg-book")
    return wd, ol, runeberg


def scan_works(root_dir: Path) -> list[Work]:
    works: list[Work] = []

    for path in sorted(root_dir.rglob("*.xml")):
        if path.name == "info.xml":
            continue
        try:
            root = parse_xml(path)
        except (ET.ParseError, OSError):
            continue

        workhead = find_workhead(root)
        if workhead is None:
            continue

        title = child_text(workhead, "title")
        if not title:
            continue

        year = parse_year(child_text(workhead, "year"))
        info = nearest_info_xml(path, root_dir)
        author, author_qid = parse_person_info(info)
        existing_wd, existing_ol, existing_runeberg = parse_existing_identifiers(workhead)

        works.append(
            Work(
                path=path,
                title=title,
                year=year,
                author=author,
                author_qid=author_qid,
                existing_wikidata=existing_wd,
                existing_openlibrary=existing_ol,
                existing_runeberg_book=existing_runeberg,
            )
        )

    return works


def parse_year_from_date(value: str | None) -> int | None:
    return parse_year(value)


def parse_person_years(root: ET.Element) -> tuple[int | None, int | None]:
    period = first_child(root, "period")
    if period is None:
        return None, None
    born = first_child(period, "born")
    dead = first_child(period, "dead")
    born_year = parse_year_from_date(child_text(born, "date") if born is not None else None)
    dead_year = parse_year_from_date(child_text(dead, "date") if dead is not None else None)
    return born_year, dead_year


def scan_poets(root_dir: Path) -> list[Poet]:
    poets: list[Poet] = []
    for path in sorted(root_dir.glob("fdirs/*/info.xml")):
        try:
            root = parse_xml(path)
        except (ET.ParseError, OSError):
            continue
        if local_name(root.tag) != "person" or root.get("type") != "poet":
            continue
        name, _ = parse_person_info(path)
        if not name:
            continue
        born_year, dead_year = parse_person_years(root)
        identifiers = first_child(root, "identifiers")
        existing = child_text(identifiers, "wikidata") if identifiers is not None else None
        if existing and not QID_RE.match(existing):
            existing = None
        poets.append(
            Poet(path, path.parent.name, name, born_year, dead_year, existing)
        )
    return poets


def picture_title(picture: ET.Element) -> str:
    title = find_descendant(picture, ("i", "title"))
    if title is not None and title.text:
        return title.text.strip()
    text = " ".join(piece.strip() for piece in picture.itertext() if piece.strip())
    return text[:240]


def scan_artworks(root_dir: Path) -> list[Artwork]:
    artworks: list[Artwork] = []
    artwork_files = [root_dir / "content/artwork.xml"]
    artwork_files.extend(sorted(root_dir.glob("fdirs/*/artwork.xml")))
    for path in artwork_files:
        if not path.exists():
            continue
        owner = path.parent.name if path.parent.name != "content" else "kunst"
        owner_info = root_dir / "fdirs" / owner / "info.xml"
        artist, artist_qid = parse_person_info(owner_info)
        try:
            root = parse_xml(path)
        except (ET.ParseError, OSError):
            continue
        for picture in list(root):
            if local_name(picture.tag) != "picture":
                continue
            identifier = picture.get("id")
            if not identifier:
                continue
            identifiers = first_child(picture, "identifiers")
            existing = child_text(identifiers, "wikidata") if identifiers is not None else None
            if existing and not QID_RE.match(existing):
                existing = None
            artworks.append(
                Artwork(
                    path,
                    f"{owner}/{identifier}",
                    picture_title(picture),
                    parse_year(picture.get("year")),
                    artist,
                    artist_qid,
                    existing,
                )
            )
    return artworks


def norm(s: str | None) -> str:
    if not s:
        return ""
    s = unicodedata.normalize("NFKD", s)
    s = "".join(c for c in s if not unicodedata.combining(c))
    s = s.casefold()
    s = re.sub(r"[^\w]+", " ", s, flags=re.UNICODE)
    return " ".join(s.split())


def surname(name: str | None) -> str:
    parts = norm(name).split()
    return parts[-1] if parts else ""


class HttpCache:
    def __init__(self, cache_dir: Path, sleep_seconds: float, verbose: bool = False):
        self.cache_dir = cache_dir
        self.cache_dir.mkdir(parents=True, exist_ok=True)
        self.sleep_seconds = sleep_seconds
        self.verbose = verbose
        self._last_request = 0.0
        self.last_result_source = ""

    def get_json(self, url: str, params: dict[str, Any]) -> dict[str, Any]:
        qs = urllib.parse.urlencode(params, doseq=True)
        full_url = f"{url}?{qs}"
        key = hashlib.sha256(full_url.encode("utf-8")).hexdigest()
        cache_file = self.cache_dir / f"{key}.json"

        if cache_file.exists():
            self.last_result_source = "cache"
            if self.verbose:
                print(f"HTTP cache {full_url}", file=sys.stderr)
            return json.loads(cache_file.read_text(encoding="utf-8"))

        delay = self.sleep_seconds - (time.monotonic() - self._last_request)
        if delay > 0:
            time.sleep(delay)

        req = urllib.request.Request(
            full_url,
            headers={
                "User-Agent": USER_AGENT,
                "Accept": "application/json",
            },
        )
        try:
            with urllib.request.urlopen(req, timeout=30) as response:
                data = json.load(response)
        except urllib.error.HTTPError as e:
            raise RuntimeError(f"HTTP {e.code}: {full_url}") from e
        except urllib.error.URLError as e:
            raise RuntimeError(f"Network error: {full_url}: {e}") from e

        self._last_request = time.monotonic()
        self.last_result_source = "network"
        if self.verbose:
            print(f"HTTP network {full_url}", file=sys.stderr)
        cache_file.write_text(
            json.dumps(data, ensure_ascii=False, indent=2),
            encoding="utf-8",
        )
        return data


def years_from_wikidata_claims(entity: dict[str, Any]) -> list[int]:
    result: list[int] = []
    claims = entity.get("claims", {})
    for prop in ("P577", "P571"):  # publication date / inception
        for claim in claims.get(prop, []):
            try:
                value = claim["mainsnak"]["datavalue"]["value"]["time"]
                m = re.match(r"^[+-](\d{4})-", value)
                if m:
                    result.append(int(m.group(1)))
            except (KeyError, TypeError):
                pass
    return result


def qids_from_claim(entity: dict[str, Any], prop: str) -> set[str]:
    result: set[str] = set()
    for claim in entity.get("claims", {}).get(prop, []):
        try:
            numeric_id = claim["mainsnak"]["datavalue"]["value"]["numeric-id"]
            result.add(f"Q{numeric_id}")
        except (KeyError, TypeError):
            pass
    return result


def strings_from_claim(entity: dict[str, Any], prop: str) -> list[str]:
    result: list[str] = []
    for claim in entity.get("claims", {}).get(prop, []):
        try:
            value = claim["mainsnak"]["datavalue"]["value"]
        except (KeyError, TypeError):
            continue
        if isinstance(value, str) and value and value not in result:
            result.append(value)
    return result


_TAG_RE = re.compile(r"<!--.*?-->|<[^>]+>", re.DOTALL)
_TAG_NAME_RE = re.compile(r"</?\s*([A-Za-z_][\w:.-]*)")


def direct_child_span(xml_fragment: str, parent: str, child: str):
    """Return (open_start, open_end, close_start, close_end) for a direct child."""
    depth = 0
    parent_seen = False
    target = None

    for token in _TAG_RE.finditer(xml_fragment):
        raw = token.group(0)
        if raw.startswith("<!--") or raw.startswith("<?") or raw.startswith("<!"):
            continue

        m = _TAG_NAME_RE.match(raw)
        if not m:
            continue
        name = m.group(1)
        closing = raw.startswith("</")
        self_closing = raw.rstrip().endswith("/>")

        if not parent_seen:
            if not closing and name == parent:
                parent_seen = True
                depth = 1
            continue

        if closing:
            if target is not None and name == child and depth == 2:
                return target[0], target[1], token.start(), token.end()
            depth -= 1
            if depth <= 0:
                break
            continue

        if depth == 1 and name == child and not self_closing:
            target = (token.start(), token.end())

        if not self_closing:
            depth += 1

    return None


def apply_work_identifiers(path: Path, additions: dict[str, str]) -> bool:
    """
    Minimally patch direct <workhead>/<identifiers> content.
    Does not reserialize the XML document.
    """
    additions = {k: v for k, v in additions.items() if v}
    if not additions:
        return False

    text = path.read_text(encoding="utf-8")

    workhead_open = re.search(r"<workhead\b[^>]*>", text)
    if not workhead_open:
        raise RuntimeError(f"No <workhead> in {path}")

    workhead_close = text.find("</workhead>", workhead_open.end())
    if workhead_close < 0:
        raise RuntimeError(f"No </workhead> in {path}")

    end = workhead_close + len("</workhead>")
    fragment = text[workhead_open.start():end]

    identifiers_span = direct_child_span(fragment, "workhead", "identifiers")

    if identifiers_span is not None:
        _, _, close_start, _ = identifiers_span
        block = fragment[identifiers_span[0]:identifiers_span[3]]
        additions = {
            k: v
            for k, v in additions.items()
            if not re.search(
                rf"<{re.escape(k)}(?:\s[^>]*)?>.*?</{re.escape(k)}>",
                block,
                flags=re.DOTALL,
            )
        }
        if not additions:
            return False

        line_start = fragment.rfind("\n", 0, close_start) + 1
        closing_indent = fragment[line_start:close_start]
        if closing_indent.strip():
            closing_indent = "  "
        child_indent = closing_indent + "  "
        insertion = "".join(
            f"{child_indent}<{name}>{value}</{name}>\\n"
            for name, value in additions.items()
        )
        absolute = workhead_open.start() + line_start
        new_text = text[:absolute] + insertion + text[absolute:]
    else:
        anchor = (
            direct_child_span(fragment, "workhead", "year")
            or direct_child_span(fragment, "workhead", "title")
        )
        if anchor is None:
            raise RuntimeError(f"Cannot find <year> or <title> in {path}")

        anchor_start, _, _, anchor_end = anchor
        line_start = fragment.rfind("\n", 0, anchor_start) + 1
        indent = fragment[line_start:anchor_start]
        if indent.strip():
            indent = "  "
        child_indent = indent + "  "

        block_lines = [f"{indent}<identifiers>"]
        block_lines.extend(
            f"{child_indent}<{name}>{value}</{name}>"
            for name, value in additions.items()
        )
        block_lines.append(f"{indent}</identifiers>")
        insertion = "\n" + "\n".join(block_lines)

        absolute = workhead_open.start() + anchor_end
        new_text = text[:absolute] + insertion + text[absolute:]

    tmp = path.with_name(path.name + ".tmp-kalliope-identifiers")
    tmp.write_text(new_text, encoding="utf-8")
    tmp.replace(path)
    return True


def remove_work_identifier(path: Path, name: str) -> bool:
    """Remove one direct <workhead>/<identifiers> child without reformatting."""
    text = path.read_text(encoding="utf-8")
    workhead_open = re.search(r"<workhead\b[^>]*>", text)
    if not workhead_open:
        raise RuntimeError(f"No <workhead> in {path}")

    workhead_close = text.find("</workhead>", workhead_open.end())
    if workhead_close < 0:
        raise RuntimeError(f"No </workhead> in {path}")

    fragment_end = workhead_close + len("</workhead>")
    fragment = text[workhead_open.start():fragment_end]
    identifiers_span = direct_child_span(fragment, "workhead", "identifiers")
    if identifiers_span is None:
        return False

    block = fragment[identifiers_span[0]:identifiers_span[3]]
    child_span = direct_child_span(block, "identifiers", name)
    if child_span is None:
        return False

    child_start, _, child_close_start, child_end = child_span
    line_start = block.rfind("\n", 0, child_start) + 1
    line_end = block.find("\n", child_end)
    if line_end < 0:
        line_end = child_end
    else:
        line_end += 1

    remaining_block = block[:line_start] + block[line_end:]
    if re.fullmatch(r"<identifiers\b[^>]*>\s*</identifiers>", remaining_block, re.DOTALL):
        block_line_start = fragment.rfind("\n", 0, identifiers_span[0]) + 1
        block_line_end = fragment.find("\n", identifiers_span[3])
        if block_line_end < 0:
            block_line_end = identifiers_span[3]
        else:
            block_line_end += 1
        absolute_start = workhead_open.start() + block_line_start
        absolute_end = workhead_open.start() + block_line_end
    else:
        absolute_start = workhead_open.start() + identifiers_span[0] + line_start
        absolute_end = workhead_open.start() + identifiers_span[0] + line_end
    new_text = text[:absolute_start] + text[absolute_end:]
    tmp = path.with_name(path.name + ".tmp-kalliope-identifiers")
    tmp.write_text(new_text, encoding="utf-8")
    tmp.replace(path)
    return True


def apply_identifier_to_element(
    path: Path,
    element_pattern: str,
    element_name: str,
    additions: dict[str, str],
) -> bool:
    """Add identifiers to one person or artwork element without reserializing XML."""
    additions = {key: value for key, value in additions.items() if value}
    if not additions:
        return False
    text = path.read_text(encoding="utf-8")
    match = re.search(element_pattern, text, flags=re.DOTALL)
    if match is None:
        raise RuntimeError(f"No target element in {path}")
    fragment = match.group(0)
    identifiers_span = direct_child_span(fragment, element_name, "identifiers")
    if identifiers_span is not None:
        _, _, close_start, _ = identifiers_span
        block = fragment[identifiers_span[0]:identifiers_span[3]]
        additions = {
            key: value
            for key, value in additions.items()
            if not re.search(
                rf"<{re.escape(key)}(?:\s[^>]*)?>.*?</{re.escape(key)}>",
                block,
                flags=re.DOTALL,
            )
        }
        if not additions:
            return False
        line_start = fragment.rfind("\n", 0, close_start) + 1
        indent = fragment[line_start:close_start]
        if indent.strip():
            indent = "  "
        child_indent = indent + "  "
        insertion = "".join(
            f"{child_indent}<{name}>{value}</{name}>\n"
            for name, value in additions.items()
        )
        absolute_start = match.start() + line_start
        new_text = text[:absolute_start] + insertion + text[match.start() + line_start:]
    else:
        close_start = fragment.rfind(f"</{element_name}>")
        if close_start < 0:
            raise RuntimeError(f"No </{element_name}> in {path}")
        line_start = fragment.rfind("\n", 0, close_start) + 1
        indent = fragment[line_start:close_start]
        if indent.strip():
            indent = "  "
        child_indent = indent + "  "
        block = [f"{indent}<identifiers>"]
        block.extend(
            f"{child_indent}<{name}>{value}</{name}>"
            for name, value in additions.items()
        )
        block.append(f"{indent}</identifiers>")
        insertion = "\n" + "\n".join(block)
        absolute = match.start() + close_start
        new_text = text[:absolute] + insertion + text[absolute:]
    tmp = path.with_name(path.name + ".tmp-kalliope-identifiers")
    tmp.write_text(new_text, encoding="utf-8")
    tmp.replace(path)
    return True


def entity_labels_aliases(entity: dict[str, Any]) -> list[str]:
    values: list[str] = []
    for lang in ("da", "en", "de", "no", "sv"):
        label = entity.get("labels", {}).get(lang, {}).get("value")
        if label:
            values.append(label)
        for alias in entity.get("aliases", {}).get(lang, []):
            value = alias.get("value")
            if value:
                values.append(value)
    return values


def entity_descriptions(entity: dict[str, Any]) -> list[str]:
    return [
        value.get("value", "")
        for value in entity.get("descriptions", {}).values()
        if value.get("value")
    ]


def linked_entity_text(
    http: HttpCache, qids: Iterable[str]
) -> tuple[str, ...]:
    values: list[str] = []
    for qid in sorted(set(qids)):
        linked = fetch_wikidata_entity(http, qid)
        labels = entity_labels_aliases(linked)
        descriptions = entity_descriptions(linked)
        text = " / ".join([qid, *(labels[:5]), *(descriptions[:3])])
        if text:
            values.append(text)
    return tuple(values)


def classify_wikidata_entity(
    http: HttpCache, entity: dict[str, Any]
) -> WikidataClassification:
    """Classify an entity for Kalliope's work-level bibliography.

    The linked labels/descriptions are deliberately inspected instead of
    treating a short list of QIDs as authoritative. Wikidata commonly models
    an individual poem as P31=literary work plus P7937=poem.
    """
    type_qids = qids_from_claim(entity, "P31")
    form_qids = qids_from_claim(entity, "P7937")
    # Resolve both claim targets before applying precedence: an edition can
    # have a title/description containing "poem", but P31 still identifies it
    # as a concrete edition/version.
    types = linked_entity_text(http, type_qids)
    forms = linked_entity_text(http, form_qids)
    own_text = " ".join(
        [*entity_labels_aliases(entity), *entity_descriptions(entity)]
    ).casefold()
    form_text = " ".join(forms).casefold()
    type_text = " ".join(types).casefold()

    # P629 is "edition or translation of" and points from a concrete source
    # to the work. P747 is the inverse relation (a work has editions), so it
    # must not turn the work itself into SOURCE_LEVEL.
    source_property = bool(qids_from_claim(entity, "P629"))
    source_words = (
        "edition",
        "version",
        "translation",
        "udgave",
        "version",
        "ausgabe",
        "übersetzung",
        "édition",
        "traduction",
    )
    own_source_words = (
        "edition",
        "udgave",
        "version",
        "translation",
        "oversættelse",
        "ausgabe",
        "übersetzung",
        "édition",
        "traduction",
    )
    if (
        source_property
        or any(word in own_text for word in own_source_words)
        or any(word in type_text for word in source_words)
    ):
        return WikidataClassification(
            "SOURCE_LEVEL",
            "edition/version/translation signal",
            types,
            forms,
        )

    # These are content forms, not bibliographic wholes. The test is based on
    # the live labels/descriptions attached to P31/P7937 and the entity itself.
    individual_words = (
        "poem",
        "poetry",
        "digt",
        "gedicht",
        "song",
        "sang",
        "short story",
        "novelle",
        "tale",
        "story",
        "lyric",
        "sonnet",
        "sonet",
        "ode",
        "ballad",
        "ballade",
        "elegy",
        "elegi",
        "hymn",
        "hymne",
        "epigram",
    )
    collection_words = (
        "collection",
        "samling",
        "anthology",
        "antologi",
        "collected works",
        "samlede værker",
        "poetry book",
        "poetry collection",
        "diktsamling",
        "gedichtsammlung",
        "buch",
        "book",
        "volume",
        "bind",
    )
    if any(word in form_text for word in collection_words) or any(
        word in own_text for word in collection_words
    ) or any(word in type_text for word in collection_words):
        return WikidataClassification(
            "WORK_LEVEL",
            "bibliographic collection/book signal",
            types,
            forms,
        )

    if any(word in form_text for word in individual_words) or any(
        word in own_text for word in individual_words
    ):
        return WikidataClassification(
            "INDIVIDUAL_CONTENT",
            "individual poem/song/story/content-form signal",
            types,
            forms,
        )

    if any(word in type_text for word in source_words):
        return WikidataClassification(
            "SOURCE_LEVEL",
            "edition/version/translation signal in P31",
            types,
            forms,
        )

    if any(word in type_text for word in collection_words):
        return WikidataClassification(
            "WORK_LEVEL",
            "bibliographic collection/book signal in P31",
            types,
            forms,
        )

    return WikidataClassification(
        "UNKNOWN",
        "no reliable work-level or source-level bibliographic signal",
        types,
        forms,
    )


def fetch_wikidata_entity(http: HttpCache, qid: str) -> dict[str, Any]:
    url = WIKIDATA_ENTITY.format(qid)
    data = http.get_json(url, {})
    return data.get("entities", {}).get(qid, {})


def wikidata_search_qids(http: HttpCache, queries: Iterable[str]) -> list[str]:
    qids: list[str] = []
    seen: set[str] = set()
    for query in queries:
        if not query:
            continue
        data = http.get_json(
            WIKIDATA_API,
            {
                "action": "wbsearchentities",
                "format": "json",
                "language": "da",
                "uselang": "da",
                "type": "item",
                "limit": 10,
                "search": query,
            },
        )
        for hit in data.get("search", []):
            qid = hit.get("id")
            if qid and QID_RE.match(qid) and qid not in seen:
                seen.add(qid)
                qids.append(qid)
    return qids


def years_from_claim_properties(
    entity: dict[str, Any], properties: Iterable[str]
) -> list[int]:
    result: list[int] = []
    for prop in properties:
        for claim in entity.get("claims", {}).get(prop, []):
            try:
                value = claim["mainsnak"]["datavalue"]["value"]["time"]
                m = re.match(r"^[+\-](\d{4})-", value)
                if m:
                    result.append(int(m.group(1)))
            except (KeyError, TypeError):
                pass
    return result


def classify_person_entity(
    http: HttpCache, entity: dict[str, Any]
) -> WikidataClassification:
    type_qids = qids_from_claim(entity, "P31")
    types = linked_entity_text(http, type_qids)
    text = " ".join(types).casefold()
    person_words = ("human", "menneske", "person", "personne", "menschen")
    if any(word in text for word in person_words):
        return WikidataClassification(
            "PERSON_LEVEL", "human/person signal in P31", types, ()
        )
    return WikidataClassification(
        "UNKNOWN", "no reliable human/person signal in P31", types, ()
    )


def classify_artwork_entity(
    http: HttpCache, entity: dict[str, Any]
) -> WikidataClassification:
    type_qids = qids_from_claim(entity, "P31")
    types = linked_entity_text(http, type_qids)
    text = " ".join(types).casefold()
    artwork_words = (
        "work of art",
        "artwork",
        "kunstværk",
        "kunstwerk",
        "painting",
        "maleri",
        "gemälde",
        "sculpture",
        "skulptur",
        "photograph",
        "fotografi",
        "drawing",
        "tegning",
        "print",
        "stik",
        "portrait",
        "portræt",
        "statue",
    )
    if any(word in text for word in artwork_words):
        return WikidataClassification(
            "ARTWORK_LEVEL", "visual-art signal in P31", types, ()
        )
    return WikidataClassification(
        "UNKNOWN", "no reliable visual-art signal in P31", types, ()
    )


def person_candidates(http: HttpCache, poet: Poet) -> list[Candidate]:
    qids = wikidata_search_qids(http, [poet.name])
    candidates: list[Candidate] = []
    for qid in qids[:15]:
        entity = fetch_wikidata_entity(http, qid)
        cache_status = http.last_result_source
        classification = classify_person_entity(http, entity)
        labels = entity_labels_aliases(entity)
        exact = any(norm(value) == norm(poet.name) for value in labels)
        score = 60 if exact else 0
        reasons = ["exact-name"] if exact else []
        years = years_from_claim_properties(entity, ("P569", "P570"))
        wanted_years = [year for year in (poet.year_born, poet.year_dead) if year]
        if wanted_years and years:
            distance = min(
                abs(wanted - found)
                for wanted in wanted_years
                for found in years
            )
            if distance == 0:
                score += 30
                reasons.append("date")
            elif distance <= 1:
                score += 15
                reasons.append("date±1")
            elif distance > 5:
                score -= 20
                reasons.append("date-mismatch")
        candidates.append(
            Candidate(
                qid,
                max(0, min(100, score)),
                "+".join(reasons),
                labels[0] if labels else qid,
                classification.kind,
                classification.reason,
                classification.types,
                classification.forms,
                cache_status,
            )
        )
    return sorted(candidates, key=lambda item: (-item.score, item.identifier))


def artwork_candidates(http: HttpCache, artwork: Artwork) -> list[Candidate]:
    queries = [artwork.title]
    if artwork.artist:
        queries.insert(0, f"{artwork.title} {artwork.artist}")
    qids = wikidata_search_qids(http, queries)
    candidates: list[Candidate] = []
    for qid in qids[:15]:
        entity = fetch_wikidata_entity(http, qid)
        cache_status = http.last_result_source
        classification = classify_artwork_entity(http, entity)
        labels = entity_labels_aliases(entity)
        exact = any(norm(value) == norm(artwork.title) for value in labels)
        score = 60 if exact else 0
        reasons = ["exact-title"] if exact else []
        creators = qids_from_claim(entity, "P170")
        if artwork.artist_qid and artwork.artist_qid in creators:
            score += 25
            reasons.append("creator-qid")
        years = years_from_claim_properties(entity, ("P571", "P577"))
        if artwork.year is not None and years:
            distance = min(abs(artwork.year - year) for year in years)
            if distance == 0:
                score += 15
                reasons.append("year")
            elif distance <= 1:
                score += 8
                reasons.append("year±1")
            elif distance > 5:
                score -= 15
                reasons.append("year-mismatch")
        candidates.append(
            Candidate(
                qid,
                max(0, min(100, score)),
                "+".join(reasons),
                labels[0] if labels else qid,
                classification.kind,
                classification.reason,
                classification.types,
                classification.forms,
                cache_status,
            )
        )
    return sorted(candidates, key=lambda item: (-item.score, item.identifier))


def classify_scoped_candidate(
    candidate: Candidate | None,
    expected: str,
    match_score: int,
    review_score: int,
) -> str:
    if candidate is None or candidate.classification != expected:
        return "NO_MATCH"
    return classify(candidate.score, match_score, review_score)


def run_scoped_report(args: argparse.Namespace, root: Path, http: HttpCache) -> int:
    if args.entity_type == "poet":
        entities = scan_poets(root)
        expected = "PERSON_LEVEL"
        candidate_fn = person_candidates
        report_name = "poet"
    else:
        entities = scan_artworks(root)
        expected = "ARTWORK_LEVEL"
        candidate_fn = artwork_candidates
        report_name = "artwork"

    print(f"Found {len(entities)} {report_name} entities", file=sys.stderr)
    output = args.output or Path(
        f"reports/identifier-reconciliation/{report_name}-identifiers.csv"
    )
    output.parent.mkdir(parents=True, exist_ok=True)
    fieldnames = [
        "file",
        "entity",
        "title",
        "year",
        "context",
        "existing-wikidata",
        "wikidata",
        "wikidata-score",
        "wikidata-status",
        "wikidata-reason",
        "wikidata-classification",
        "wikidata-classification-reason",
        "wikidata-types",
        "wikidata-forms",
        "wikidata-cache",
        "errors",
    ]
    repaired = 0
    with output.open("w", encoding="utf-8", newline="") as stream:
        writer = csv.DictWriter(stream, fieldnames=fieldnames)
        writer.writeheader()
        for index, entity in enumerate(entities, 1):
            errors: list[str] = []
            existing = entity.existing_wikidata
            candidates: list[Candidate] = []
            if not (args.only_missing and existing):
                candidates = safe_call(
                    report_name,
                    lambda entity=entity: candidate_fn(http, entity),
                    errors,
                )
            candidate = best(candidates)
            existing_classification: WikidataClassification | None = None
            existing_cache = ""
            if existing:
                try:
                    existing_entity = fetch_wikidata_entity(http, existing)
                    existing_cache = http.last_result_source
                    classify_fn = (
                        classify_person_entity
                        if args.entity_type == "poet"
                        else classify_artwork_entity
                    )
                    existing_classification = classify_fn(http, existing_entity)
                except Exception as exc:
                    errors.append(f"{report_name}-classification: {exc}")
            status = (
                "EXISTS"
                if existing
                else classify_scoped_candidate(
                    candidate, expected, args.min_match_score, args.review_score
                )
            )
            if (
                args.apply
                and not existing
                and candidate is not None
                and status == "MATCH"
            ):
                if args.entity_type == "poet":
                    pattern = r"<person\b[^>]*>.*?</person>"
                    element_name = "person"
                else:
                    pattern = (
                        rf"<picture\b[^>]*\bid={re.escape(chr(34))}"
                        rf"{re.escape(entity.identifier.split('/', 1)[1])}"
                        rf"{re.escape(chr(34))}[^>]*>.*?</picture>"
                    )
                    element_name = "picture"
                try:
                    if apply_identifier_to_element(
                        entity.path, pattern, element_name, {"wikidata": candidate.identifier}
                    ):
                        repaired += 1
                except Exception as exc:
                    errors.append(f"{report_name}-apply: {exc}")
            selected_classification = existing_classification or (
                WikidataClassification(
                    candidate.classification,
                    candidate.classification_reason,
                    candidate.types,
                    candidate.forms,
                )
                if candidate
                else None
            )
            title = entity.name if args.entity_type == "poet" else entity.title
            year = entity.year_born if args.entity_type == "poet" else entity.year
            row = {
                "file": str(entity.path.relative_to(root)),
                "entity": entity.identifier,
                "title": title,
                "year": year or "",
                "context": "poet" if args.entity_type == "poet" else entity.artist or "",
                "existing-wikidata": existing or "",
                "wikidata": candidate.identifier if candidate else "",
                "wikidata-score": candidate.score if candidate else "",
                "wikidata-status": status,
                "wikidata-reason": candidate.reason if candidate else "",
                "wikidata-classification": selected_classification.kind if selected_classification else "",
                "wikidata-classification-reason": selected_classification.reason if selected_classification else "",
                "wikidata-types": "; ".join(selected_classification.types) if selected_classification else "",
                "wikidata-forms": "; ".join(selected_classification.forms) if selected_classification else "",
                "wikidata-cache": (
                    f"{existing_cache}:entity" if existing_classification else (candidate.cache_status if candidate else "")
                ),
                "errors": " | ".join(errors),
            }
            writer.writerow(row)
            if args.verbose:
                print(
                    f"Wikidata {report_name} {entity.identifier}: "
                    f"candidate={candidate.identifier if candidate else '-'} "
                    f"classification={row['wikidata-classification']} "
                    f"final={status} cache={row['wikidata-cache']}",
                    file=sys.stderr,
                )
            print(
                f"{index}/{len(entities)} {title!r}: "
                f"WD={status} {candidate.identifier if candidate else existing or '-'}",
                file=sys.stderr,
            )
    print(f"Wrote {output}", file=sys.stderr)
    if args.apply:
        print(f"Applied identifiers to {repaired} {report_name} XML files", file=sys.stderr)
    return 0


def wikidata_candidates(http: HttpCache, work: Work) -> list[Candidate]:
    # Search is deliberately broad; validation against author Q-id happens below.
    queries = [work.title]
    if work.author:
        queries.insert(0, f"{work.title} {work.author}")

    qids: list[str] = []
    seen: set[str] = set()

    for query in queries:
        data = http.get_json(
            WIKIDATA_API,
            {
                "action": "wbsearchentities",
                "format": "json",
                "language": "da",
                "uselang": "da",
                "type": "item",
                "limit": 10,
                "search": query,
            },
        )
        for hit in data.get("search", []):
            qid = hit.get("id")
            if qid and QID_RE.match(qid) and qid not in seen:
                seen.add(qid)
                qids.append(qid)

    candidates: list[Candidate] = []

    for qid in qids[:15]:
        entity = fetch_wikidata_entity(http, qid)
        entity_cache_status = http.last_result_source
        classification = classify_wikidata_entity(http, entity)
        labels = entity_labels_aliases(entity)
        exact_title = any(norm(x) == norm(work.title) for x in labels)

        score = 0
        reasons: list[str] = []

        if exact_title:
            score += 50
            reasons.append("exact-title")
        elif any(norm(work.title) in norm(x) or norm(x) in norm(work.title) for x in labels):
            score += 20
            reasons.append("similar-title")

        authors = qids_from_claim(entity, "P50")
        if work.author_qid:
            if work.author_qid in authors:
                score += 40
                reasons.append("author-qid")
            elif authors:
                score -= 35
                reasons.append("other-author")

        years = years_from_wikidata_claims(entity)
        if work.year is not None and years:
            distance = min(abs(work.year - y) for y in years)
            if distance == 0:
                score += 10
                reasons.append("year")
            elif distance == 1:
                score += 5
                reasons.append("year±1")
            elif distance > 5:
                score -= 10
                reasons.append("year-mismatch")

        label = labels[0] if labels else qid
        candidates.append(
            Candidate(
                qid,
                max(0, min(100, score)),
                "+".join(reasons),
                label,
                classification.kind,
                classification.reason,
                classification.types,
                classification.forms,
                entity_cache_status,
            )
        )

    return sorted(candidates, key=lambda c: (-c.score, c.identifier))


def openlibrary_candidates(http: HttpCache, work: Work) -> list[Candidate]:
    params: dict[str, Any] = {
        "title": work.title,
        "limit": 10,
        "fields": "key,title,author_name,first_publish_year",
    }
    if work.author:
        params["author"] = work.author

    data = http.get_json(OPENLIBRARY_SEARCH, params)
    candidates: list[Candidate] = []
    wanted_surname = surname(work.author)

    for doc in data.get("docs", []):
        key = doc.get("key", "")
        m = re.fullmatch(r"/works/(OL\d+W)", key)
        if not m:
            continue
        work_id = m.group(1)

        title = doc.get("title", "")
        score = 0
        reasons: list[str] = []

        if norm(title) == norm(work.title):
            score += 55
            reasons.append("exact-title")
        elif norm(work.title) in norm(title) or norm(title) in norm(work.title):
            score += 25
            reasons.append("similar-title")

        author_names = doc.get("author_name") or []
        normalized_authors = [norm(x) for x in author_names]

        if work.author:
            if norm(work.author) in normalized_authors:
                score += 35
                reasons.append("exact-author")
            elif wanted_surname and any(
                surname(x) == wanted_surname for x in author_names
            ):
                score += 30
                reasons.append("author-surname")
            elif author_names:
                score -= 25
                reasons.append("other-author")

        candidate_year = doc.get("first_publish_year")
        if work.year is not None and isinstance(candidate_year, int):
            distance = abs(work.year - candidate_year)
            if distance == 0:
                score += 10
                reasons.append("year")
            elif distance == 1:
                score += 5
                reasons.append("year±1")
            elif distance > 5:
                score -= 10
                reasons.append("year-mismatch")

        candidates.append(
            Candidate(
                work_id,
                max(0, min(100, score)),
                "+".join(reasons),
                title,
            )
        )

    return sorted(candidates, key=lambda c: (-c.score, c.identifier))


def classify(score: int | None, match_score: int, review_score: int) -> str:
    if score is None:
        return "NO_MATCH"
    if score >= match_score:
        return "MATCH"
    if score >= review_score:
        return "REVIEW"
    return "NO_MATCH"


def classify_work_candidate(
    candidate: Candidate | None, match_score: int, review_score: int
) -> str:
    if candidate is None or candidate.classification != "WORK_LEVEL":
        return "NO_MATCH"
    return classify(candidate.score, match_score, review_score)


def best(candidates: list[Candidate]) -> Candidate | None:
    return candidates[0] if candidates else None


def safe_call(label: str, fn, errors: list[str]):
    try:
        return fn()
    except Exception as exc:
        errors.append(f"{label}: {exc}")
        return []


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("root", type=Path, help="Root of Kalliope source tree")
    ap.add_argument("-o", "--output", type=Path, default=None)
    ap.add_argument(
        "--entity-type",
        choices=("work", "poet", "artwork"),
        default="work",
        help="Entity scope to reconcile (default: work)",
    )
    ap.add_argument(
        "--cache-dir",
        type=Path,
        default=Path(".cache/kalliope-work-identifiers"),
    )
    ap.add_argument("--min-match-score", type=int, default=90)
    ap.add_argument("--review-score", type=int, default=65)
    ap.add_argument("--sleep", type=float, default=0.15)
    ap.add_argument(
        "--verbose",
        action="store_true",
        help="Log cache/network use and Wikidata candidate classification details",
    )
    ap.add_argument(
        "--only-missing",
        action="store_true",
        help="Skip a service if the identifier is already present",
    )
    ap.add_argument(
        "--apply",
        action="store_true",
        help=(
            "Write only high-confidence MATCH identifiers into work-level "
            "<identifiers>. XML formatting outside the insertion is preserved."
        ),
    )
    args = ap.parse_args()

    root = args.root.resolve()
    if not root.is_dir():
        ap.error(f"Not a directory: {root}")

    if args.entity_type != "work":
        http = HttpCache(args.cache_dir, args.sleep, args.verbose)
        return run_scoped_report(args, root, http)

    if args.output is None:
        args.output = Path("reports/identifier-reconciliation/work-identifiers.csv")

    works = scan_works(root)
    print(f"Found {len(works)} works", file=sys.stderr)

    http = HttpCache(args.cache_dir, args.sleep, args.verbose)
    applied_files = 0
    repaired_files = 0

    fieldnames = [
        "file",
        "title",
        "year",
        "author",
        "author-wikidata",
        "existing-wikidata",
        "wikidata",
        "wikidata-score",
        "wikidata-status",
        "wikidata-reason",
        "existing-openlibrary-work",
        "openlibrary-work",
        "openlibrary-score",
        "openlibrary-status",
        "openlibrary-reason",
        "existing-runeberg-book",
        "runeberg-book",
        "runeberg-book-status",
        "errors",
        "wikidata-classification",
        "wikidata-types",
        "wikidata-forms",
        "wikidata-classification-reason",
        "wikidata-cache",
    ]

    args.output.parent.mkdir(parents=True, exist_ok=True)

    with args.output.open("w", encoding="utf-8", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()

        for i, work in enumerate(works, 1):
            errors: list[str] = []

            wd_candidates: list[Candidate] = []
            if not (args.only_missing and work.existing_wikidata):
                wd_candidates = safe_call(
                    "wikidata",
                    lambda: wikidata_candidates(http, work),
                    errors,
                )

            ol_candidates: list[Candidate] = []
            if not (args.only_missing and work.existing_openlibrary):
                ol_candidates = safe_call(
                    "openlibrary",
                    lambda: openlibrary_candidates(http, work),
                    errors,
                )

            wd = best(wd_candidates)
            ol = best(ol_candidates)

            existing_wd_classification: WikidataClassification | None = None
            existing_wd_cache = ""
            if work.existing_wikidata:
                try:
                    existing_entity = fetch_wikidata_entity(
                        http, work.existing_wikidata
                    )
                    existing_wd_cache = http.last_result_source
                    existing_wd_classification = classify_wikidata_entity(
                        http, existing_entity
                    )
                except Exception as exc:
                    errors.append(f"wikidata-classification: {exc}")

            invalid_existing_wikidata = bool(
                existing_wd_classification
                and existing_wd_classification.kind != "WORK_LEVEL"
            )
            wd_status = (
                "INVALID_WORK"
                if invalid_existing_wikidata
                else (
                    "EXISTS"
                    if work.existing_wikidata
                    else classify(
                        wd.score if wd else None,
                        args.min_match_score,
                        args.review_score,
                    )
                )
            )
            wd_status = (
                wd_status
                if work.existing_wikidata
                else classify_work_candidate(
                    wd, args.min_match_score, args.review_score
                )
            )
            ol_status = (
                "EXISTS"
                if work.existing_openlibrary
                else classify(
                    ol.score if ol else None,
                    args.min_match_score,
                    args.review_score,
                )
            )

            runeberg_values: list[str] = []
            trusted_qid = (
                None if invalid_existing_wikidata else work.existing_wikidata
            )
            if not trusted_qid and wd is not None and wd_status == "MATCH":
                trusted_qid = wd.identifier

            if trusted_qid:
                try:
                    entity = fetch_wikidata_entity(http, trusted_qid)
                    runeberg_values = strings_from_claim(entity, "P3155")
                except Exception as exc:
                    errors.append(f"runeberg-from-wikidata: {exc}")

            if work.existing_runeberg_book:
                runeberg_status = "EXISTS"
                runeberg_value = work.existing_runeberg_book
            elif len(runeberg_values) == 1:
                runeberg_status = "MATCH"
                runeberg_value = runeberg_values[0]
            elif len(runeberg_values) > 1:
                runeberg_status = "REVIEW"
                runeberg_value = "|".join(runeberg_values)
            else:
                runeberg_status = "NO_MATCH"
                runeberg_value = ""

            row = {
                "file": str(work.path.relative_to(root)),
                "title": work.title,
                "year": work.year or "",
                "author": work.author or "",
                "author-wikidata": work.author_qid or "",
                "existing-wikidata": work.existing_wikidata or "",
                "wikidata": wd.identifier if wd else "",
                "wikidata-score": wd.score if wd else "",
                "wikidata-status": wd_status,
                "wikidata-reason": wd.reason if wd else "",
                "existing-openlibrary-work": work.existing_openlibrary or "",
                "openlibrary-work": ol.identifier if ol else "",
                "openlibrary-score": ol.score if ol else "",
                "openlibrary-status": ol_status,
                "openlibrary-reason": ol.reason if ol else "",
                "existing-runeberg-book": work.existing_runeberg_book or "",
                "runeberg-book": runeberg_value,
                "runeberg-book-status": runeberg_status,
                "errors": " | ".join(errors),
                "wikidata-classification": (
                    existing_wd_classification.kind
                    if existing_wd_classification
                    else (wd.classification if wd else "")
                ),
                "wikidata-types": "; ".join(
                    existing_wd_classification.types
                    if existing_wd_classification
                    else (wd.types if wd else ())
                ),
                "wikidata-forms": "; ".join(
                    existing_wd_classification.forms
                    if existing_wd_classification
                    else (wd.forms if wd else ())
                ),
                "wikidata-classification-reason": (
                    existing_wd_classification.reason
                    if existing_wd_classification
                    else (wd.classification_reason if wd else "")
                ),
                "wikidata-cache": (
                    f"{existing_wd_cache}:entity"
                    if existing_wd_classification
                    else (wd.cache_status if wd else "")
                ),
            }
            writer.writerow(row)

            if args.verbose:
                for candidate in wd_candidates:
                    print(
                        f"Wikidata candidate {candidate.identifier}: "
                        f"score={candidate.score} "
                        f"classification={candidate.classification} "
                        f"types=[{'; '.join(candidate.types)}] "
                        f"forms=[{'; '.join(candidate.forms)}] "
                        f"final={classify_work_candidate(candidate, args.min_match_score, args.review_score)} "
                        f"reason={candidate.classification_reason} "
                        f"cache={candidate.cache_status}",
                        file=sys.stderr,
                    )

            if args.apply:
                additions: dict[str, str] = {}
                if invalid_existing_wikidata:
                    try:
                        if remove_work_identifier(work.path, "wikidata"):
                            repaired_files += 1
                    except Exception as exc:
                        print(f"REPAIR ERROR {work.path}: {exc}", file=sys.stderr)
                if not work.existing_wikidata and wd is not None and wd_status == "MATCH":
                    additions["wikidata"] = wd.identifier
                if (
                    not work.existing_openlibrary
                    and ol is not None
                    and ol_status == "MATCH"
                ):
                    additions["openlibrary-work"] = ol.identifier
                if (
                    not work.existing_runeberg_book
                    and runeberg_status == "MATCH"
                    and runeberg_value
                ):
                    additions["runeberg-book"] = runeberg_value

                if additions:
                    try:
                        if apply_work_identifiers(work.path, additions):
                            applied_files += 1
                    except Exception as exc:
                        print(f"APPLY ERROR {work.path}: {exc}", file=sys.stderr)

            print(
                f"{i}/{len(works)} {work.title!r}: "
                f"WD={row['wikidata-status']} {row['wikidata'] or '-'}; "
                f"OL={row['openlibrary-status']} {row['openlibrary-work'] or '-'}; "
                f"Runeberg={row['runeberg-book-status']} {row['runeberg-book'] or '-'}",
                file=sys.stderr,
            )

    print(f"Wrote {args.output}", file=sys.stderr)
    if args.apply:
        print(
            f"Applied identifiers to {applied_files} XML files; "
            f"repaired invalid Wikidata identifiers in {repaired_files} XML files",
            file=sys.stderr,
        )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
