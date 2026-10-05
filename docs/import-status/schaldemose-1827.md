# Mikkel Ræv (1827): import stoppet ved ufuldstændigt facsimile

## Status

Værket er ikke indsat i Kalliope. KB har digitaliseret den ønskede udgave,
men flere verslinjers højre ender mangler på trykt side 192 i begge PDF-filer.
Der er ikke oprettet værk-XML, tekst-id'er eller publicerede billedfiler.
Importen afventer en fuldstændig gengivelse af denne side fra samme udgave.

## Udgave og kilder

- Frederik Schaldemose: *Mikkel Ræv. Et Æventyr i femten Bøger, efter det
  gamle nedertyske Digt Reineke Vos*. Kjøbenhavn, trykt paa Oversætterens
  Bekostning, i Hart. Frid. Popps Bogtrykkerie, 1827. 208 sider.
- [KB's digitale katalogpost](https://soeg.kb.dk/permalink/45KBDK_KGL/1o797oc/alma99122018164205763),
  digitaliseret i 2016 efter eksemplaret med signaturen `54,-164 8°`.
- [Farve-PDF](https://www.kb.dk/e-mat/dod/11540803878C-color.pdf).
- [Sort-hvid-PDF](https://www.kb.dk/e-mat/dod/11540803878C-bw.pdf).

Katalogets titel, udgivelsesår, trykker og sidetal er sammenholdt med PDF'ens
KB-forsats og det trykte titelblad. Katalogets offentlige metadata-endpoint
viser begge PDF-links; begge filer er hentet og undersøgt. Katalogpostens
brugerflade er ikke browserkontrolleret, da browseren ikke var tilgængelig.
Det søgeindekserede link med filnavnet `11540803878C_bw.pdf` giver HTTP 404;
de fungerende kataloglinks bruger bindestreger.

## Dokumenteret kildehul

Problemet ligger i **Fjortende Bog, trykt side 192, PDF-side 197**, svarende
til facsimilefilen `196.jpg` ved repositoryets almindelige nulbaserede
sideudtræk. Den foregående PDF-side 196 viser trykt side 191; den følgende
PDF-side 198 viser trykt side 193.

Højre billedkant skærer gennem trykt tekst, blandt andet i:

- sidens første verslinje, umiddelbart før versnummer 310;
- verslinjen efter nummer 325;
- linjen begyndende »Paa Gjæsten, der vedblev«;
- sidens sidste verslinje, efter nummer 330.

Sidetal og venstre del af siden er bevaret. Der mangler altså ikke en hel
nummereret side, men en del af det nødvendige tekstvidne. Manglen findes i
både farvefilens indlejrede JPEG og sort-hvid-filens indlejrede sidebillede;
den skyldes derfor ikke beskæring ved vores udtræk eller OCR. En ny rendering
af disse filer kan ikke genskabe de manglende linjeender.

De to hentede filers SHA-256:

```text
farve:     fd4550d697a70edc6a9a09212116342f44abe838f39f9bfa472b687b0f3224cc
sort-hvid: fea15a452ac2f7bf527b95762bae3b381d000ad45ab0ffcc850c4ffed98c26c4
```

Der er ikke forsøgt at rekonstruere de afskårne ord fra en senere udgave,
rim, sammenhæng eller modelgenereret tekst. Forbuddet mod rekonstruktion i
`pdf-to-kalliope` anvendes her på den manglende del af siden. Skillens
overdragelse for et kildehul bruges som dokumentationsform; dette er ikke en
påstand om, at en hel PDF-side mangler.

## Arbejde udført

- Korpusdatasættet er undersøgt for Schaldemoses eksisterende værker.
  Udgaven fra 1827 findes ikke i det undersøgte datasæt eller personens værkliste.
- KB's katalogsøgning fandt den digitale 1827-post samt andre udgaver fra
  blandt andet 1832 og 1842; de senere udgaver er ikke brugt som tekstkilde.
- OCR/PDF-miljøet er kontrolleret med `tools/ocr-environment`.
- Farve-PDF'en har 217 PDF-sider. De trykte sider er gennemgået visuelt for
  paginering og værkstruktur; gennemgangen er ikke tekstkorrektur.
- Titelbladet er på PDF-side 4. Trykt side 1 svarer til PDF-side 6.
  De trykte sider følger herefter offset 5 til og med side 208 på PDF-side 213.
- Mottoet på trykt side 2, »Fablens Oprindelse« på siderne 3–8 samt femten
  bøger med indholdsvers er identificeret. Ingen rettelsesark er observeret
  i sidegennemgangen.
- Trykt side 192 er særskilt undersøgt i begge PDF-filer.
- Der er ikke udført frisk OCR, transskription, tekstkorrektur,
  titelbladsbehandling eller facsimilepublicering.

## Udestående

1. Fremskaf et ubeskåret billede af **side 192 i udgaven fra 1827**.
   Et nyt billede fra KB's eksemplar eller et andet eksemplar af samme udgave
   kan lukke kildehullet. En senere udgave kan ikke erstatte tekstvidnet.
   Ansvar: brugerens redaktionelle kildeafklaring; agenten kan kontrollere
   og indarbejde en ny kilde, når den er tilgængelig.
2. Genoptag derefter hele PDF-importen med sideinventar, frisk OCR,
   transskription, titelblad, metadata, referencer, sideskift, to fulde
   korrekturgennemgange og validering efter repositoryets skills.
   Ansvar: agenten.

## Validering

Repositoryets fulde testkommando `make test` bestod med exitkode 0:
106 testsuiter og 1.588 tests bestod; én testsuite og ni tests var sprunget
over. `git diff --check` bestod. Tekst-, XML- og korrekturkontroller er ikke
udført, da ingen transskription er oprettet.
