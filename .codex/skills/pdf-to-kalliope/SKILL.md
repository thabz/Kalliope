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

If the ordinary worktree contains unrelated changes, use an appropriate
separate worktree or otherwise ensure that unrelated changes cannot enter the
result.

Do not invent a new person or work ID before searching the corpus.

## 2. Inventory the complete PDF

Inspect the entire publication before transcription.

Create a temporary page inventory covering every PDF page. Record at least:

- PDF page number
- printed page number, when present
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
public/<poet-id>/<work-id>-p1.jpg
```

The title page image is required for every imported work unless the source
genuinely contains no title page. In that exceptional case, add an explicit
`TODO:` note and explain the limitation in the review summary and PR
description.

The JPEG must represent the printed title page itself. Do not generate it from
the PDF's OCR layer.

Preserve the visible page faithfully. Do not crop away printed information,
ornament or borders. Scanner-bed margins may be removed only when this does not
alter the printed page. Avoid unnecessary recompression, artificial sharpening
or colour changes.

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
public/<poet-id>/<work-id>-p2.jpg
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

## 8. Reconstruct verse lines correctly

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

If nearly every stanza contains four verse lines, a transcription showing a
one-line stanza followed by a three-line stanza is a strong error candidate.

Likewise, an unexplained eight-line stanza may be two accidentally joined
four-line stanzas.

Use this pattern only to find places requiring inspection. Never change a
structure solely to make the counts regular.

Some poems are intentionally irregular. The facsimile remains authoritative.

Continue structural analysis across page breaks. A page break is not in itself
a stanza break.

Keep headings, stanza numbers and decorative lines separate from numbered verse
lines using the XML structures documented by the repository.

## 9. Preserve indentation using spaces

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

## 10. Represent prose correctly

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

## 11. Handle mottoes, quotations and non-verse lines

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

## 12. Place notes and footnotes correctly

Distinguish among:

- notes applying to the entire work
- notes applying to one poem or prose text
- footnotes attached to a particular word, line or passage

A note concerning the whole poem belongs in the text header using the current
note structure.

A footnote attached to a particular place in the text must be inserted at that
place using the Kalliope XML structure. Do not collect footnotes at the end
merely because OCR extracted them there.

Proofread footnotes and note markers directly against the facsimile.

Preserve the association between each marker and its note.

## 13. Mark unresolved questions with XML TODO notes

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

## 14. Extract dates and other textual metadata

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

## 15. Resolve persons through the existing corpus

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

## 16. Investigate translations and originals

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

## 17. Detect variants and duplicates

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

## 18. Perform a separate full proofreading phase

Generation of plausible XML is not completion.

After the initial XML exists, perform a separate systematic proofreading pass
following `docs/facsimile-korrektur.md`.

At minimum:

1. Compare the transcription with both fresh OCR results.
2. Create or inspect a discrepancy list.
3. Resolve every discrepancy against the facsimile.
4. Inspect suspicious stanza lengths and sequence numbering.
5. Check every wrapped or unusually short line.
6. Check all indentation.
7. Check headings, mottoes, signatures and separators.
8. Check punctuation, quotation marks, apostrophes and dashes.
9. Check italics, small capitals, spacing and other supported typography.
10. Check every footnote and note marker.
11. Check the first and last visible text on every relevant page.
12. Read every relevant page directly against the XML.
13. Verify the beginning and end of every text.
14. Verify continuations across page boundaries.
15. Verify that the title page and optional cover images are the correct pages.

The final work must have been checked page by page against the images.

OCR comparison is a supplement to, not a replacement for, direct visual
proofreading.

## 19. Verify completeness

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
- no heading or numbered section has disappeared
- source order is preserved
- advertisements are excluded
- the table of contents is excluded as a text
- title-page metadata is complete
- the title page has been saved as `p1`
- a genuine graphic front cover, when present, has been saved as `p2`
- `p1` and `p2` have not been swapped to match PDF order

Completeness is as important as character accuracy.

## 20. Run machine-assisted quality checks

After proofreading, run the current repository checks for OCR candidates and
common transcription problems.

Follow the commands and procedures in `docs/facsimile-korrektur.md`.

As a current baseline, include the relevant forms of:

```shell
npm run report-ocr-candidates
xmllint --noout path/to/work.xml
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
- missing mandatory metadata
- unsupported XML attributes
- wrong image filenames or paths
- untracked generated files

A candidate report identifies places to inspect; it does not authorize automatic
correction without checking the facsimile.

Do not suppress or bypass a failing test simply to obtain a green build.

## 21. Inspect the final diff and clean the workspace

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

Delete scratch material only through a precise, verified path. Never use a broad
or ambiguous deletion command.

## 22. Review checkpoint before commit and push

Follow `AGENTS.md`.

Prepare and validate the complete change, then present it to the user before
committing or pushing.

Report concisely:

- publication imported
- poet/author ID and work ID
- source and pages processed
- number of poems
- number and kinds of prose or paratext entries
- title-page image created
- whether a graphic front cover was created
- referenced persons resolved
- translations and originals identified
- validation and tests run
- remaining `TODO:` notes
- exact files intended for the commit

Do not commit, amend or push until the user has explicitly reviewed the change
and requested commit/push, as required by `AGENTS.md`.

## 23. Create the GitHub pull request after approval

After explicit user approval:

1. Create or use an appropriate branch following `AGENTS.md`.
2. Commit the complete intended change.
3. Push the branch.
4. Create the GitHub pull request.
5. Follow all repository conventions for the branch, title and description.

The PR title and description must be in Danish.

The PR description must state concretely:

- which physical publication was transcribed
- which facsimile or PDF was used
- which pages were processed
- what poems, prose and paratext were included
- which material was intentionally excluded
- how fresh OCR and direct proofreading were performed
- how verse structure and indentation were checked
- which title-page and cover assets were added
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
- [ ] The PDF's existing OCR layer was not trusted as the transcription source.
- [ ] Fresh OCR was produced from page images with at least two meaningfully
      different passes or strategies.
- [ ] Every relevant page was checked directly against the facsimile.
- [ ] Every relevant poem was included.
- [ ] Every relevant prose text was included as its own text entry.
- [ ] Relevant introductions, prefaces, afterwords, dedications and mottoes were
      included.
- [ ] Advertisements were excluded.
- [ ] The table of contents was excluded as a text.
- [ ] The title page was transcribed into the work header using readable
      capitalization rather than mechanical all-caps.
- [ ] The title page was extracted as
      `public/<poet-id>/<work-id>-p1.jpg`.
- [ ] A genuine separate graphic front cover, when present, was extracted as
      `public/<poet-id>/<work-id>-p2.jpg`.
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
- [ ] Indentation was verified visually and represented with spaces.
- [ ] Headings, mottoes, numbers and decorations are not ordinary verse lines.
- [ ] Footnotes are placed at the text locations to which they belong.
- [ ] Notes applying to a whole poem are placed in the text header.
- [ ] Full dates and other discoverable metadata were extracted according to
      current rules.
- [ ] Genuine unresolved questions are marked with explicit XML notes beginning
      `TODO:`.
- [ ] The complete XML validates.
- [ ] OCR candidate checks were reviewed.
- [ ] The complete repository test suite passes.
- [ ] `git diff --check` passes.
- [ ] Temporary OCR and scratch files were removed.
- [ ] The final diff contains only intended files.
- [ ] The user reviewed the completed change before commit and push.
- [ ] After approval, the change was committed, pushed and submitted as a
      complete GitHub pull request.
