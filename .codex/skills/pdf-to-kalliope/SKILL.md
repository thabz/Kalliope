---
name: pdf-to-kalliope
description: Convert a complete scanned PDF into a complete, proofread Kalliope XML work with title-page assets, metadata, references, validation, and a GitHub pull request. Use whenever a user asks to import, transcribe, OCR, digitize, or convert a scanned book, poetry collection, anthology, or similar PDF into Kalliope.
---

# PDF to Kalliope

Convert a complete scanned PDF into a complete Kalliope work and, after the
required review checkpoint, deliver it as a complete GitHub pull request.

The task is not merely to extract readable text. The result must be a faithful,
complete, source-backed and validated Kalliope edition.

## Scope

The input is always a PDF representing a complete physical publication.

The output is always a complete Kalliope work XML. Do not deliver isolated poems
or a partial transcription unless the source itself is incomplete and that
limitation is explicitly documented.

The normal deliverables are:

- one complete Kalliope work XML
- every relevant poem and prose text from the publication
- complete work-level and text-level metadata
- source and page references
- exact internal source-page markers with facsimile image filenames
- a work-level declaration that page-break markup is complete
- references to existing Kalliope persons and texts
- translation and original-work relations where they can be established
- a JPEG of the title page
- a JPEG of a separate graphic front cover when one exists
- explicit XML `TODO:` notes for genuine unresolved questions
- a clean, validated repository change
- a complete GitHub pull request after user approval

## Authority and required documentation

Before changing files:

1. Read `AGENTS.md`.
2. Read `docs/style-guide.md`.
3. Read at least:
   - `docs/xml-work-format.md`
   - `docs/titelbladsbilleder.md`
   - `docs/facsimile-korrektur.md`
   - `docs/ocr-korrektur-laerebog.md`
   - `docs/kalliope-masterplan.md`
4. Read any additional documentation to which those files refer for the
   concrete task.
5. Inspect several comparable, current works in the corpus when necessary to
   determine established Kalliope practice.

This skill defines the workflow. It does not reproduce the complete Kalliope
XML specification.

The current repository documentation and build system define the XML format.
Existing corpus files provide examples, but current documentation takes
precedence over accidental legacy practice.

The fixed `p1` and `p2` image convention in this skill is an explicit
workflow-specific requirement:

- `p1` is always the title page.
- `p2` is always the optional graphic front cover.

Do not renumber them according to their physical order in the PDF.

## Core editorial principle

**The facsimile is authoritative.**

The PDF's page images are the source of truth. OCR, existing transcriptions,
metadata, dictionaries, metre and expected stanza forms are aids only.

Preserve:

- the source's wording
- historical spelling
- capitalization where textually meaningful
- punctuation
- verse lines
- stanza divisions
- physical page boundaries inside included texts
- indentation
- headings and numbering
- subtitles and supertitles
- mottoes and quotations
- footnotes and other notes
- relevant typography supported by Kalliope

Do not silently:

- modernize spelling or punctuation
- improve awkward wording
- regularize an unusual form
- reconstruct an uncertain reading without marking it
- merge distinct editions or versions
- omit prose because the work is primarily poetry
- trust OCR merely because it looks plausible

An unusual printed form is not an error merely because it looks strange.

## 1. Establish the repository context

Before processing the PDF:

1. Confirm the intended poet/author ID and work ID from the repository, the
   source and established naming practice.
2. Determine whether the work belongs under an existing person.
3. Check for an existing edition, duplicate work, variant or unfinished import.
4. Read comparable work XML files.
5. Determine which repository files and image directories will be affected.
6. Check `git status --short`.
7. Check required dependencies before OCR or editing begins. At minimum verify
   the repository's Node dependencies and the PDF/XML commands used by the
   chosen workflow, for example:

   ```shell
   npm install
   command -v node pdfimages pdftoppm xmllint
   ```

   Also verify every selected OCR engine, such as `tesseract`. Stop and report
   a missing required dependency immediately; do not discover it after a
   partial transcription or at the review checkpoint.

If the ordinary worktree contains unrelated changes, use an appropriate
separate worktree or otherwise ensure that unrelated changes cannot enter the
result.

Do not invent a new person or work ID before searching the corpus.

## 2. Inventory the complete PDF

Inspect the entire publication before transcription.

Create a temporary page inventory covering every PDF page. Record at least:

- PDF page number
- printed page number, when present
- stable facsimile page-image filename, for example `019.jpg`
- page type
- text or section represented
- first and last visible text
- whether the page continues from or onto another page
- transcription status
- structure-check status
- proofreading status
- unresolved questions

Useful page classifications include:

- cover
- graphic front cover
- half-title
- title page
- colophon
- dedication
- preface
- introduction
- motto
- table of contents
- poem
- prose
- notes
- afterword
- advertisement
- blank page
- other

No relevant page may disappear unnoticed between PDF analysis, OCR,
transcription and XML generation.

The page inventory is working material and should normally not be committed.

### Exclude as text

Do not create Kalliope text entries for:

- advertisements
- the table of contents

The table of contents may be used as supporting evidence for titles, ordering,
authorship and completeness, but it is not itself included as a text.

Advertisements must be omitted.

### Include as texts

Relevant prose and paratext must never be skipped merely because the
publication is categorized as poetry.

Include, when present and textually relevant:

- introductions
- prefaces
- afterwords
- dedications
- mottoes
- explanatory prose
- editorial notes
- other relevant prose or paratext

A prose introduction must be represented as its own Kalliope text according to
the current XML format. Do not reduce it to a summary or work-level note.

Use the title page, colophon and similar pages as metadata sources even when
they are not represented as separate texts.

## 3. Extract the title page and optional graphic front cover

Identify the actual title page and determine whether the publication also has a
separate graphic front cover.

The filenames have fixed meanings and do not follow PDF page order:

- `p1` is always the title page.
- `p2` is the optional graphic front cover, even though it normally appears
  before the title page in the PDF.

Use the poet/author ID and work ID used by the Kalliope XML.

