# Kingo 1674: import afventer adgang til førsteudgavens facsimile

Status pr. 4. oktober 2026: **blokeret før transskription**.
Denne rapport vedrører [issue #1841](https://github.com/thabz/Kalliope/issues/1841).
Værket er ikke færdiggjort.

## Eksisterende tekst

`fdirs/kingo/1674.xml` har `status="incomplete"` og indeholder én tekst:
`kingo20000329`, »Dend første Morgen-sang«, med 15 nummererede strofer.
XML-posten har ingen kildehenvisning eller sidereferencer. Sangen er bevaret
uændret; dens ordlyd og opsætning er endnu ikke kontrolleret mod førsteudgaven.

## Identificeret førsteudgave og digitalisering

Det Kgl. Biblioteks [fysiske katalogpost](https://soeg.kb.dk/permalink/45KBDK_KGL/1pioq0f/alma99122763563005763)
registrerer Thomas Kingos *Aandelige Siunge-Koors første Part, indeholdende
14. Gudelige Morgen- og Aften-Sange, tillige med de 7 Kong Davids Poenitendse
Psalmer sangviis forfattede*, Kiøbenhavn: prentet hos Daniel Eichhorn, 1674.
Omfanget er angivet som **[12], 150 s.: noder**, signatur **4,-275**.
Dette er katalogoplysninger, ikke en kontrol af titelblad eller paginering.

Den særskilte [digitale katalogpost](https://soeg.kb.dk/permalink/45KBDK_KGL/1o797oc/alma99122882186105763)
registrerer samme titel, trykker og år i *Early European Books: printed
sources to 1700*. Beskrivelsen angiver digital gengivelse af KB's original
og elektronisk udgivelse ved ProQuest, Cambridge, 2014.

Katalogets offentlige linkresolver viser to links i rækkefølge, begge med
adgangsnoten »Adgang fra Danmark«:

1. [ProQuests geografiske adgang](https://www.proquest.com/eebgeo/geoauth?accountid=132522).
2. [Det konkrete værk hos ProQuest](https://www.proquest.com/eeb/docview/2090314740).

Det andet link blev identificeret gennem resolverens henvisning til
`den-kbd-all-110408058099-001`. KB's offentlige
[linkresolver](https://eu01.alma.exlibrisgroup.com/view/uresolver/45KBDK_KGL/openurl?rft.mms_id=99122882186105763&svc_dat=viewit&vid=45KBDK_KGL:KGL)
kan bruges til at finde de aktuelle adgangslinks igen.

## Adgangskontrol og afviste alternativer

- KB's offentlige metadata-endpoint blev læst for begge katalogposter.
  Søgningerne omfattede `Kingo Siunge 1674`, `Kingo Eichhorn 1674` og
  `Digitalisering Kingo Siunge`.
- ProQuests første adgangstrin returnerede en startside. Værklinket returnerede
  HTTP 200 med sidetitlen **Captcha Request - Early European Books - ProQuest**.
  HTTP 200 var således ikke adgang til bogens sidebilleder.
- Browserværktøjet meldte `No browser is available`; efter den dokumenterede
  fejlsøgning var listen over tilgængelige browsere tom. CAPTCHA'en kunne
  derfor ikke løses i en tilgængelig browser.
- Den afprøvede KB-PDF-adresse
  `https://www.kb.dk/e-mat/dod/110408058099.pdf` returnerede HTTP 404.
  Adressen var en kandidat udledt af ProQuest-identifikatoren, ikke et
  verificeret downloadlink.
- [Renæssancens Sprog i Danmark](https://renaessancesprog.dk/tekstbase/Thomas_Kingo_SiungeKoor_1674/1)
  angiver *Digtning i udvalg*, udgivet af Marita Akhøj Nielsen, DSL/Borgen,
  1995, s. 52-137, som tekstforlæg. Portalens sidetal kan derfor ikke bruges
  som førsteudgavens paginering eller erstatte kontrol af 1674-facsimilet.
- KB's åbne DOD-digitaliseringer fundet ved titelsøgningen vedrører
  1720-23, 1755 og 1785. Post `99122555766105763` vedrører kun [4] blade af
  et defekt 1680-eksemplar. Ingen af disse er valgt som kilde til 1674-posten.

## Faktisk udført kontrol

Repositoryets OCR-miljø er kontrolleret med `tools/ocr-environment`.
Kraken 7.1, Poppler, ImageMagick, OCRmyPDF og Tesseract er tilgængelige.
Korpussets genererede JSONL-gzipdata og den konkrete værk-XML er kontrolleret
for den eksisterende registrering. Der er ikke tilføjet tekster, billeder,
kvalitetsflag eller korrekturattester.

**Sider behandlet: 0.** Der er ingen hentet kilde-PDF, intet sideinventar,
ingen frisk OCR og ingen gennemført facsimilekorrektur. Der er heller ingen
PDF-sidenumre eller facsimilefilnavne at angive endnu. Det er ikke fastslået,
om skanningen mangler sider; blokeringen er adgang til hele facsimilet.
Eventuelle rettelsesark, titelblad, fortaler, tekstgrænser, noder og
paginering er endnu ikke visuelt undersøgt.

## Genoptagelse

Agent kan fortsætte, når en PDF eller samtlige sidebilleder fra den
identificerede 1674-udgave er tilgængelige. Brugeren kan levere den hentede
PDF, en lokal filsti eller et fungerende direkte downloadlink. Alternativt
kan den konkrete ProQuest-post åbnes i en tilgængelig browser, hvor den
krævede adgangskontrol kan gennemføres.

Derefter skal Agent:

1. Kontrollere udgaveidentitet og hele skanningen mod katalogets omfang,
   registrere alle sider og opdage eventuelle rettelsesark.
2. Behandle titelbladet efter projektets procedure og producere frisk OCR.
3. Indsætte alle manglende tekster og relevant paratekst, kontrollere den
   eksisterende morgensang og registrere kilder, sider og relationer.
4. Gennemføre begge fulde korrekturgennemgange med uafhængig kontrol,
   struktur- og typografikontrol, validering og rendering før færdigstatus.

Issue #1841 skal forblive åbent, indtil disse acceptkriterier er opfyldt.
