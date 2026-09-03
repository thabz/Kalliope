---
name: add-translation-original
description: Opspor, udvælg og indsæt den dokumenterede originaltekst til en oversættelse i Kalliope, og forbind de konkrete tekstversioner. Brug når en originalversion skal tilføjes eller en oversættelses original skal identificeres; brug ikke til almindelig import uden en oversættelsesrelation.
---

# Tilføj originaltekst til en oversættelse

Find og indsæt den tekstversion, som den konkrete oversættelse med sikkerhed
bygger på eller svarer til. Læs og følg
[`docs/originaltekster-til-oversaettelser.md`](../../../docs/originaltekster-til-oversaettelser.md)
samt `AGENTS.md`, `docs/style-guide.md`, `docs/alle-danske-digtere.md`,
`docs/xml-work-format.md` og `docs/kalliope-masterplan.md` før ændringer.

## Arbejdsgang

1. Identificér oversættelsen, dens oversætter, den oplyste originalforfatter og
   alle spor om titel, førstelinje, sprog, datering og benyttet udgave. Søg først
   efter personer, værker og tekstforekomster i Kalliope.
2. Sammenlign kandidater tekstligt. Opret kun relationen ved et sikkert match;
   titel eller forfatter alene er utilstrækkeligt. Bevar
   `note/@unknown-original-by`, hvis forfatteren kendes, men den konkrete
   original ikke kan identificeres.
3. Prioritér oversætterens dokumenterede trykte udgave. Ellers vælg den nærmeste
   samtidige trykte udgave før oversættelsen med samme tekstlige form. Brug kun
   en troværdig digital udgave som tekstkilde, når dokumenteret søgning ikke
   finder en egnet trykt kilde. Vælg ikke automatisk den ældste version.
4. Opret normalt den identificerede trykte publikation som et selvstændigt værk
   hos originalforfatteren. Brug samtidig `$add-kalliope-work`; brug også
   `$pdf-to-kalliope` for en komplet scannet PDF. Sæt værket til `incomplete`,
   hvis kun en del af publikationen indføres.
5. Angiv fuld bibliografisk kilde og sidetal efter dokumentets regler. I
   `andre.xml` skal den fulde `<source>` stå direkte på hvert digt, aldrig i
   `<workhead>`. Læg eksterne links i `source/@href`, aldrig i et indlejret
   `<a href>`, og skriv ikke »Teksten følger ...« i en note.
6. Forbind oversættelsen med den præcise originaltekst gennem Kalliopes
   gældende oversættelsesrelation. Opret ikke en generisk relation til digteren
   eller et andet tryk af samme værk.
7. Formatér de ændrede XML-filer, kontrollér diffen og kør hele testpakken.
   Dokumentér søgning, udgavevalg, tekstligt belæg og eventuelle åbne spørgsmål
   i overdragelsen og PR-beskrivelsen.

Følg repositoryets godkendelsesregler for commit, push og PR. Skillen giver
ikke selv yderligere tilladelse til eksterne ændringer.