### Title page: required `p1`

Extract the title page from the PDF page image and save it as a JPEG at:

```text
public/images/<poet-id>/<work-id>-p1.jpg
```

The title page image is required for every imported work unless the source
genuinely contains no title page. In that exceptional case, add an explicit
`TODO:` note and explain the limitation in the review summary and PR
description.

The JPEG must represent the printed title page itself. Do not generate it from
the PDF's OCR layer. Use `$prepare-kalliope-titlepage` and follow
`docs/titelbladsbilleder.md` to classify the source, straighten the text,
remove scanner background, preserve the complete physical page and produce the
QA report. Work on a scratch candidate and promote it to the final `p1` path
only after the skill reports `pass`. A result marked `manual-review` must not
overwrite an existing image.

Reference the image from the work header using the current Kalliope image
format. The established title-page type is `titlepage`; follow
`docs/xml-work-format.md` and comparable current works for the complete markup.

The XML normally references the basename:

```xml
<picture type="titlepage" src="<work-id>-p1.jpg">
  ...
</picture>
```

Use current repository conventions for `primary`, captions and other
attributes.

### Graphic front cover: optional `p2`

Some publications contain a separate, visually designed cover before the title
page. It may use illustration, ornament, decorative typography, special paper
or colour.

When a genuine separate graphic front cover exists, extract it as a JPEG and
save it at:

```text
public/images/<poet-id>/<work-id>-p2.jpg
```

Preserve colour when the source is coloured.

Reference it from the work header using the current Kalliope image format. The
established type for a front cover is `frontpage`:

```xml
<picture type="frontpage" src="<work-id>-p2.jpg">
  ...
</picture>
```

Do not create `p2` merely because the PDF contains an additional preliminary
page. It must be a genuine cover or a clearly distinct graphic presentation of
the publication.

Do not swap `p1` and `p2` to match the source order. For example:

```text
PDF page 1: graphic front cover  -> <work-id>-p2.jpg
PDF page 3: title page           -> <work-id>-p1.jpg
```

### Transcribe the title page

Transcribe the title page's bibliographic content into the work header using
the current Kalliope format and comparable corpus examples.

Extract all responsibly supported information, including where present:

- full title
- subtitle
- author name
- translator or editor
- edition statement
- publication place
- publisher
- printer
- publication year
- motto or attribution when relevant
- other bibliographically meaningful wording

When the title page is printed in all capitals, do not mechanically preserve
all-caps typography in XML metadata or the title-page caption. Convert it to
ordinary readable capitalization while preserving:

- the exact wording
- historical spelling
- names
- punctuation
- bibliographic information

Use linguistic judgment. Do not blindly apply title case to every word.

This capitalization normalization applies to title-page metadata and its
bibliographic transcription. It does not authorize modernization of poems,
prose or quoted source text elsewhere in the work.

## Mandatory draft and proofreading lifecycle

Treat generated XML as a draft. `txt2xml` MUST emit `status="incomplete"` and
MUST NOT emit `<quality>` or any proofreading flag. Do not mark a PDF import
complete from transcription, OCR agreement, one proofreading pass or passing
tests alone.

Use this lifecycle:

1. The producer creates and edits the draft while it remains `incomplete`.
2. The producer performs the first full page-by-page facsimile proofreading.
   Afterward each included text may receive `korrektur1,kilde,side`; the work
   remains `incomplete`.
3. A different model or session reviews every relevant page read-only. There
   is exactly one XML editor; the independent reviewer reports findings and
   does not edit the XML.
4. The editor fixes findings. The independent reviewer rechecks each fix.
   `fixed` is unresolved; only `verified`, `rejected` or `withdrawn` is final.
5. Record that all OCR, page, stanza and indentation candidates were assessed
   against the facsimile. Run XML and repository tests.
6. Only after the final review passes, add `korrektur2`, set the work to
   `complete`, and add the independent reviewer's model attestation to
   `<workhead>` as documented in `docs/xml-work-format.md`. Rerun tests and
   create the frozen checkpoint from this final state.

The published attestation contains only `model` and an ISO 8601 `datetime`
with timezone. Do not add a hash, sidecar reference or automatic invalidation
metadata to it. Preserve older attestations when a later model adds another.

## 4. Ignore the PDF's existing OCR layer

The PDF may contain an OCR text layer, but it is known to be unreliable.

Do not use that layer as:

- the primary transcription
- the authoritative reading
- the source of line or stanza boundaries
- evidence that a page has been fully processed

It may be inspected for diagnostics or discrepancy detection, but it must not
replace fresh OCR from the page images or direct visual proofreading.

## 5. Produce fresh OCR from the page images

Follow `docs/facsimile-korrektur.md` when extracting embedded images or
rendering PDF pages.

For historical Danish Fraktur, use `$prepare-fraktur-ocr` before transcription
to create a validated scratch bundle with cleaned image variants, distributed
text-dense benchmark pages and separate Tesseract readings. Consume its TXT and
TSV files as OCR evidence while retaining the bundle's page IDs and hashes. Do
not copy its sampling heuristic into this skill, infer layout from its TSV
coordinates or treat its recommended configuration as source authority.

Render the page images used as OCR input at 300 DPI. This requirement applies
to OCR working images, not to the published facsimile extraction: generate the
published facsimiles with the repository's ordinary facsimile tool and its
established extraction policy.

Maintain an explicit mapping between:

- printed page
- PDF page
- extracted or rendered image filename

Never assume that these numbers are identical.

Perform at least two meaningfully different OCR passes or recognition
strategies on every relevant textual page. Suitable differences include:

- different OCR engines
- different page-segmentation modes
- different layout assumptions
- an OCR pass plus an independent visual transcription pass

When using Tesseract, different PSM modes may provide useful complementary
readings. Prefer genuinely independent recognition methods when practical.

Keep OCR results separate so that disagreements can be detected.

Use OCR to:

- create transcription candidates
- locate likely omissions
- find suspicious characters and words
- compare readings
- detect missing or duplicated lines
- prioritize visual inspection

