# Nytaarsgave for Damer 1794 — importstatus

Arbejdet vedrører #2015. Årgangens 70 tekster er indsat i
`fdirs/antologierdk/1794-nytaarsgave.xml`. Værket er fortsat `incomplete`,
fordi titelbladsbilledet afventer manuel billedbehandling efter nedenstående
QA-resultat. Teksterne har `korrektur1,kilde,side`; færdigstatus og modelattest
er ikke tildelt.

## Kilde og omfang

- [KB's samlede katalogpost](https://soeg.kb.dk/permalink/45KBDK_KGL/1o797oc/alma99122048920505763).
- [Den anvendte farve-PDF](https://www.kb.dk/e-mat/dod/115208002921-color.pdf),
  215 PDF-sider, SHA-256
  `a5a949edff2dce3bf0e8c2c73bd532245fab134c2726a1c8d354ff06ef7ad1dc`.
- Trykte tekstsider 1–189, titelblad på PDF-side 4, indholdsregister på
  PDF-side 209–211 og syv nodeblade på PDF-side 27–28, 43–44, 71, 104 og 129.
- Hele PDF'en er inventeret. Ingen manglende blade eller rettelsesark fundet.
  Den fortløbende side 151 har fejlagtigt overskriften 153; forholdet er
  forklaret ved den berørte tekst.
- Faksimilen er udtrukket og synkroniseret som `115208002921-color` med
  215 sider. Nodebladene er desuden tilknyttet de relevante tekster som billeder.

## Korrektur og relationer

Frisk OCR og producentens sidevise læsning er efterfulgt af uafhængig,
skrivebeskyttet korrektur i andre sessioner. Reviewerens rettelser er
genkontrolleret mod kilden. Fordelingen var:

| Trykte sider | Reviewer-session | Model / indsats |
| --- | --- | --- |
| 1–60 | `01a1a363-2ebc-7ef2-8e73-4f48276b5bd9` | gpt-6.1-sol / high |
| 61–147 | `01a1a363-6f40-7970-8f16-b6adb2fd601c` | gpt-6.1-sol / high |
| 148–189 | `01a1a360-91bf-7113-b887-10092b89f8dd` | gpt-6.1-sol / high |

Kontrollen omfatter ord, tegn, noter, typografi, alle 68 poesiblokkes strofer
og indryk samt de to prosateksters afsnitsgrænser. Geometriværktøjets
manuelle kandidater er kontrolleret visuelt; OCR-geometrien er ikke fejlagtigt
betegnet som fuldt automatisk godkendt.

47 henvisninger i Bruuns kritik er forbundet med de konkrete forekomster i
1794-årgangen. Sikre variantforbindelser og tre eksisterende tyske
originaltekster er registreret. Ukendte signaturer er bevaret uden gættet
forfatteridentifikation. Hans Gram Bechmann er oprettet med kildebaserede
metadata, DBL1-biografi og et bibliografisk blankværk for *Evigheden* (1792).

## Supplerende originaltekster, 4. november 2026

De fem manglende originalrelationer er afklaret tekstligt og indsat:

| Oversættelse | Original og valgt udgave | Kontrol |
| --- | --- | --- |
| `haste2026110310` | Hölty, »Adelstan und Röschen«, *Gedichte* (1783), s. 1–7, `holty2026110401` | TextGrids transskription af 1783-udgaven; 16 × 8 vers. De to danske indledningsstrofer er tilegnelsen til Buchholm. |
| `riber2026110402` | Voß, »Luise«, *Musen Almanach für 1784*, s. 115–154, `voss2026110401` | Alle 40 tryksider læst mod BSB-faksimilen; 470 heksametre, to trykte fodnoter og alle sideskift. |
| `bruunmc2026110402` | F. L. Stolberg, »Romanze«, *Gedichte der Brüder Christian und Friedrich Leopold Grafen zu Stolberg* (1779), s. 64–68, `stolbergf2026110401` | TextGrids transskription af 1779-udgaven; 13 × 5 vers. |
| `anonym1700dk2026110411` | Lidner, »Det lyckliga Bytet«, *Nyare arbeten* (1793), s. 20, `lidner2026110401` | Hele digtet læst mod 1793-faksimilen; 16 vers. |
| `anonym1700dk2026110412` | Miller, »Die Zufriedenheit«, *Gedichte* (1783), s. 389–391, `miller2026110401` | Alle tre tryksider læst mod BSB-faksimilen; seks strofer à seks vers. Den danske gendigtning følger strofe 1, 2, 4 og 6. |

Identifikationen af Millers digt bygger især på forbindelsen mellem lærkens
sang og arbejdet, nattergalens sang og hvilen, den utilfredse rige og den
afsluttende tak til Gud. Voß' første tekstform er valgt frem for den reviderede
1795-udgave. De fire nyoprettede delværker er `incomplete`; Hölty-værket var
allerede en delvis indførelse. De nye faksimiletransskriptioner har én
producentkorrektur; der er ikke udført en uafhængig anden korrektur af dem.
Hölty og Stolberg har alene kvalitetsflagene `kilde,side`.

`haste2026110320` er desuden identificeret som en omarbejdelse af
»Troskabsprøven« (DgF 252). Det svarer til Hastes egen henvisning til Syvs
fjerde del, nr. LXXX. Sammenlign Anna Munks håndskrift, nr. 26, i
[KU's udgave af den ældste viseoverlevering](https://cst.dk/dighumlab/duds/DFK/Dorthe/html/MUNK26.htm).

Gotters »Die Tageszeiten der Seele« (`gotter2025081401`) har fået fuld kilde
til *Gedichte*, bd. 1, Gotha: Carl Wilhelm Ettinger, 1787, s. 39, og et
[tilgængeligt faksimilelink](https://archive.org/details/gedichte12gott/page/39/mode/1up).
De 15 vers er genkontrolleret; »Drauf« og »bey« følger denne udgave.
Bruuns »Vel er det lkke« er rettet til »Vel er det ikke«.

Variantkontrollen giver ingen kandidater for de fem indsatte originaler.
Helværksanalysen bekræfter Höltys, Stolbergs og Millers strofeomfang uden
strukturkandidater; Voß er sammenhængende heksametre med dialogindryk.
Det opdaterede JSONL-korpus er afstemt mod alle 74 tekstønsker uden match
eller valideringsfejl.

## Id-sammenfald med master

CI afslørede sammenfald mellem 40 af 1794-importens nye tekst-id'er og de
siden indførte 1797- og 1813-årgange. Master er indflettet, og 1794-teksterne
har fået ledige id'er fra 4. november. Henvisningerne i Bruuns kritik er
opdateret samtidig. De optagne gamle id'er kan ikke bevares som aliaser. De to øvrige
anonyme tekster flyttes også til 4. november, fordi deres gamle løbenumre
ligger under masters højeste nummer for 3. november; deres gamle, ledige
id'er bevares som aliaser.

| Tidligere id i denne PR | Nyt id |
| --- | --- |
| `anonym1700dk2026110301` | `anonym1700dk2026110401` |
| `anonym1700dk2026110302` | `anonym1700dk2026110402` |
| `anonym1700dk2026110303` | `anonym1700dk2026110403` |
| `anonym1700dk2026110304` | `anonym1700dk2026110404` |
| `anonym1700dk2026110305` | `anonym1700dk2026110405` |
| `anonym1700dk2026110306` | `anonym1700dk2026110406` |
| `anonym1700dk2026110307` | `anonym1700dk2026110407` |
| `anonym1700dk2026110308` | `anonym1700dk2026110408` |
| `anonym1700dk2026110309` | `anonym1700dk2026110409` |
| `anonym1700dk2026110310` | `anonym1700dk2026110410` |
| `bruunmc2026110301` | `bruunmc2026110401` |
| `bruunmc2026110302` | `bruunmc2026110402` |
| `bruunmc2026110303` | `bruunmc2026110403` |
| `buchholm2026110301` | `buchholm2026110401` |
| `buchholm2026110302` | `buchholm2026110402` |
| `frankenau2026110301` | `frankenau2026110402` |
| `frankenau2026110302` | `frankenau2026110403` |
| `haste2026110301` | `haste2026110402` |
| `haste2026110302` | `haste2026110403` |
| `haste2026110303` | `haste2026110404` |
| `haste2026110304` | `haste2026110405` |
| `haste2026110305` | `haste2026110406` |
| `haste2026110306` | `haste2026110407` |
| `hjortvk2026110301` | `hjortvk2026110401` |
| `hjortvk2026110302` | `hjortvk2026110402` |
| `liebenbergmf2026110301` | `liebenbergmf2026110401` |
| `liebenbergmf2026110302` | `liebenbergmf2026110402` |
| `rahbek2026110304` | `rahbek2026110404` |
| `rahbek2026110305` | `rahbek2026110405` |
| `riber2026110301` | `riber2026110401` |
| `riber2026110302` | `riber2026110402` |
| `sander2026110301` | `sander2026110403` |
| `sander2026110302` | `sander2026110404` |
| `sander2026110303` | `sander2026110405` |
| `sander2026110304` | `sander2026110406` |
| `sander2026110305` | `sander2026110407` |
| `sander2026110306` | `sander2026110408` |
| `schmidtf2026110301` | `schmidtf2026110401` |
| `schmidtf2026110302` | `schmidtf2026110402` |
| `smidth2026110301` | `smidth2026110401` |
| `anonym1700dk2026110311` | `anonym1700dk2026110411` (alias bevaret) |
| `anonym1700dk2026110312` | `anonym1700dk2026110412` (alias bevaret) |

## Udestående: titelbladsbillede

`prepare-kalliope-titlepage` finder titelbladets papirkant i både farve- og
sort-hvid-skanningen, men QA returnerer `manual-review`: højre beskæring er
8,89 %, over skillens grænse på 8 %. Intet `p1`-billede er derfor promoveret,
og der er ikke lagt en billedreference til et manglende aktiv i XML.

Farveoriginalen er PDF-side 4, 1001 × 1600 pixels. Den analyserede geometri
er vinkel 0°, beskæring `5,55,907,1465`. Titelbladets tekst er:

> Nytaarsgave / for / Damer / 1794. / Gratierne / helliget / A. Flint d. & f. /
> Paa S. Poulsens Forlag.

Næste skridt er manuel vurdering af papirkanten eller et bedre kildebillede,
derefter titelbladsbillede med kontrolleret transskription og de afsluttende
kontroller før færdigmarkering. Billedanalysens grænse er ikke omgået.
Analyse, kandidat, QA, OCR, sideinventar og reviewregistre opbevares uden for
repositoryet i `/private/tmp/kalliope-2015/`; de er ikke offentlige aktiver.

## Afsluttede kontroller

- `make test`: 139 testsuiter og 2.431 tests bestået; 9 tests sprunget over.
- Målrettet sideskiftstest: alle 23 tests bestået.
- Semantisk sidekontrol: 203 tekstsideposter, ingen afvigelser.
- Alle 216 aktuelle strukturkandidater og 1.894 historiske OCR-kandidater
  har individuelle dispositioner. Alle 68 poesiblokke har visuel strukturkontrol.
- XML-kontrol, kvalitetskontrol og afgrænset repository-OCR-rapport bestået.
- Variantkontrol: ingen uafklarede kandidater. Tekstønskeregister: ingen match
  eller valideringsfejl.
- Static-build gennemført, inklusive korpuseksport og Elasticsearch-opdatering.
- Faksimilekontrol: 634 faksimiler og 1.268 genererede og synkroniserede
  kontrolbilleder bestået.
