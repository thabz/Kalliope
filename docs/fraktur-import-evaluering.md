# Måling af frakturimport

Reservér to komplette bøger med uafhængigt korrekturlæste referencer. Registrér
PDF'ernes SHA-256 og de konkrete udgaver, inden modelvalg begynder. Ingen af
bøgerne må bruges til træning eller modelvalg. Opbevar referencer uden for
importsessionernes arbejdsområder, og giv først bedømmeren adgang, når begge
importer af bogen er afsluttet.

Kør én frisk Codex-session pr. kombination af bog og OCR-forløb. Brug samme
sprogmodel, reasoningniveau, instruktion og korrekturkrav. Registrér
Kalliope-commit, PDF-checksum, modelrelease og checksum, OCR-motorversioner
samt den valgte model- og inputcachetilstand. Medtag hele arbejdet frem til
valideret XML, inklusive korrektur og eventuel Tesseract-kørsel til TSV. Hvis
delegeret korrektur bruger egne sessioner, skal deres forbrug medregnes efter
samme tælleregel og dokumenteres særskilt.

Sammenlign de afsluttede sessioner for hver bog med:

```sh
node tools/compare-import-token-usage.js hidtidig-session.jsonl hidtidig-korrektur.jsonl -- ny-session.jsonl ny-korrektur.jsonl
```

Værktøjet bruger den sidste kumulative måling fra hver sessionslog. Cachede
inputtokens er en delmængde af inputtokens. Det samlede forbrug er input plus
output, og besparelsen beregnes i forhold til det hidtidige forbrug. Angiv alle selvstændige korrektursessioner på samme side af `--` som deres
hovedsession. Værktøjet summerer dem før sammenligningen og afviser dubletter.
Medtag kun måletallene i forsøgsbilagene. Sessionsloggene kan indeholde
instruktioner, filindhold og andre lokale oplysninger.

Efter importen sammenlignes de to XML-udgaver mod referencen. Rapportér
tegnfejl, manglende eller sammenlagte verslinjer, strofefejl og indryksfejl pr.
bog. Kontrollér også modeldownload fra tom cache, genbrug fra cache og
afvisning ved forkert checksum. Den nye arbejdsgang kan accepteres, når begge
bøger har lavere samlet tokenforbrug og mindst samme tekst- og layoutkvalitet.