Do not use OCR blank lines as proof of stanza boundaries.

Multiple OCR passes may share the same error. Agreement raises confidence but
does not overrule the facsimile.

Keep generated page images, OCR outputs, crops and reports in a clearly
contained scratch location. They must not enter the pull request unless the
repository explicitly requires a particular generated asset.

### Fraktur-OCR profile

For historical Danish Fraktur, run the side-aware OCR candidate audit in
addition to the ordinary checks:

```shell
node .codex/skills/pdf-to-kalliope/scripts/audit-ocr-candidates.js \
  path/to/work.xml path/to/inventory.jsonl > /tmp/<work>-ocr-candidates.jsonl
```

Use its Fraktur profile to prioritise visual inspection of likely recognition
errors, especially long-s and related `f`/`s` readings, `c`/`e`, `æ`/`a`/`e`,
`ø`/`o`, `oe`/`aa` and `skj`/`sj` confusions, inserted spaces, digits or
symbols inside words, broken quotation marks and duplicated lines. It also
flags recurring word-shaped signals such as `forst`/`først` and `gjor`/`gjør`.

The audit produces candidates only. Never apply its readings as global
substitutions. Historical forms such as `høi`, `skiøn`, `kiær`, `giøre` and
`maaskee` may be correct in the source, and a modern spelling or dictionary
cannot overrule the facsimile. Check the complete local context, capitalization,
word boundary and printed glyph before changing XML. If the facsimile does not
settle the reading, preserve the uncertainty with a `TODO:` note or finding
rather than guessing.

The detailed general rules for facsimile proofreading, stanza structure,
indentation and page coverage remain in `docs/facsimile-korrektur.md` and
`docs/ocr-korrektur-laerebog.md`; consult those documents instead of duplicating
their full procedures here.

Plain OCR output is never evidence for horizontal layout. This applies equally
to Fraktur and Antiqua: fresh OCR may help locate lines, but indentation must be
determined from the page image. OCR coordinates or bounding boxes may identify
candidates only and cannot overrule the facsimile.

## Auditable side and review records

Before editing the transcription, create two machine-readable scratch files:

```shell
node .codex/skills/pdf-to-kalliope/scripts/build-page-inventory.js \
  fdirs/<poet>/<work>.xml /tmp/<work>-pages.jsonl
touch /tmp/<work>-findings.jsonl
```

The inventory contains one JSON object per printed page with the text ID,
printed page, facsimile filename, first and last transcribed line, expected
transition (`text-start`, `pb` or `pb-within-word`), review status, reviewer
and disposition. The generated rows are a starting point, not source evidence:
compare every row with the facsimile, correct its anchors and facsimile mapping,
then set `status` to `reviewed`. A page that starts a new `<text>` remains an
explicit `text-start` exception and must not acquire a synthetic `<pb>`.

These files and commands are process-neutral. They do not depend on Codex,
CMUX or a particular agent. The producer can use them during the first pass,
but the completion checkpoint requires every page to be assigned to a reviewer
whose stable ID differs from the producer ID. Coordination messages are
outside the data contract. When the surrounding workflow provides a
coordination channel such as CMUX, report blockers, decisions and review
milestones there, but do not make any audit command depend on that channel.

During distributed review, designate exactly one XML editor. All other
reviewers work read-only and add findings to the shared contract through the
coordinator or another serialized update path. Never allow concurrent XML
writers.

Record every review finding as one JSONL object. Each object MUST have a stable
`id`, `batch`, `reviewer`, `text_id`, `printed_page`, `facsimile`, stable
`anchor`, `severity`, `description`, `status`, `disposition`, `evidence` and
the commit or diff `snapshot` it concerns. Legal statuses are `open`, `fixed`,
`rejected`, `withdrawn` and `verified`. Never delete withdrawn findings; retain
the withdrawal reason and evidence. Validate the register with:

```shell
node .codex/skills/pdf-to-kalliope/scripts/findings-register.js validate \
  /tmp/<work>-findings.jsonl
```

The command exits unsuccessfully for malformed records or any `open` or
`fixed` finding. A `verified` finding requires `verified_by`.
Use the `status` subcommand to make an auditable status transition instead of
rewriting IDs:

```shell
node .codex/skills/pdf-to-kalliope/scripts/findings-register.js status \
  /tmp/<work>-findings.jsonl FINDING-ID fixed \
  'Rettet mod facsimilet' 'facs 019.jpg, før/efter ...' DIFF-SHA

node .codex/skills/pdf-to-kalliope/scripts/findings-register.js status \
  /tmp/<work>-findings.jsonl FINDING-ID verified \
  'Genkontrolleret mod facsimilet' 'facs 019.jpg, rettelsen stemmer' \
  DIFF-SHA REVIEWER-ID
```

After each editing batch, run the semantic page audit against the independently
reviewed inventory:

```shell
node .codex/skills/pdf-to-kalliope/scripts/audit-pagebreaks.js \
  fdirs/<poet>/<work>.xml /tmp/<work>-pages.jsonl
```

It checks complete page coverage, exact text-start exceptions, the first and
last line assigned to each page, marker type, printed page and facsimile. It
therefore detects a missing or duplicate transition, a marker on the wrong
page, lines left on the preceding page, and a marker that wrongly splits or
fails to preserve a word. The inventory is the facsimile-backed semantic
contract; generating it from the same bad XML and accepting it without visual
review is not an audit.

Run the side-aware historical OCR profile as a separate candidate pass:

```shell
node .codex/skills/pdf-to-kalliope/scripts/audit-ocr-candidates.js \
  fdirs/<poet>/<work>.xml /tmp/<work>-pages.jsonl \
  > /tmp/<work>-ocr-candidates.jsonl
```

It reports stable anchors with text ID, printed page and facsimile for OCR
symbols such as `{ } % $`, an `Image` token, digits inside words, suspicious
internal spaces, long-s substitutions, adjacent duplicate lines, punctuation
without spacing and implausible singleton characters. Every candidate still
requires direct facsimile review.

