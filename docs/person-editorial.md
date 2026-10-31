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
`salmonsen4`. Undersøg de relevante tilladte kilder, og begrund udeladelser i
noten. En gyldig markør kræver reel dato, mindst én kontrolleret kilde og
ikke-tom begrundelse; undersøgelsens tilstrækkelighed vurderes redaktionelt.
Markør og synlig biografi må ikke findes samtidig. Metadataformatter bruges
uændret. Ingen nye offentlige API-felter indføres.

`tools/data/biography-backlog.json` er den frosne restanceliste ved indførelsen.
Tilføj aldrig personer til den. `--prune` fjerner afsluttede/slettede restancer;
kommandoen ændrer ikke biografier eller registrerer en søgning på nogens vegne.
Tests afviser nye mangler og afsluttede restancer, som ikke er fjernet.
Når listen er tom, gælder kravet globalt uden undtagelser.

`tools/data/salmonsen-biography-status.json` bevarer kildespecifikke negative
fund og eksisterende rapportering. Et sådant fund alene opfylder ikke det nye
krav. Genbrug evidensen ved personundersøgelsen; udvid den med øvrige relevante
kilder. Ved indsættelse af bio fjernes både generel negativ status og en eventuel
Salmonsen-post (det eksisterende statusværktøj kontrollerer sidstnævnte).

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

Efter enhver tekstimport køres `npm run person-editorial`. Rapporten matcher
forfatter og normaliseret titel/navnevariant eller førstelinje mod det senest
byggede JSONL-korpus; et friskt static-build kræves for nyimporterede tekster.
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
