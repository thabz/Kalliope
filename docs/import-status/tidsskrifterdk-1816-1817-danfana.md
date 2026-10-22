# Danfana 1816–1817: kildehul før tekstimport

Tekstimporten til #1985 er standset under den indledende kildekontrol.
PR #2012 indeholder foreløbig kun samlepost, overværk og hæftemetadata;
der er endnu ikke indsat nye tekster eller flyttet eksisterende tekst-id’er.

## Kilde og konkret mangel

- KB: <https://www.kb.dk/e-mat/dod/130017630319-bw.pdf>, januar–juni 1816,
  603 PDF-sider.
- PDF-side 403 (`402.jpg`) viser trykt side 384, slutningen af aprilhæftet.
- PDF-side 404 (`403.jpg`) begynder direkte med *Thora. Første Sang*,
  trykt side 385 (uden trykt sidetal på begyndelsessiden).
- Der er intet majomslag mellem disse sider. Dette stemmer med den allerede
  beskrevne mangel i #1985. Omslagets ordlyd kan ikke dokumenteres herfra.
- Der er ikke ved denne kontrol konstateret et spring i den nummererede
  tekstpaginering ved overgangen. Hele tekstpagineringen er endnu ikke auditeret.

## Udført kontrol

Begge kilde-PDF’er er hentet til scratch; den anden PDF har 511 sider.
Den eksisterende OCR i første PDF er undersøgt diagnostisk, ikke brugt som
transskription. PDF-sider 403 og 404 er læst direkte som sidebilleder.
Ingen frisk OCR, transskription eller korrektur er udført efter konstateringen.
Det komplette sideinventar og rettelsesarkskontrollen er ikke færdige.

En søgning efter supplerende digitaliseringer fandt ikke et anvendeligt
majomslag. Internet Archives titelsøgning gav nul resultater; Google Books’
metadata-API svarede HTTP 429. Dette er ikke bevis for, at et andet eksemplar
ikke findes.

## Genoptagelse

PDF-importens skill kræver stop ved manglende facsimilesider. Genoptagelse
kræver en dokumenteret gengivelse af majomslaget fra samme udgave eller en
udtrykkelig brugerundtagelse, der tillader tekstimport uden dette omslag.
En undtagelse giver ikke tilladelse til at rekonstruere omslagets tekst.

De eksisterende 62 tekstposter i `fdirs/baggesen/1816d.xml` er bevaret.
Når importen genoptages, skal samme fysiske tekstforekomster genbruges med
deres id’er, og manglende indhold transskriberes og korrekturlæses mod kilden.
