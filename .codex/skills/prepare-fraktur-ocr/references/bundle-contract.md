# Fraktur OCR bundle contract

The contract version is `1`. Every serialized field uses snake case because
the JSON files are an external interface.

## Files

- `bundle.json`: source identity, dependency versions and stage status.
- `pages.jsonl`: one record per source page and all image variants.
- `runs.jsonl`: one record per OCR configuration and page.
- `comparison.json`: aggregate measurements and an optional recommendation.
- `candidates.jsonl`: pairwise OCR disagreements for visual review.
- `images/<variant>/<page-id>.png`: OCR working images.
- `ocr/<configuration>/<page-id>.*`: exact TXT and TSV recognition output.

## Stable identity

`page_id` is `page-0001`, counted from the PDF or sorted input-image sequence.
It never represents the printed page number. Consumers must use the source
mapping in `pages.jsonl` and must not derive one numbering system from another.

Every material input and output has a SHA-256 hash. `verify` fails when a file
is absent, a hash differs, a stage is incomplete or an OCR run failed.

## Sampling

Pages 1-5 are never benchmark samples. The remaining pages are divided into up
to five contiguous ranges. The page with the largest recognized non-whitespace
character count is selected from each range. A selected page below 500
characters is marked `low_density`. Fewer than five eligible pages makes the
sample status `insufficient_sample`.

## Comparison

Exact CER uses NFC Unicode text with normalized line endings and ignores only a
single final newline. Normalized CER additionally folds typographic apostrophes
and quotation marks and collapses whitespace. WER uses NFC whitespace-delimited
tokens. These comparison copies never replace OCR or source text.

Without ground truth, `recommended_configuration` is always `null`.

