# Sophia Voigt: Fortællinger og Poesier (1827)

Importen til issue #545 er standset. Det eksisterende arbejde bevares som en
ufuldstændig kladde i draft-PR #1474.

## Kilde og manglende sider

- Kilde: Sophia Voigt, *Fortællinger og Poesier*, Kjøbenhavn, 1827.
- KB-facsimile: `115208056137_color`, 269 PDF-sider.
- Berørt tekst: »Kirke-Aaen«, `voigt20260808017`, tryksider 89–117.
- Den eksisterende import dokumenterer et spring fra trykside 93 til 96.
  Tryksiderne 94–95 mangler.
- De tilstødende sider er PDF-side 110 / `109.jpg` (trykside 93) og
  PDF-side 111 / `110.jpg` (trykside 96). PDF-sidetal er enbaserede;
  facsimilefilnavne er nulbaserede.
- Ifølge den hidtidige PR-beskrivelse blev Det Kgl. Bibliotek kontaktet
  14. august 2026. Et svar er ikke dokumenteret i PR'en.

## Bevaret arbejde og kontroller

Den tidligere import indeholder værk- og personmetadata, titelbladsbilledet,
tekstkladder for samlingen og 193 interne `<pb>`-markører. Den tidligere
PR-beskrivelse oplyser, at hele samlingen blev OCR-behandlet og gennemgået.
Disse oplysninger er historik og er ikke en ny attestering af korrekturen.

Tekstnoten i »Kirke-Aaen« oplyser, at hullet blev suppleret fra fortællingens
første tryk i *Læsefrugter*, bd. 26 (1824), s. 395–396, KB-facsimile
`115708000964-color`. Den bevarede supplering er ikke dokumenteret tekst fra
1827-udgaven. Den skal afgrænses og erstattes fra de manglende kildesider,
før værket kan færdiggøres. Der må ikke rekonstrueres tekst fra en anden udgave.

Ved denne opfølgning er værkets status ændret fra `complete` til `incomplete`,
og blokeringen er markeret i værket og den berørte tekst. Der er ikke udført
ny OCR, transskription eller facsimilekorrektur.

`make test` blev kørt 4. oktober 2026: 103 suites bestod, tre fejlede og én
blev sprunget over; 1.584 tests bestod, fire fejlede og ni blev sprunget over.
Fejlene ligger i den tidligere import:

- `titlepage-transcriptions`: `1827-p1.jpg` mangler `<transcription>`.
- `poem-lines`: indledende citationstegn i førstelinjemetadata for
  `voigt20260808020` og `voigt20260808050`; afsluttende punktum i titlen
  »Til C. S.« (`voigt20260808049`).
- `work-corpus`: blanke randlinjer i poesi og sandsynlige uopløste
  orddelinger i prosa (`Bekjendt- Skab`, `vid- Underlig`, `for- svundne`).

`check-text-quality --min-date=2021-01-01` fandt desuden en kandidat med
»Jutta Jutta« i `voigt20260808038`. Den skal kontrolleres mod kilden ved
genoptagelsen. Tests er ikke undtaget eller svækket for at skjule fejlene.

## Forudsætninger for at genoptage

1. Fremskaf skanninger af tryksiderne 94–95 fra 1827-udgaven og dokumentér
   kilden. Afklar, om der er tale om en skanningsfejl eller et defekt eksemplar.
2. Erstat den foreløbige supplering i »Kirke-Aaen« med kildetro tekst og
   kontrollér facsimileintervaller og sideskift mod den komplette kilde.
3. Gennemfør kildeinventar, titelbladstransskription, rettelsesarkskontrol og
   fuld korrektur efter den aktuelle `pdf-to-kalliope`-arbejdsgang. Eksisterende
   kvalitetsflag alene dokumenterer ikke en afsluttet kontrol.
4. Bevar draft-status og `incomplete`, indtil kilden og alle krævede kontroller
   er komplette. Issue #545 er fortsat uafsluttet.