## 6. Segment the publication before final transcription

Determine the publication's complete logical structure before considering the
XML complete.

Identify:

- work title and bibliographic hierarchy
- sections and subsections
- each text's beginning and end
- poem titles and titleless poems
- prose texts
- text order
- subtitles and supertitles
- mottoes
- author and translator attributions
- printed numbering
- page ranges
- continuations across page boundaries
- every internal source-page boundary and its facsimile image filename
- notes attached to a complete text
- footnotes attached to specific passages

Check both the first and last relevant page directly. A presumed page range or
table of contents may be wrong.

Do not let a new physical page create a false text, stanza or paragraph
boundary.

## 7. Create the complete Kalliope XML

Create one complete work XML according to `docs/xml-work-format.md` and related
current documentation.

Do not deliver a collection of loose poem files.

Include every relevant text in source order.

Fill all fields that can be responsibly established from:

- the publication itself
- existing Kalliope data
- reliable bibliographic sources
- reliable external sources when necessary

Actively determine, as applicable:

- root work attributes
- work ID and author ID
- work title and subtitle
- publication year
- source and facsimile metadata
- the `<pagebreaks/>` completeness declaration in the work header
- title-page and cover pictures
- section structure
- text IDs
- text titles
- first lines
- language
- page ranges
- dates
- authorship
- translator and original author
- notes
- relations to existing texts
- relevant keywords and person references
- status and completeness

Do not leave metadata absent merely because finding it requires a corpus
lookup.

Do not fabricate metadata when no responsible answer exists. Use an explicit
`TODO:` note for a genuine unresolved editorial question.

Titles and first lines must remain free of XML markup when the current format
requires plain text.

Title metadata must also omit terminal punctuation. Remove a final period,
comma, colon, semicolon, question mark or exclamation mark from `title` and its
index, table-of-contents, link and breadcrumb variants even when it appears in
the printed heading. This normalization does not apply to subtitles,
supertitles or the diplomatic body transcription, whose source punctuation
must still be preserved. Follow `docs/xml-work-format.md` for the complete list
of affected title fields.

## 8. Encode every internal source-page break

Preserve every physical source-page transition that occurs inside an included
text body with a Kalliope `<pb>` marker.

After all included bodies have been checked, the work header MUST contain:

```xml
<pagebreaks/>
```

This is a completeness declaration. It means that every internal page boundary
has been considered and encoded where applicable. It does not mean that the XML
contains at least one `<pb>`. If every poem and prose text fits on one source
page, the work still requires `<pagebreaks/>` even though it has no `<pb>`
elements.

At each internal transition, place the marker at the exact beginning of the new
source page:

```xml
Last verse line on printed page 11
<pb n="12" facs="019.jpg"/>First verse line on printed page 12
```

The attributes have distinct meanings:

- `n` is the printed number or label of the new page. Omit it when the page has
  no printed label.
- `facs` is REQUIRED and contains only the stable filename of the facsimile
  image for the new page, never a path. Kalliope's generated page images are
  zero-based and use three digits, so PDF page 20 is `019.jpg`.

Take both values from the verified page inventory. Never derive `facs` from the
printed page number or put the PDF page number in `n`. Verify that the filename
is the one produced for that PDF page by the repository's facsimile workflow.

If the page changes inside a verse line, prose sentence, word, quotation, note
or other continuous passage, place `<pb>` inline at the exact point. If it
changes between verse lines or stanzas, prefix the first content on the new page
with `<pb>`; never put the marker on an XML line of its own. The marker is
zero-width semantics. It must not create a verse line, blank line, stanza,
paragraph or text boundary.

When the first line on the new page is indented, put the indentation after the
page marker: `<pb n="12" facs="019.jpg"/>    Indented line`. Never encode it as
`    <pb n="12" facs="019.jpg"/>Indented line`; the indentation belongs to the
new page's line, while `<pb>` must precede its first rendered whitespace or
character. Audit this ordering explicitly whenever indentation is corrected at
a page boundary.

Do not insert `<pb>` merely at the beginning or end of each `<text>` to repeat
its `<source pages="...">`. A page transition between two separate text entries
is not internal to either body and therefore does not receive a marker.

Write every text-level `source/@pages` as one full page label or a closed,
nondecreasing interval. Expand bibliographic abbreviations before writing XML:
use `102-108`, never `102-08`, and never leave an open value such as `106-`.

Across the complete work in document order, Arabic `pb/@n` values and numeric
`pb/@facs` filenames must never decrease. Gaps are valid because transitions
between separate text entries do not receive markers. Roman `n` labels are not
part of the machine ordering check.

Use `ignore-tests="pagebreak-count"` on one text only when a documented
pagination anomaly makes a legal page interval differ from the number of
internal body transitions. Never use it to permit an abbreviated, open or
decreasing `pages` value. The exception does not relax marker placement,
`facs`, or ordering requirements. Put it on the work only when the anomaly
applies throughout the publication.

The page marker does not affect public rendering, but it must remain in the
source XML for structural analysis, including detection of stanza continuations
and physical line wrapping.

After the final XML has been assembled, run the targeted page-break test:

```shell
npm test -- --runInBand __tests__/pagebreaks.test.js
```

This test reads the serialized XML and rejects a `<pb>` that ends an XML line.
Every marker must prefix the first text or inline element on its new source page
on that same XML line. A clean stanza analysis does not replace this check,
because stanza analysis may remove page-break markup before counting lines.
Rerun the test after every later change that can move `<pb>` elements or alter
body whitespace.

## 9. Reconstruct verse lines correctly

OCR line wrapping is not poetic structure.

Determine actual verse lines from:

- the facsimile
- typography and indentation
- grammatical and textual continuity
- neighbouring stanzas
- metre and rhyme as supporting evidence
- recurring structural patterns

A verse line that is physically wrapped because it does not fit the printed
measure must be rejoined to the line to which it belongs.

Do not preserve a page-width wrap as a new verse line.

Pay particular attention to:

