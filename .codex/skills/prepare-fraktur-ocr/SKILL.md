---
name: prepare-fraktur-ocr
description: Prepare historical Danish Fraktur scans for OCR, compare Tesseract models and page-segmentation modes, and produce a validated scratch bundle for later transcription. Use for machine preparation and benchmarking of Fraktur PDFs or page images; do not use it to decide wording, stanzas, indentation or Kalliope XML.
---

# Prepare Fraktur OCR

Produce reproducible OCR evidence from a PDF or directory of page images. The
output is scratch data for a later transcription workflow; the facsimile remains
authoritative.

Read `docs/facsimile-korrektur.md` and `docs/ocr-korrektur-laerebog.md` before
using the output editorially. When the complete publication is being imported,
pass the validated bundle to `$pdf-to-kalliope`.

## Boundaries

- Never overwrite the source PDF or source images.
- Never change Kalliope XML or automatically correct recognized text.
- Preserve exact page identities, transformations, commands and hashes.
- Treat OCR agreement and confidence as candidate signals, not proof.
- Preserve TSV geometry for later inspection, but do not infer stanza breaks or
  indentation from OCR layout.
- Keep the complete bundle outside the repository in an explicit scratch path.

## Workflow

Check the required commands and installed Tesseract models before starting:

```shell
command -v node tesseract pdftoppm
tesseract --list-langs
```

The standard end-to-end benchmark is:

```shell
node .codex/skills/prepare-fraktur-ocr/scripts/fraktur-ocr.js run SOURCE \
  --out-dir SCRATCH
```

`SOURCE` may be a PDF or a directory of page images. The command renders or
normalizes every page, excludes PDF pages 1-5 from sampling, chooses five
text-dense pages spread through the rest of the publication, runs the balanced
Fraktur profile, compares the readings and verifies the bundle.

Use the composable subcommands when a later step must be repeated:

```shell
node .codex/skills/prepare-fraktur-ocr/scripts/fraktur-ocr.js prepare SOURCE --out-dir SCRATCH
node .codex/skills/prepare-fraktur-ocr/scripts/fraktur-ocr.js sample --out-dir SCRATCH
node .codex/skills/prepare-fraktur-ocr/scripts/fraktur-ocr.js recognize --out-dir SCRATCH
node .codex/skills/prepare-fraktur-ocr/scripts/fraktur-ocr.js compare --out-dir SCRATCH
node .codex/skills/prepare-fraktur-ocr/scripts/fraktur-ocr.js verify --out-dir SCRATCH
```

Pass `--ground-truth DIR` to `compare` or `run` when `DIR` contains corrected
UTF-8 files named `<page-id>.txt`. Only that mode may recommend a configuration,
using exact character error rate. Without ground truth the report contains
confidence and pairwise disagreement but no winner.

Pass `--scope all` to `recognize` to run the profile over the complete
publication after benchmarking. Pass `--include-binarized` only when the
binarized diagnostic variant should join the normal profile.

Read [references/bundle-contract.md](references/bundle-contract.md) when
consuming the bundle from another skill or extending the scripts.

## Image policy

The `original` OCR variant applies only safe decoding operations: EXIF
orientation, alpha flattening on white and lossless PNG output. The `cleaned`
variant additionally applies coarse orientation when Tesseract OSD is
confident, small-angle deskew, conservative scanner-edge removal, grayscale,
normalization and a white border. A separate `binarized` variant is diagnostic.

Large rotations, aggressive crops, low-confidence orientation and substantial
loss of dark pixels must remain visible in the page record as manual-review
signals. Dewarping, dilation and erosion are outside the standard profile; add
them only as parallel benchmark variants, never as destructive source changes.

