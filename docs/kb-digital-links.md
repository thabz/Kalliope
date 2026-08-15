# Digitale kildelinks til Det Kgl. Bibliotek

Dette notat beskriver den praktiske arbejdsgang for `<source href="…">`-links
til Det Kgl. Bibliotek. Det bygger på auditten af 111 KB-links i august 2026.

## Den vigtige skelnen

En KB-post for den trykte udgave er ikke nødvendigvis den post, der indeholder
digitaliseringen. Den fysiske post kan have næsten samme titel og årstal og kan
endda blive markeret med `Alma-E` i søgeresultaterne, uden at dens permalink
viser PDF-links.

Et digitalt match har normalt:

- en titel, der svarer til værket;
- en beskrivelse i stil med `Digitalisering 2017 af udgaven: …, 1867 …`;
- originaludgavens årstal, forlag og eventuelt sidetal i beskrivelsen;
- `Alma-E` som recordtype;
- på selve posten et eller flere links med teksten `Link til elektronisk udgave`.

Det er beskrivelsen af originaludgaven, der identificerer den rigtige
digitalisering. Recordens eget årstal er ofte digitaliseringsåret og må derfor
ikke sammenlignes direkte med værkets udgivelsesår.

## Anbefalet arbejdsgang

1. Udtræk titel, forfatter, originalår, forlag og facsimile-ID fra XML-kilden.
2. Søg i KB på `Digitalisering`, værkets titel, originalår og forfatterens
   efternavn. En søgning kun på titlen finder ofte den fysiske post først.
3. Begræns kandidaterne til `Alma-E`.
4. Kontrollér kandidatens beskrivelse mod den konkrete kilde: originalår,
   forlag, omfang og eventuelt eksemplar-/hyldesignatur.
5. Åbn kandidatens permalink i KB’s brugerflade og kontrollér, at siden viser
   `Vis online` og links til farve- eller sort-hvid-PDF.
6. Brug kandidatens digitale record-ID i XML-linket:

   ```text
   https://soeg.kb.dk/permalink/45KBDK_KGL/1o797oc/alma<record-id>
   ```

   `1pioq0f` er den generelle katalogkontekst, som ofte ender på den fysiske
   bibliografiske post. Den digitale kontekst, der blev verificeret i auditten,
   er `1o797oc`.

## KB’s offentlige metadata-endpoint

Primo-poster kan undersøges uden browseren via:

```text
https://soeg.kb.dk/primaws/rest/pub/pnxs/L/alma<record-id>?vid=45KBDK_KGL:KGL&lang=da
```

Søgninger bruger samme host og endpoint med parametre som:

```text
q=any,contains,Digitalisering+<titel>+<originalår>+<forfatter>
scope=MyInst_and_CI
tab=Everything
```

I PNX-svaret er især disse felter nyttige:

- `pnx.control.recordid`: record-ID’et til permalinket;
- `pnx.display.title`: digitaliseringens titel;
- `pnx.display.creationdate`: digitaliseringsåret;
- `pnx.display.description`: beskrivelsen af originaludgaven;
- `delivery.deliveryCategory`: skal normalt indeholde `Alma-E`;
- `delivery.link`: links til de elektroniske udgaver, typisk med
  `linkType: linktorsrc`.

Metadataresponset er ikke altid komplet. Nogle `Alma-E`-poster viser ikke
`delivery.link` i et enkelt API-kald, selv om brugerfladen viser PDF-links.
Browserkontrollen af `Vis online` er derfor den endelige validering.

## Faldgruber

- Brug ikke automatisk en fysisk record, bare fordi titel og årstal matcher.
- Brug ikke digitaliseringsåret som originalår.
- Stol ikke alene på `Alma-E` i en søgerespons; kontrollér beskrivelsen og
  PDF-links på den konkrete record.
- Vær opmærksom på flere digitaliseringer af samme titel, fx forskellige bind,
  eksemplarer eller udgaver.
- Hvis der er flere kandidater, skal forlag, sidetal og beskrivelse afgøre
  valget. Ellers skal linket stå urørt og markeres til manuel afklaring.
- Facsimile-attributterne (`facsimile`, `facsimile-pages-num` og
  `facsimile-pages-offset`) skal ikke ændres, når kun kilde-linket rettes.

## Auditresultat og uafklarede tilfælde

I auditten blev 106 digitale poster identificeret og linket med `1o797oc`.
Fem poster gav ikke et entydigt metadata-match og blev derfor ikke ændret.
Det gælder blandt andet *Hans Ahlmann: Ungdoms Legende* (1907). Den bør først
opdateres, når KB’s digitaliserede record kan dokumenteres med samme type
beskrivelse og PDF-links som i eksemplet med *Ny Digtsamling* (1867).