- long wrapped verse lines
- short indented lines
- page breaks inside a line or stanza
- stanza numbers
- section numbers
- headings mistaken for verse
- running headers and page numbers
- ornamental separators
- dropped or duplicated OCR lines

### Use stanza structure as a diagnostic

Determine the dominant stanza pattern when the poem has one.

After initially structuring each poem, you MUST run the bundled stanza analysis
with a temporary JSON file containing only that poem's body:

```json
{
  "body": "First verse line\nSecond verse line\n\nNext stanza"
}
```

```shell
node .codex/skills/pdf-to-kalliope/scripts/analyze-stanzas.js /tmp/poem.json
```

Inspect every reported candidate against the facsimile. Run the analysis again
after changing stanza boundaries. Do not consider a poem structurally checked
until this command has been run and every candidate has been resolved against
the facsimile. The report is diagnostic only: a candidate may be a legitimate
irregularity, and `no_candidates`, `no_stable_pattern` or
`insufficient_evidence` does not prove that the transcription is correct.

If nearly every stanza contains four verse lines, a transcription showing a
one-line stanza followed by a three-line stanza is a strong error candidate.

Likewise, an unexplained eight-line stanza may be two accidentally joined
four-line stanzas.

Use this pattern only to find places requiring inspection. Never change a
structure solely to make the counts regular.

Some poems are intentionally irregular. The facsimile remains authoritative.

Resolve every stanza-boundary candidate before using indentation results. A
missing boundary can hide a repeated indentation profile by combining two
stanzas. After correcting or explicitly rejecting all stanza candidates, build
fresh input from that reviewed structure and run the bundled indentation
analysis while preserving every leading space and every blank stanza separator:

```shell
node .codex/skills/pdf-to-kalliope/scripts/analyze-indentation.js /tmp/poem.json
```

The optional JSON field `page_breaks` contains the one-based verse-line numbers
that begin a new facsimile page. Add it when the page mapping is known. Keep
numbered division headings such as `<nonum><center>II.</center></nonum>` in the
body so the tool can assess each division separately. Remove other metadata and
non-verse lines from the temporary input.

Inspect every reported indentation candidate against the facsimile. A uniform
offset at a page break is suspicious, but a new numbered division may
legitimately use its own indentation profile. Rerun the analysis after changing
indentation. For a stanza mismatch, compare every item in `mismatches` with the
facsimile and record the disposition. The report is diagnostic only; a stable
profile or no candidates does not prove that indentation is correct.

`no_stable_pattern` is not a passing result for a reviewed poem. First confirm
that stanza boundaries are correct and rerun the analysis. If the status
remains, record a finding with the facsimile-based indentation assessment and
resolve it as a genuine irregularity or a corrected transcription. Never accept
the status merely because the analyzer emitted no line-level candidates.

Continue structural analysis across page breaks. A page break is not in itself
a stanza break.

### Rerun structural analysis from the final XML

The first analysis performed during transcription is not the final check.
After the complete work file has been assembled, page breaks and blank lines
have been inserted, and all manual or automated rewrites are finished, extract
each poem body again from the final serialized XML into fresh temporary JSON.
Run both `analyze-stanzas.js` and `analyze-indentation.js` on every poem.

Check every candidate from this final run against the facsimile and either fix
it or document why the deviation is intentional. If the XML changes after the
final run—including restoration, bulk replacement, formatting, or moving a
`<pb>` element—the results are stale, and both analyses must be rerun on the
new final file. Include the final results in the review checkpoint.

Keep headings, stanza numbers and decorative lines separate from numbered verse
lines using the XML structures documented by the repository.

Use the bundled whole-work wrapper for the final run instead of manually
omitting poems:

```shell
node .codex/skills/pdf-to-kalliope/scripts/analyze-whole-work.js \
  fdirs/<poet>/<work>.xml > /tmp/<work>-structure.json
```

The wrapper extracts every `<poetry>` block from the final XML, invokes both
existing analyzers, preserves text ID and page range, aggregates all candidates
and flags a very long block with no stanza boundaries. Resolve every reported
candidate in the findings register.

## 10. Preserve indentation using spaces

Indentation is part of the text's visual and poetic structure.

Represent indentation using leading spaces according to the current Kalliope
implementation.

Do not copy OCR indentation blindly. OCR frequently creates false indentation
around:

- drop capitals
- ornaments
- short lines
- damaged margins
- unusual glyphs
- centred headings

Determine indentation visually from the facsimile.

Compare recurring indentation profiles across several stanzas when useful. For
example:

```text
First line
    Second line
Third line
    Fourth line
```

Preserve genuine irregular indentation when it is visibly present.

For repeated same-length stanzas, compare corresponding line positions across
all stanzas. Inspect isolated disagreements as carefully as multi-line shifts;
several scattered one-line errors may otherwise evade a run-based analysis.

## 11. Represent prose correctly

Treat prose according to prose structure rather than verse structure.

Preserve:

- paragraph boundaries
- headings
- quotations
- footnotes
- relevant typographic distinctions

Do not convert prose into poetry merely because OCR produces short physical
lines.

Every relevant prose introduction, preface, afterword or similar section must
be represented as its own text entry according to the Kalliope XML format.

Prose must never be silently omitted.

## 12. Handle mottoes, quotations and non-verse lines

Represent mottoes and quotations semantically according to the current XML
format.

A motto is normally a quotation, not a subtitle.

Do not let:

- mottoes
- attributions
- signatures
- dates
- section headings
- stanza numbers
- ornaments
- separators

become ordinary numbered verse lines merely because OCR placed them inside the
text block.

Inspect comparable corpus examples when the correct representation is unclear.

## 13. Place notes and footnotes correctly

Distinguish among:

- notes applying to the entire work
- notes applying to one poem or prose text
- footnotes attached to a particular word, line or passage

A note concerning the whole poem belongs in the text header using the current
note structure.

A footnote attached to a particular place in the text must be inserted at that
place using the Kalliope XML structure. Do not collect footnotes at the end
merely because OCR extracted them there.

