# Remove a library stamp from a KB title page

Use this optional step only for an actual title page extracted from a verified
Det Kgl. Bibliotek digitalization. Confirm the PDF, edition and page, and retain
the KB source URL. A KB catalogue link or filename alone does not establish
that the image came from KB. Do not apply this exception to other institutions,
covers, portraits, signatures, inscriptions, stains or original printed marks.

Once the source and stamp are identified, proceed without an extra approval
request. Disclose the intervention in the delivering PR every time, including
the title/page, KB source and location of the removed stamp. If removal would
require reconstructing or changing print, retain the stamp and report why.

## Local edit, original page

1. Keep the source immutable and work on a copy in scratch. Inspect it before
   using the available image-editing tool (for example ImageGen). Request only
   removal of the identified library stamp with matching aged paper texture.
   Explicitly preserve all text, illustration, border, crop, geometry and other
   paper features. If the editing tool is unavailable, retain the stamp and
   report it; do not silently substitute a different restoration method.
2. Treat the generated image as a source of replacement pixels only. Never use
   the generated whole page as the result: even a plausible image may have
   changed unrelated text or illustration.
3. Prepare a grayscale mask in the original image's coordinates. Black means
   copy the original, white means use the replacement, and intermediate values
   feather the transition. Keep all nonzero pixels within the necessary stamp
   area; feathering must not leak into unrelated areas. Protect original print
   by making those pixels black in the mask, including print inside the stamp
   area. A darkness threshold alone does not prove that print is protected.
4. Ensure the proposal aligns with the source and has the same dimensions. A
   differently sized proposal may be resized separately only when the geometry
   still aligns; never resize or warp the original to match the proposal.
   If alignment or protection of the print is uncertain, keep the stamp.
5. Compose a new, lossless PNG and a scratch verification report:

   ```shell
   node .agents/skills/prepare-kalliope-titlepage/scripts/compose-stamp-retouch.js \
     SOURCE.jpg GENERATED.png MASK.png SCRATCH/without-stamp.png \
     'https://www.kb.dk/e-mat/dod/BOOK.pdf' SCRATCH/stamp-retouch.json
   ```

   The helper accepts only HTTPS KB URLs, but cannot verify image provenance,
   title-page identity or the semantic contents of the mask. Those remain the
   agent's responsibility. It refuses overwrites, dimension mismatches and
   empty/whole-page masks. It blends decoded sRGB pixels, reopens the encoded
   PNG and requires zero changed pixels outside the mask. The report records
   input/output hashes, dimensions, changed bounds and pixel counts. It does
   not claim that printed content has been visually checked.
6. Inspect the whole result and the stamp area against the source. Check that
   the stamp is removed, the transition is unobtrusive and every printed detail
   remains intact. Narrow the mask or reject the edit if it changes print.
   Do not treat the numeric report as a substitute for this check.

## Finish the title page

Perform this step before the ordinary geometry workflow so its lossless PNG
can be the input to `analyze`, `render` and `qa`, followed by a single final JPEG
encoding. Keep the source, generated proposal, mask and reports in scratch;
commit only the final image and necessary publication metadata.

Retouch verification does not relax crop limits or bypass geometry QA. An old
geometry report is bound to its input and output hashes and cannot attest a
subsequently edited file. Pixel identity outside the mask applies to the
lossless working image before rotation, cropping and final JPEG compression.
Never replace or retouch the source PDF or the publication's facsimile pages.

In the PR handoff, state for example:

> Titelbladet stammer fra KB's [digitalisering]. Biblioteksstemplet under
> forlagslinjen er fjernet med en lokal maske. PNG-kontrollen fandt 0 ændrede
> pixels uden for masken; trykket og overgangen er kontrolleret visuelt.
> Originalfaksimilen er bevaret.

Use that wording only when those checks were actually performed. Record a
retained stamp or failed attempt in the handoff instead of claiming removal.
