---
name: prepare-kalliope-titlepage
description: Straighten, crop and verify a scanned Kalliope title page without altering its printed content. Use for title-page JPEGs and during PDF-to-Kalliope imports, with optional localized removal of library stamps from verified KB title pages. Do not use for graphic front covers, portraits or general restoration.
---

# Prepare a Kalliope title page

Create a faithful `p1` image from the actual printed title page. Read
`docs/titelbladsbilleder.md` before processing the image.

## Optional KB library-stamp removal

For a title page from a verified KB digitalization with a library stamp, read
[KB stamp removal](references/kb-stamps.md) before the geometry workflow.
Use an image-editing tool only to supply a local replacement, then compose it
through a mask onto the original. All pixels outside the mask must remain
identical in the lossless working image. Retain the stamp if print cannot be
preserved. Always disclose removal or an unresolved stamp in the PR handoff;
no extra approval is needed for a verified, successful edit.

The source PDF and facsimile pages remain unchanged. Other title pages retain
the geometry-only workflow below.

## Workflow

1. Verify visually that the source is the title page rather than a half-title,
   cover or other preliminary page. Replace a wrong or low-resolution source
   from the PDF instead of trying to repair it.
2. Work in a dedicated scratch directory outside the repository. Run:

   ```shell
   node .agents/skills/prepare-kalliope-titlepage/scripts/titlepage.js analyze \
     SOURCE.jpg --out-dir SCRATCH
   ```

3. When `analysis.json` has status `candidate`, render a scratch candidate
   with the exact suggested angle and crop. Do not ask the user to approve the
   preview or adjust a trusted candidate interactively:

   ```shell
   node .agents/skills/prepare-kalliope-titlepage/scripts/titlepage.js render \
     SOURCE.jpg SCRATCH/candidate.jpg --angle DEGREES \
     --crop LEFT,TOP,WIDTH,HEIGHT
   ```

4. Run QA and promote in one operation:

   ```shell
   node .agents/skills/prepare-kalliope-titlepage/scripts/titlepage.js qa \
     SOURCE.jpg SCRATCH/candidate.jpg --report SCRATCH/qa.json \
     --promote public/images/POET/WORK-p1.jpg
   ```

   This may replace the destination only when the machine checks return
   `pass`. Continue the surrounding import workflow without showing a preview
   or comparison to the user. If analysis or QA returns `manual-review`, leave
   the candidate in scratch and report that it was not promoted; do not turn
   the failure into an approval request.

`analyze` writes `analysis.json` with the proposed angle, crop and confidence.
`render` writes `<candidate>.transform.json`, which binds the source and
candidate hashes to the exact geometry. `qa` writes a final status of `pass`
or `manual-review`; promotion is refused unless the status is `pass`.
QA rejects a crop that removes more than 5% from the left, top or bottom edge
of the rotated canvas, or more than 8% from the right edge. The report lists
left, right, top and bottom separately.
After finding the paper boundary, analysis measures continuous dark bands and
corner-connected dark remnants at full resolution, trimming only until they
end. Localized objects away from the corners, such as page clips, do not count
as dark edge artifacts.

## Boundaries

- Preserve the whole physical page and its blank paper margins. Remove only
  scanner bed, dark scanner strips and other background outside the page.
- Never crop printed text, ornament, a printed border or physical source
  evidence.
- Apart from the narrowly scoped KB stamp-removal step above, do not use
  ImageGen, Repair, cloning, denoising, sharpening, colour changes or upscaling.
  The geometry tool remains unchanged and writes one high-quality JPEG encoding.
- This v1 does not correct keystone perspective, curved pages or locally wavy
  baselines. Leave the candidate in scratch and report `manual-review` when a
  single rotation cannot make the text horizontal.
- Do not use this skill for the optional graphic front cover `p2`.
- Do not commit analysis reports or other scratch files.

When changing or forward-testing this skill, read
[references/evaluation-examples.md](references/evaluation-examples.md) for the
immutable before/after corpus from merged pull requests.