Transcribe every source footnote verbatim from the facsimile. Preserve its
wording, historical spelling, capitalization and punctuation. The
`<footnote>` element contains only the printed footnote text, not the printed
marker. Never prepend the referenced word, an inferred subject, `betyder` or
any other editorial clarification. For example, when the source text marks
`Ajl` and the complete printed footnote reads `andet end Gjæld.`, encode only
`<footnote>andet end Gjæld.</footnote>`.

Proofread every footnote and note marker directly against the facsimile. Do not
reuse a paraphrase or expanded wording from OCR, provisional metadata or a
previous transcription without checking it against the printed note.

Preserve the association between each marker and its note.

## 14. Mark unresolved questions with XML TODO notes

Do not hide uncertainty behind a plausible guess.

Try first to resolve a doubtful place by:

1. inspecting the facsimile at higher magnification
2. comparing fresh OCR passes
3. examining the surrounding page and repeated letterforms
4. checking another copy or scan of the same physical edition when available
5. checking relevant corpus examples or bibliographic evidence

When a rare question still cannot be resolved responsibly, insert an XML note
at the most relevant location.

The note text must begin exactly with uppercase `TODO:` followed by a concise,
actionable description.

Example:

```xml
<note>TODO: Tvivl om sidste ord i verslinjen; kontrollér originalen manuelt.</note>
```

A `TODO:` note may be placed:

- in the work header for a work-level problem
- in a text header for a poem-level or prose-level problem
- at the relevant point in the body when the XML format permits it

Use the note placement and syntax supported by current Kalliope XML.

Continue processing the rest of the publication after recording a local
uncertainty. Do not stop the entire import for an isolated doubt that can be
reviewed manually later.

Do not use `TODO:` as a substitute for ordinary research or proofreading.

## 15. Extract dates and other textual metadata

Actively inspect every text for metadata embedded in the printed source.

Follow the current repository rules for full dates. Preserve the diplomatic date
in the transcription and add the normalized metadata date without altering the
printed text.

Determine whether a date represents, for example:

- writing
- performance
- event
- publication

Only record a date at the precision supported by the current XML rules.

Also inspect for:

- alternate titles
- subtitles
- author signatures
- location statements
- translator statements
- source-language information
- original-work information
- variant information
- relationships to named persons or texts

## 16. Resolve persons through the existing corpus

Whenever the publication names or refers to a poet, author, translator, editor
or other relevant person, search the existing Kalliope corpus before creating
anything new.

This is especially important for:

- translated poems
- adaptations
- mottoes and quotations
- dedications
- texts by contributors other than the work's primary author
- notes that mention another poet

Follow `AGENTS.md` for corpus lookup.

Use the generated database `public/api/kalliope.sqlite` as the first choice
when the required information is available there. Read
`docs/sqlite-index.md` first.

Use source XML after the database lookup when necessary to confirm:

- the correct person ID
- name variants
- pseudonyms
- initials
- historical spellings
- existing relationships
- current markup conventions

Do not create a duplicate person because the printed name differs from the
preferred corpus name.

If a new person genuinely must be created, follow all current person-format,
source and validation rules.

## 17. Investigate translations and originals

When the task includes inserting an identified original text for a translation,
also use `$add-translation-original`; its rules govern version selection,
source priority and the exact translation relation.

When a text appears to be translated, adapted or based on another work,
actively investigate:

- the original author
- the original title or first line
- the original language
- the exact source text when identifiable
- an existing Kalliope person
- an existing Kalliope representation of the original
- the appropriate relationship supported by the XML model

Search Kalliope first.

Use reliable external sources when the corpus does not contain enough
information.

Do not state a translation relationship or original title without adequate
evidence.

When the original author is known but the precise original cannot be found, use
the existing Kalliope mechanism for an unknown original where applicable.

Add a `TODO:` note when the remaining uncertainty requires manual editorial
review.

## 18. Detect variants and duplicates

Compare each imported text with the existing corpus using, as appropriate:

- normalized title
- first line
- last line
- author
- year
- stanza count
- text length
- distinctive phrases
- textual similarity

Use normalization only for searching and comparison. Do not normalize the
published transcription.

Determine whether the new occurrence is:

- a distinct text
- the same text in another physical publication
- an identical text occurrence
- a variant
- a revision
- a translation
- an adaptation
- an unresolved possible match

Follow the current Kalliope model and documentation when representing the
relationship.

Do not silently replace an existing occurrence with the new source.

## 19. Perform two separate full proofreading phases

Generation of plausible XML is not completion.

After the initial XML exists, perform the producer's systematic proofreading
pass and then the independent review described above, following
`docs/facsimile-korrektur.md`.

Use `docs/facsimile-korrektur.md` as the complete proofreading checklist. In
this skill, the mandatory outcomes are: every relevant page is read directly
against the XML, every discrepancy is resolved against the facsimile, and the
side inventory, structural analyses, notes, typography and page-break audit are
all reconciled with the final file.

Both passes must cover the complete relevant page range. The independent pass
must be read-only, and reviewer findings must be rechecked after the editor's
changes.

OCR comparison is a supplement to, not a replacement for, direct visual
proofreading.

## 20. Verify completeness

Before considering the work complete, account for every relevant page and
textual component.

Explicitly verify that:

- every relevant poem is included
- every relevant prose text is included
- introductions are included
- prefaces are included
- afterwords are included
- relevant dedications are included
- relevant mottoes are included
- relevant editorial notes are included
- footnotes have not been dropped
- no continuation over a page boundary is missing
- every internal source-page transition has exactly one correctly placed `<pb>`
- every `<pb>` has the correct non-empty `facs` filename
- Arabic `pb/@n` values and numeric `pb/@facs` filenames never decrease in
  document order, while gaps are allowed
- `<workhead>` contains `<pagebreaks/>`, even when there are no `<pb>` elements
- no heading or numbered section has disappeared
- source order is preserved
- advertisements are excluded
- the table of contents is excluded as a text
- title-page metadata is complete
- the title page has been saved as `p1`
- title-page image QA passed according to `docs/titelbladsbilleder.md`, or an
  unresolved exceptional source problem is explicitly documented
