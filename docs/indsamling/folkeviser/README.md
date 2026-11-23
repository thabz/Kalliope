# Vedels Hundredvisebog: DgF- og DV-konkordans

`vedel-1591-dgf-konkordans.json` er den uændrede, brugerleverede konkordans
fra 7. november 2026, indarbejdet som første delopgave til #2168.
`kalliope_id` forbinder hver registrering med en eksisterende tekst i
`fdirs/vedel/1591.xml`; der matches ikke på position, undertitelnummer eller
alene på titel. Alle 101 ID'er, titler og førstelinjer stemte ved indlæsningen.

Der er indsat 88 DgF-forbindelser til 78 forskellige typer og 12 DV-numre.
29 variantbogstaver, 12 vidnebetegnelser og ét tillæg er bevaret som attributter.
Kongerækken »Danske Kongers Nafn oc Tal« står uden katalognummer.
Det registrerede latinske tillæg importeres ikke i denne delopgave.

Konkordansen indeholder kildehenvisninger og kontrolstatus ved hver tekst.
Ifølge dens dokumentation er 83 DgF-forbindelser kontrolleret direkte i
primærudgaven, mens fem bygger på faglitteraturen. Importen udgør ikke en
ny, uafhængig kontrol af disse kilder. Variantgennemgangen er ikke udtømmende.

Særlige forhold:

- Grev Gert er DgF 156 F; konkordansens korrektion af Kristensens trykte
  henvisning til 186 EF er fulgt.
- »Det springer nu saa vide om Land« er en travesti til DgF 149, tillæg c.
  Tillægsbetegnelsen er ikke variant C; forbindelsens art er også bevaret i
  en XML-kommentar ved identifikatoren.
- DgF 115 tilhører »Hertugen Reed fra Colding« og overføres ikke til den
  indledende kongerække på grundlag af en lignende titel.
- Nummereringsfejl og rækkefølgeforskelle i XML er bevaret. Især forbindes
  Sterck Tiderich/Løven og Mimmering/Berner Riss via deres tekst-ID'er.

Tekstindhold, eksisterende relationer og kilder ændres ikke. Visning,
automatisk sammenkædning og omlægning af samlingen i #2168 udestår.

## Syvs 200 Viser (1695)

`syv-1695-dgf-konkordans.json` forbinder de 200 nummererede hovedposter og
købstadsvisen i tillægget med tekst-ID'er i `fdirs/syv/1695.xml`. Der er
indsat 166 DgF-forbindelser: 87 i første hundrededel, 78 i anden og én i
tillægget. De 35 øvrige hovedposter står uden tildelt DgF-nummer. Dette er
ikke en påstand om, at samtlige 35 tekster er fraværende i DgF.

Første hundrededel bygger på de eksisterende forbindelser til Vedel og
ovennævnte konkordans. Anden hundrededel bygger især på DgF-udgavens
indholdsfortegnelser og Syv-henvisninger. KU's håndskriftudgave supplerer
kontrollen af DgF 496 og 498; Grundtvigs Værker dokumenterer Syv IV 23 som
DgF 475, og Bandasavnið forbinder begyndelsen til Syv IV 26 med DgF 474.
De konkrete kilder er samlet i JSON-filens `sources`, og hver tildeling
henviser til sit grundlag. Der er ikke fundet en samlet KU-konkordans for
Syv, og Vedel-PR #2185 angav heller ikke en sådan kilde.

Syvs trykte nummereringsfejl er bevaret. For eksempel er IV 23 trykt som
XXII, mens IV 61 er trykt som LVI. `reference` og `xml_number` holdes derfor
adskilt. XML ændres via tekst-ID, ikke via en søgning efter det trykte nummer.
Kun DgF-typen registreres; variant- og vidnebogstaver fra andre udgaver
overføres ikke. Købstadstravestien bevarer `appendix="c"` ved DgF 149.
