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

## Direct image edit

1. Keep the source immutable and work on a copy in scratch. Inspect it before
   using ImageGen (or the available equivalent image-editing tool). Request only
   removal of the identified library stamp with matching aged paper texture.
   Explicitly preserve every printed letter, illustration, border, crop,
   geometry, colour and other paper features. If the tool is unavailable,
   retain the stamp and report it.
2. Prefer the first direct edited result when it passes visual inspection.
   This is the intended method, as in the accepted Nytaarsgave 1798 example:
   the direct ImageGen result was preferred over the subsequent local
   mask/compositing experiment. Use the edited image itself, not a patch
   transferred onto the original. Do not add a mask/compositing pass or require
   pixel-for-pixel identity outside the stamp.
3. Compare the entire edited title page with the source, then inspect the
   stamp area closely. Check all printed text, illustration, borders,
   composition and paper appearance, as well as stamp remnants and unnatural
   restoration. The generated page is not automatically a faithful copy.
   Reject results that alter original print or introduce unrelated visible
   changes. If necessary, make a targeted new attempt from the original;
   do not repeatedly regenerate or restore an already edited result.
4. Keep the best successful result. Do not generate extra variants or impose
   a local pixel-preservation technique merely because the tool changed pixel
   values. Never reconstruct missing printed content to get a clean page.

Example prompt:

> Remove only the blue library stamp below the publisher line. Fill its area
> with matching aged paper texture. Preserve every printed letter, punctuation,
> engraved illustration, border, signature, page stain, crop and composition.
> No other restoration, enhancements, new text or changes to the title page.

## Finish and disclose

Use the successful edit as the input to the ordinary geometry workflow,
retaining a lossless working image until final JPEG export. The existing crop
limits and geometry QA are unchanged; an old geometry report cannot attest a
subsequently edited file. Do not claim deterministic pixel preservation for a
generative edit. Never replace or retouch the source PDF or facsimile pages.

Keep sources, generated alternatives and reports in scratch. Commit only the
final image and necessary publication metadata. In the PR handoff, state for
example:

> Titelbladet stammer fra KB's [digitalisering]. Biblioteksstemplet under
> forlagslinjen er fjernet med ImageGen. Resultatet er sammenholdt visuelt med
> kilden, herunder hele trykket og illustrationerne. Originalfaksimilen er bevaret.

Use that wording only when those checks were actually performed. Record a
retained stamp or failed attempt instead of claiming successful removal.