- a genuine graphic front cover, when present, has been saved as `p2`
- `p1` and `p2` have not been swapped to match PDF order

Completeness is as important as character accuracy.

## 21. Run machine-assisted quality checks

After proofreading, run the current repository checks for OCR candidates and
common transcription problems.

Follow the commands and procedures in `docs/facsimile-korrektur.md`.

As a current baseline, include the relevant forms of:

```shell
npm run report-ocr-candidates
node .codex/skills/pdf-to-kalliope/scripts/audit-ocr-candidates.js WORK.xml INVENTORY.jsonl
node .codex/skills/pdf-to-kalliope/scripts/audit-pagebreaks.js WORK.xml INVENTORY.jsonl
node .codex/skills/pdf-to-kalliope/scripts/analyze-whole-work.js WORK.xml
node .codex/skills/pdf-to-kalliope/scripts/findings-register.js validate FINDINGS.jsonl
xmllint --noout path/to/work.xml
npm test -- --runInBand __tests__/pagebreaks.test.js
git diff --check
npm test -- --runInBand
```

Repository documentation and package scripts may evolve; use the current
documented commands rather than preserving an obsolete command from this skill.

Also perform targeted checks for:

- duplicate neighbouring lines
- digits inside words
- suspicious punctuation inside words
- trailing whitespace
- lost or duplicated headings
- broken numbering sequences
- unexpected stanza lengths
- missing first lines
- invalid or duplicate IDs
- invalid person and text references
- incorrect page ranges
- missing, duplicate or misplaced `<pb>` markers compared with the page inventory
- a `<pb>` with a missing or incorrect `facs` filename
- a work missing `<pagebreaks/>` after complete page-break review
- missing mandatory metadata
- unsupported XML attributes
- wrong image filenames or paths
- missing or unsuccessful title-page QA
- untracked generated files

A candidate report identifies places to inspect; it does not authorize automatic
correction without checking the facsimile.

Do not suppress or bypass a failing test simply to obtain a green build.

## 22. Inspect the final diff and clean the workspace

Before presenting the change:

- remove temporary OCR outputs
- remove rendered pages not intended for the repository
- remove temporary crops
- remove comparison reports
- remove scratch manifests unless the repository requires them
- run `git status --short`
- inspect the complete diff
- confirm that only intended files are changed
- confirm that no source PDF or scratch file has accidentally been added
- confirm that both JPEG filenames and XML references agree
- confirm that every `pb/@facs` names the intended facsimile page image

Delete scratch material only through a precise, verified path. Never use a broad
or ambiguous deletion command.

## 23. Review checkpoint before commit and push

Follow `AGENTS.md`.

READY requires complete independent inventory coverage, no `open` or `fixed`
findings, all four candidate-review categories and recorded passing tests. Put
a small JSON file in scratch space with `producer`, `tests`,
`candidate_reviews` and `reviewer_ranges`, then create the frozen checkpoint
outside the worktree.
Each range has a stable `reviewer`, `facsimile_from` and `facsimile_to`; ranges
must not overlap, must cover the complete inventory and must agree with each
inventory row's reviewer. For example:

```json
{
  "producer": "producer-model-session",
  "tests": [{"command": "npm test -- --runInBand", "status": "passed"}],
  "candidate_reviews": [
    {"kind": "ocr", "reviewer": "reviewer-model-session", "status": "reviewed", "candidate_count": 12, "reviewed_count": 12},
    {"kind": "page", "reviewer": "reviewer-model-session", "status": "reviewed", "candidate_count": 4, "reviewed_count": 4},
    {"kind": "stanza", "reviewer": "reviewer-model-session", "status": "reviewed", "candidate_count": 31, "reviewed_count": 31},
    {"kind": "indentation", "reviewer": "reviewer-model-session", "status": "reviewed", "candidate_count": 49, "reviewed_count": 49}
  ],
  "reviewer_ranges": [
    {"reviewer": "reviewer-model-session", "facsimile_from": "000.jpg", "facsimile_to": "099.jpg"}
  ]
}
```

Create and verify the checkpoint with:

```shell
node .codex/skills/pdf-to-kalliope/scripts/review-checkpoint.js create \
  /tmp/<work>-checkpoint.json /tmp/<work>-findings.jsonl \
  /tmp/<work>-pages.jsonl /tmp/<work>-review.json
node .codex/skills/pdf-to-kalliope/scripts/review-checkpoint.js verify \
  /tmp/<work>-checkpoint.json
```

The checkpoint records HEAD, a diff hash, changed files and their hashes,
tests, candidate reviews, finding counts and hash, inventory coverage and hash,
and reviewer page ranges. Any later file or diff change invalidates this
scratch checkpoint; rerun the applicable audits and create a new checkpoint.
This does not invalidate the published XML attestation. The checkpoint refuses
READY when the producer reviewed a completion page, a finding is `open` or
`fixed`, a candidate category is incomplete, a page remains unreviewed or a
recorded test has not passed.

Prepare and validate the complete change, then present it to the user before
committing or pushing.

Report concisely:

- publication imported
- poet/author ID and work ID
- source and pages processed
- number of internal `<pb>` markers, confirmation of their `facs` filenames and
  presence of `<pagebreaks/>`
- number of poems
- number and kinds of prose or paratext entries
- title-page image created
- title-page geometry and crop QA status
- whether a graphic front cover was created
- referenced persons resolved
- translations and originals identified
- validation and tests run
- remaining `TODO:` notes
- exact files intended for the commit

Do not commit, amend or push until the user has explicitly reviewed the change
and requested commit/push, as required by `AGENTS.md`.

## 24. Create the GitHub pull request after approval

After explicit user approval:

1. Generate the complete facsimile directory from the source PDF with the
   repository's facsimile tool.
