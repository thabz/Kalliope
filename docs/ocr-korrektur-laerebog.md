# Lærebog: redigering og reparation af OCR-scannede tekster

Dette dokument samler generelle principper, som er blevet identificeret under
korrektur af OCR-scannede PDF'er. Det handler om arbejdsmetode og struktur, ikke
om enkelte fejllæste ord.

Den overordnede regel er, at facsimilet er den autoritative kontrolkilde. Se
`docs/facsimile-korrektur.md` for den fulde arbejdsgang.

## Godkendte principper

### 1. Kontroller strofeafstand og strofelængde

Ved OCR-redigering af digte skal strofeinddelingen kontrolleres manuelt mod
facsimilet. Manglende eller forkerte tomme linjer mellem strofer skal rettes,
så den oprindelige struktur bevares.

En digttekst har ofte samme strofelængde hele vejen igennem. Hvis et digt
normalt består af strofer med samme antal vers, bør en afvigelse undersøges mod
facsimilet, før teksten opdeles eller samles. Strofelængden er et kontrolsignal,
men ikke i sig selv et bevis; facsimilet afgør sagen.

### 2. Ret fejlagtig indrykning

OCR kan give fejlagtig indrykning i begyndelsen af linjer, især omkring stort
begyndelsesbogstav, drop cap eller ornamentik. Linjerne skal derfor justeres
efter facsimilets faktiske sats, ikke efter OCR'ens indrykning.

Linjernes indrykning skal respekteres som en del af digtets struktur. Ligesom
strofelængden ofte er den samme gennem hele digtet, kan stroferne have en
gentaget indrykningsprofil. En enkel profil kan eksempelvis se sådan ud:

```text
AAAAAAAA
    BBBBBBB
CCCCCCCC

DDDDDDDD
    DDDDDDD
EEEEEEEE
```

Profilen kan være langt mere avanceret, men princippet er det samme: Sammenlign
linjernes indbyrdes indrykning i flere strofer. Et stort begyndelsesbogstav,
en drop cap eller ornamentik må ikke få OCR'en til at skabe en falsk profil.
Kontrollér derfor linjernes samlede flugt mod nabolinjerne og facsimilet, før
indrykningen bevares eller ændres.

### 3. Gennemgå hele dokumentet mod facsimilet

Korrekturgennemgangen skal være systematisk og omfatte hele dokumentet, også
efter at de første fejl er rettet. En rettelse ét sted kan afsløre samme
strukturelle OCR-fejl andre steder.

### 4. Kontroller verslinjer og linjeskift

Linjeskift skal kontrolleres mod facsimilet. OCR kan både slå vers sammen og
indsætte linjeskift de forkerte steder, især omkring korte vers, sideskift og
strofeafslutninger.

### 5. Brug tekstens genre som kontrol

Digte skal vurderes ud fra verslinjer og strofer, mens prosa skal vurderes ud
fra sammenhængende afsnit. OCR-formatet må ikke ukritisk anvendes ens på begge
dele.

### 6. Korrekturlæs også fodnoter

Gennemgangen skal også omfatte fodnoter og andre tekstdele uden for
hovedteksten. De skal både OCR-korrigeres og struktureres korrekt som noter,
ikke behandles som almindelig brødtekst.

### 7. Brug en stabil facsimile som kontrolkilde

Faksimilen skal være den autoritative kontrolkilde. Kildelinket skal derfor
pege på en stabil og entydig digital facsimile, så teksten senere kan
efterprøves samme sted. Se også `docs/kb-digital-links.md` ved KB-links.

### 8. Markér mottoer som citater

Mottoer og andre citater skal markeres som citater (`quote`), ikke som
undertitler. Dokumentets semantiske struktur skal afspejle tekstens funktion.

### 9. Hold strofenumre adskilt fra verslinjerne

Strofenumre og andre typografiske markører skal holdes adskilt fra selve
verslinjerne. De må ikke ved OCR-reparation indgå som en del af teksten eller
forrykke strofernes linjestruktur.

### 10. Træk fulde datoer ud som tekstmetadata

Datoer, der står i en tekst, skal opdages og registreres i tekstens `<dates>`.
Datoer registreres kun i tekster, ikke på værkniveau. Den trykte tekst må aldrig
ændres eller forkortes, når datoen trækkes ud som metadata.

Alle datoer, der registreres, skal være fuldstændige og normaliseres til
`YYYY-MM-DD`. Den diplomatiske form bevares i teksten, mens metadata bruger den
normaliserede form. Eksempelvis bliver `5te Marts 1898` til `1898-03-05` i
metadata, uden at teksten ændres.

Typen vurderes efter den bedste samlede læsning af tekstens placering og
indhold:

- En dato nederst efter teksten er normalt `<written>`.
- En dato i en underoverskrift er normalt `<event>`.
- En dato, der tydeligt vedrører en opførelse, er `<performed>`.

Hvis teksten indeholder flere fulde datoer, registreres de alle, når deres type
kan vurderes. Mangler dag, måned eller år, registreres datoen ikke som fuld
metadata-dato; den bliver stående urørt i teksten. Følg formatreglerne i
`docs/xml-work-format.md`.

### 11. Hold titler og førstelinjer fri for markup

Titler og førstelinjer må aldrig indeholde markup. De skal altid være ren tekst.
Strukturelle oplysninger, formatering og semantiske elementer skal placeres i
de relevante XML-elementer uden for `<title>` og `<firstline>`.

## Afgrænsning

Enkelte OCR-fejl i ord, tegn eller bogstaver er ikke medtaget her. De kan være
relevante for den konkrete korrektur, men udgør ikke alene en generel regel,
som kan overføres til andre dokumenter.
