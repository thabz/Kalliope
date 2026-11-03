# Personstatus og højt ønskede tekster

## Biografidækning

`npm run person-editorial -- --check` validerer alle egentlige personer
(`poet`, `artist`, `person`), også nye ikke-committede mapper. Samleposter er
undtaget. En synlig biografi med ikke-tom body eller dokumenteret forgæves
søgning kræves. Kun skjulte biografier opfylder ikke kravet.

```xml
<biography-status status="not-found" checked-on="2026-10-31">
  <checked-source id="dbl1">Undersøgt navneformer og register.</checked-source>
  <checked-source id="dbl2">Undersøgt navneformer og register.</checked-source>
  <checked-source id="salmonsen2">Intet relevant personopslag.</checked-source>
  <note>Beskriv også supplement/4. udgave, hvor relevante, og afgrænsningen af søgningen.</note>
</biography-status>
```

Tilladte kilde-id'er: `dbl1`, `dbl2`, `salmonsen2`, `salmonsen-supplement`,
`salmonsen4`, `erslew` og `ehrencron-mueller`. De sidste to er reservekilder
efter prioriteringen i `docs/xml-biographies-format.md`. Undersøg de relevante
tilladte kilder, og begrund udeladelser i
noten. En gyldig markør kræver reel dato, mindst én kontrolleret kilde med en
ikke-tom beskrivelse og en ikke-tom begrundelse; undersøgelsens
tilstrækkelighed vurderes redaktionelt.
Markør og synlig biografi må ikke findes samtidig. Metadataformatter bruges
uændret. Ingen nye offentlige API-felter indføres.

Korpustesten i `make test` håndhæver kravet for alle egentlige personer uden
undtagelsesliste og uden genererede data. Biografistatus vedligeholdes kun i
personens `info.xml`. Når en synlig biografi indsættes, fjernes den negative
status.

Ved overførsel af tidligere søgninger bevares den oprindelige søgedato og
begrundelse. Registrér kun de kildeundersøgelser, som dokumentationen faktisk
omfatter. En søgning i Salmonsen er ikke dokumentation for en søgning i DBL;
nyere og mere omfattende undersøgelser kan opdatere personens status.

## Ønskeregister

`tools/data/wanted-texts.json` har `version: 1` og `entries`. Registeret er
redaktionelt og publiceres ikke som en side. En post ser fx sådan ud:

```json
{
  "id": "digter-digt",
  "poetId": "digter",
  "title": "Digtets titel",
  "aliases": ["Anden dokumenteret titel"],
  "firstline": "Eventuel dokumenteret førstelinje",
  "source": "Bibliografisk evidens for identifikationen",
  "status": "open",
  "mentions": [{"file": "fdirs/digter/bio.xml", "text": "Digtets titel"}]
}
```

Kun `aliases` og `firstline` er valgfrie. Ønske-id'er er stabile små ASCII-id'er
med bindestreg. Omtalen markeres med
`<span data-wish="digter-digt"><i>Digtets titel</i></span>`.
`mentions[].text` er præcis omtalt tekst uden tags, inklusive tegnsætning.
Flere omtaler kan pege på samme ønske; undgå dubletter efter identitetskontrol.
Markøren må ikke indeholde links eller andre ønskemarkører.

Som forberedelse til en PR med tekstimport køres `npm run person-editorial`
samlet for PR’ens ændringer. Rapporten køres ikke af `build-static` og skal ikke
køres efter hver enkelt tekst eller hvert build. Den matcher forfatter og
normaliseret titel/navnevariant eller førstelinje mod JSONL-korpus. Brug et
static-build, der indeholder PR’ens nyimporterede tekster, før rapporten køres.
Matcher er kun kandidater, også ved ét enkelt titelmatch. Ved usikker
identifikation forbliver ønsket åbent med forklaring i `source`.

Efter manuel identifikation tilføjes `targetId` med det konkrete tekst-id og
begrundelsen opdateres i `source`. Kør så:

```
npm run person-editorial -- --reconcile
```

Kommandoen validerer hele registeret før skrivning, erstatter markørerne med
`<a poem="targetId">` og bevarer indhold og typografi. Status bliver `fulfilled`;
post og omtaler bevares som historik. Gentagen kørsel er indholdsmæssigt neutral.
DOM-serialisering kan normalisere XML-syntaks; gennemgå altid diff.
Et blankværk er ikke et tekstmål. Forkert forfatter, manglende mål, forsvundne
omtaler og slettede tidligere mål giver fejl. Builds/tests ændrer ingen data.
Registeret bør være valideret før commit; gennemgå også den renderede biografi.
