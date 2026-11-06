# Nytaarsgave 1803: import standset ved manglende facsimilesider

Status kontrolleret 11. oktober 2026. Arbejdet vedrører kun årgangen 1803
under [issue #1879](https://github.com/thabz/Kalliope/issues/1879).
Antologien er ikke indsat i korpusset.

## Kilde og planlagt registrering

- [KB's farve-PDF](https://www.kb.dk/e-mat/dod/115208003130-color.pdf),
  251 PDF-sider.
- [KB's sort-hvide PDF](https://www.kb.dk/e-mat/dod/115208003130-bw.pdf),
  også 251 PDF-sider; samme hul ved trykt side 80–81.
- Titelbladet på PDF-side 4 angiver *Nytaarsgave 1803*, samlet og udgivet
  af Hofboghandler Simon Poulsen, trykt hos Breinholm, paa Udgiverens Forlag.
- Planlagt værkfil: `fdirs/antologierdk/1803-nytaarsgave.xml`,
  `type="anthology"`. Poulsen registreres som udgiver/samler;
  bidragene skal have deres egne forfatterangivelser.
- Årgang og faktisk udgivelsesår skal undersøges hver for sig ved genoptagelse.

SHA-256 for de kontrollerede PDF'er:

```text
farve: b925f71b741c518b76b1b79db545df858279d5c5f4917e54604e98e9b3f75b09
sort-hvid: 28aea4b9e1001fb8acbbc3d55e8e0064037646b819b555330d520a39ebb37d73
```

## Dokumenterede huller

PDF-sider er enbaserede. Facsimilefilnavne nedenfor følger Kalliopes
nulbaserede konvention; de angiver sider i den nuværende, ufuldstændige PDF.

| Manglende trykte sider | Side før hullet | Side efter hullet | Berørt tekst |
| --- | --- | --- | --- |
| 80–81 | PDF 84 / `083.jpg`: trykt 79 | PDF 85 / `084.jpg`: trykt 82 | Erindringer |
| 90 | PDF 92 / `091.jpg`: trykt 89 | PDF 93 / `092.jpg`: trykt 91 | Til Hiertet |

På trykt side 79 begynder »Erindringer«. Sidens kustode er »Kan-«,
mens den næste PDF-side begynder med »Ærefrygt Nydelsen holdt« og bærer
sidetallet 82. Både paginationen og tekstovergangen viser et hul.
De samme to sider er kontrolleret direkte i den sort-hvide PDF og har
samme spring fra 79 til 82.

Den allerede åbnede kontaktoversigt viste desuden springet fra 89 til 91
inde i »Til Hiertet«. Side 89 slutter med »Et himmelsk Besøg.« og
kustoden »Fra«; næste PDF-side har sidetallet 91 og begynder
»Fra festlige Strenge,«. Disse to farvesider er efterkontrolleret i fuld
billedopløsning. Side 90 er ikke kontrolleret i den sort-hvide PDF.

Der er ikke gennemført et fuldt sideinventar. Tabellen er derfor ikke en
erklæring om, at resten af PDF'en er komplet. Årsagen til hullerne er
ikke afgjort; der er ikke taget stilling til, om de stammer fra
digitaliseringen eller selve eksemplaret.

## Arbejde før standsning

- Nyt worktree og branch fra `origin/master` er oprettet.
- OCR/PDF-værktøjer er kontrolleret med `tools/ocr-environment`.
- PDF'ens tekstlag er undersøgt diagnostisk; det indeholder kun KB's
  metadataark og er ikke brugt som transskription.
- Siderne er gjort tilgængelige som lokale inventarbilleder. Den indledende
  visuelle sidegennemgang nåede PDF-side 84; en samtidig åbnet oversigt
  dækkede også PDF-siderne 86–97 og viste det andet hul.
- Titelblad og de to manglende tekstovergange er undersøgt visuelt.
- Ingen frisk OCR, XML-transskription eller tekstkorrektur er påbegyndt.
  Ingen titelblads- eller facsimilefiler er publiceret.

Arbejdet blev standset efter reglen om manglende facsimilesider i
[pdf-to-kalliope](../../.agents/skills/pdf-to-kalliope/SKILL.md).

## Validering

`make test` afsluttede med exitkode 0: 114 beståede testsuiter og
1.748 beståede tests; én suite og ni tests blev sprunget over.
`git diff --check` bestod. Der er ingen XML-transskription at validere.

## Genoptagelse

Fremskaf en komplet digital gengivelse af samme årgang, herunder mindst
trykte sider 80–81 og 90, med kildeproveniens og tilstødende sider til
kontrol. Agent kan derefter kontrollere udgaveidentiteten og udføre et
nyt fuldt sideinventar, før OCR og transskription genoptages.

Hvis et nyt eller suppleret facsimile anvendes, skal PDF-sideantal,
sideforskydninger og facsimilefilnavne bestemmes på ny. Den manglende
ordlyd må ikke rekonstrueres fra en anden udgave eller fra eksisterende
Kalliope-tekster.
