# Kildesamling for kandidatregisteret

Denne mappe indeholder de data, der er indsamlet til kandidatregisteret. Den
er et arbejdsarkiv mellem dataindsamling og identitetsreduktion.

## Principper

- Kildeobservationer må ikke overskrives af sammenlagte personposter.
- Originale kildeværdier og normaliserede værdier holdes adskilt.
- Hver mappe har et `manifest.json` med kilde, tidspunkt, status og cachekilder.
- En manglende eller endnu ikke høstet kilde markeres eksplicit; den må ikke
  forveksles med en tom kilde.
- Genererede sammenlagte kandidatregistre er ikke den eneste dokumentation for
  en kilde.

## Mapper

| Kilde | Status | Indhold |
| --- | --- | --- |
| `kalliope/` | snapshot | Udtrukne personobservationer fra det lokale register |
| `dfl/` | snapshot | DFL-forfattere, DFL-værkposter og manifest for rå HTML-cache |
| `wikidata/` | snapshot | Råt SPARQL-resultat og registrerede observationer |
| `dbl/` | ikke høstet | Planlagt redaktionel kilde |
| `kvindebiografisk/` | ikke høstet | Planlagt redaktionel kilde |
| `nordisk-kvindelitteraturhistorie/` | ikke høstet | Planlagt litteraturhistorisk kilde |

## Samlet kildevurdering

| Kilde | Identifikatorer og felter | Næste strategi |
| --- | --- | --- |
| Kalliope | Kalliope-id, navn, datoer, sprog, værk-id’er og eventuelle autoritets-id’er | Lokal baseline fra `fdirs/*/info.xml` |
| DFL | DFL-id/URL, navn, datoer, titel, år, litterær type, sprog og forfatterrelationer | Genbrug det bevarede HTML- og parsed snapshot |
| Wikidata | Wikidata-id, labels/aliaser, fødsel/død, occupation, VIAF og DFL-id | Genbrug rå SPARQL-snapshot; hent kun ved eksplicit opdatering |
| DBL | Lex-opslag/URL, navn, livsdata og biografisk tekst | Undersøg adgang, sitemap og genbrugsvilkår før høst |
| Dansk Kvindebiografisk Leksikon | Lex-opslag/URL, navn, livsdata og biografisk tekst | Start med en dokumenteret forfatterkategori eller et index |
| Nordisk Kvindelitteraturhistorie | Forfatter-URL, navn, land/sprog og artikelrelationer | Høst et dokumenteret forfatterindex, ikke hele websitet |

Kilderne har forskellige udvælgelsesprincipper. Kildeoverlap er derfor
evidens, ikke automatisk identitetsbevis, og én kilde er ikke nødvendigvis
komplet.

## Genbrug

Indsamlingsscripts skal læse et eksisterende snapshot, når manifestets kilde og
format stadig passer. Ny hentning kræver en eksplicit opdatering af snapshot og
manifest. En senere reduktion til én personpost pr. identitet skal altid kunne
spores tilbage til observationerne her.