2. Synchronize it with `./tools/sync-facsimiler.sh`.
3. Run `npm run check-facsimiles` and verify that the public `000.jpg` for the
   new `source/@facsimile` returns successfully. Do this before opening the PR;
   CI checks the public server, not merely the local PDF or image directory.
4. Create or use an appropriate branch following `AGENTS.md`.
5. Commit the complete intended change.
6. Push the branch.
7. Create the GitHub pull request.
8. Follow all repository conventions for the branch, title and description.

The PR title and description must be in Danish.

The PR description must state concretely:

- which physical publication was transcribed
- which facsimile or PDF was used
- which pages were processed
- how internal page boundaries, `pb/@facs` filenames and `<pagebreaks/>` were
  verified
- what poems, prose and paratext were included
- which material was intentionally excluded
- how fresh OCR and direct proofreading were performed
- how verse structure and indentation were checked
- which title-page and cover assets were added
- how the title-page geometry and crop were checked
- which persons, translations and originals were resolved
- which validation and tests were run
- any remaining `TODO:` notes

Use an English GitHub closing keyword such as `Fixes #123` when the PR must
close an issue automatically.

Do not wait for GitHub CI unless the user explicitly asks for that.

The complete pull request is the final deliverable.

## Definition of done

The task is complete only when all applicable items are true:

- [ ] `AGENTS.md`, the style guide and relevant special documentation were read.
- [ ] The complete PDF was inventoried.
- [ ] Every PDF page was classified or otherwise accounted for.
- [ ] The JSONL page inventory covers every relevant printed page and every row
      is marked reviewed against the facsimile by someone other than the
      producer.
- [ ] The findings JSONL register preserves every finding and has no `open` or
      `fixed` status.
- [ ] The PDF's existing OCR layer was not trusted as the transcription source.
- [ ] OCR working images were rendered at 300 DPI.
- [ ] The generated facsimile was synchronized to the Kalliope server and
      `npm run check-facsimiles` passed against the public `000.jpg`.
- [ ] Fresh OCR was produced from page images with at least two meaningfully
      different passes or strategies.
- [ ] Every relevant page was checked directly against the facsimile.
- [ ] Every internal source-page transition in an included body has exactly one
      precisely placed `<pb>`.
- [ ] Every `<pb>` has a non-empty `facs` containing the correct facsimile page
      filename; `n`, when present, is the printed page label.
- [ ] Every `<pb>` prefixes the first text or inline element on its new source
      page on the same serialized XML line, and the page-break test passes.
- [ ] Arabic `pb/@n` values and numeric `pb/@facs` filenames never decrease in
      document order; gaps are allowed.
- [ ] `<workhead>` contains `<pagebreaks/>`, including when no included text
      crosses a page boundary and the work consequently has no `<pb>`.
- [ ] Every relevant poem was included.
- [ ] Every relevant prose text was included as its own text entry.
- [ ] Relevant introductions, prefaces, afterwords, dedications and mottoes were
      included.
- [ ] Advertisements were excluded.
- [ ] The table of contents was excluded as a text.
- [ ] The title page was transcribed into the work header using readable
      capitalization rather than mechanical all-caps.
- [ ] The title page was extracted as
      `public/images/<poet-id>/<work-id>-p1.jpg`.
- [ ] The title-page source was classified, the page was processed with
      `$prepare-kalliope-titlepage`, and its final QA status is `pass`.
- [ ] A genuine separate graphic front cover, when present, was extracted as
      `public/images/<poet-id>/<work-id>-p2.jpg`.
- [ ] `p1` is the title page and `p2` is the optional front cover regardless of
      their order in the PDF.
- [ ] The XML references the correct image basenames and current image types.
- [ ] Work-level and text-level metadata were actively completed.
- [ ] Referenced poets, translators and other persons were resolved against the
      corpus where possible.
- [ ] Translations and adaptations were investigated for originals.
- [ ] Existing texts were checked for duplicates, variants and relations.
- [ ] Verse lines match the printed source.
- [ ] Physical line wraps were rejoined to their correct verse lines.
- [ ] Stanza boundaries match the printed source.
- [ ] The bundled stanza analysis was run for every poem, rerun after stanza
      changes, and every candidate was resolved against the facsimile.
- [ ] The bundled indentation analysis was run for every poem with leading
      spaces preserved, rerun after indentation changes, and every candidate
      was resolved against the facsimile.
- [ ] Stanza-boundary candidates were resolved before the final indentation
      analysis, and the analysis input was regenerated from that reviewed
      structure.
- [ ] Every `no_stable_pattern` result was recorded and dispositioned against
      the facsimile rather than accepted as a pass.
- [ ] Indentation was verified visually and represented with spaces.
- [ ] Headings, mottoes, numbers and decorations are not ordinary verse lines.
- [ ] Footnotes are placed at the text locations to which they belong.
- [ ] Every source footnote is transcribed verbatim from the facsimile without
      its marker or any added referenced word or editorial explanation.
- [ ] Notes applying to a whole poem are placed in the text header.
- [ ] Full dates and other discoverable metadata were extracted according to
      current rules.
- [ ] Genuine unresolved questions are marked with explicit XML notes beginning
      `TODO:`.
- [ ] The complete XML validates.
- [ ] OCR candidate checks were reviewed.
- [ ] OCR, page, stanza and indentation candidate totals equal their reviewed
      totals, and the reviewer differs from the producer.
- [ ] The semantic page audit and side-aware historical OCR profile were run on
      the final XML.
- [ ] The whole-work wrapper analyzed every poetry block and all candidates
      were dispositioned.
- [ ] A frozen review checkpoint was created and still verifies unchanged.
- [ ] Every included text has `korrektur1,korrektur2,kilde,side`, the work is
      `complete`, and `<workhead>` contains the independent model attestation.
- [ ] The complete repository test suite passes.
- [ ] `git diff --check` passes.
- [ ] Temporary OCR and scratch files were removed.
- [ ] The final diff contains only intended files.
- [ ] The user reviewed the completed change before commit and push.
- [ ] After approval, the change was committed, pushed and submitted as a
      complete GitHub pull request.
