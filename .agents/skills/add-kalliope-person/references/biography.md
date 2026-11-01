# Biografi

Læs `docs/xml-biographies-format.md` og `docs/person-editorial.md`.
Brug DBL 1.–2. udgave, Salmonsen 2. udgave, supplementet og Den nye Salmonsen
(4. udgave) efter dokumentationens prioritering. Når de relevante opslag i
disse kilder er undersøgt uden en brugbar biografi, er Th. H. Erslews
*Almindeligt Forfatter-Lexicon* og H. Ehrencron-Müllers *Forfatterlexikon
omfattende Danmark, Norge og Island indtil 1814* tilladte reservekilder.
Dokumentér den forgæves søgning og begrund valget af reservekilde.
Andre tekstkilder kræver brugerens godkendelse.
Brug dokumentationens prioritering, signaturkontrol og fulde facsimilekorrektur.
Ved OCR/PDF køres `tools/ocr-environment` først.

Link alle sikkert identificerede omtaler af eksisterende digte, værker og
personer med `<a poem="id">`, `<a work="person/vaerk">` eller
`<a person="id">`. Bevar ordlyd og typografi; brug ikke `<xref>`.
Opret ønsker for manglende digte i det redaktionelle register og markér
omtalerne med `<span data-wish="oenske-id">kildens ordlyd</span>`.
Kontrollér både ønskerapport og korpusopslag; titelmatch alene er ikke bevis.

Hvis ingen biografi findes efter undersøgelse af de relevante tilladte kilder,
registreres `biography-status` med dato, undersøgte kilder og begrundelse i
`info.xml`. Et negativt Salmonsen-fund er kun evidens for Salmonsen, ikke DBL.
Ved indsættelse af en biografi fjernes negativ status og eventuel restancelistepost;
fjern også det gamle negative Salmonsen-fund, hvis det findes.
