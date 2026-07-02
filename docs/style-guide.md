# Kalliope Styleguide

Denne guide samler projektets faste konventioner, især dem der er nemme at glemme i små ændringer.

## GitHub

- Issues, PR-titler og PR-beskrivelser skrives på dansk.
- Skriv konkret hvad der er observeret, ændret og valideret.
- Brug engelske navne eller citater, når de er kildens titel, personnavn eller egentlig terminologi.

## Billeder

- Portrætter og kunstgrafik ligger i `public/images/<id>/`.
- Der må ikke ligge `.jpg`, `.jpeg`, `.png`, `.gif` eller `.webp` under `fdirs/`.
- `fdirs/<id>/portraits.xml` refererer lokale filer med filnavn, fx `src="p1.jpg"` og `square-src="p1-square.jpg"`.
- Den faktiske fil for `fdirs/<id>/portraits.xml` skal derfor være `public/images/<id>/p1.jpg`.
- Square portraits er normalt manuelt beskårne kvadratiske billeder og skal også ligge i `public/images/<id>/`.

## XML-data

- Hold XML-beskrivelser korte, kildebaserede og i samme stil som omkringliggende filer.
- Brug eksisterende attributter og formater; ukendte `<picture>`-attributter er build-fejl.
- Se også `docs/xml-portraits-format.md` for detaljer om `portraits.xml`.

## Arbejdsfiler

- Lokale scratch-filer må gerne eksistere under arbejdet, men de skal ikke committes.
- Tjek `git status --short` før commit og PR.
