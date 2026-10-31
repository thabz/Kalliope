# XML-format for biografier

En digters biografier ligger i `fdirs/<id>/bio.xml`. Roden `<bio>` indeholder
ét `<biographies>`-element med et eller flere `<biography>`-elementer:

```xml
<bio>
  <biographies>
    <biography>
      <head>
        <source href="https://example.com/opslag">Kildeangivelse</source>
      </head>
      <body>Biografiens tekst.</body>
    </biography>
  </biographies>
</bio>
```

Hver biografi har sit eget `<head>` og `<body>`. Kilder i `<head>` gælder kun
for den pågældende biografi. Flere selvstændige kildetekster skal derfor ligge
i hvert sit `<biography>`-element og må ikke adskilles med en vandret streg i
samme `<body>`.

En ældre redaktionel tekst, som skal bevares uden at blive vist på sitet,
markeres med `hidden="true"` på `<biography>`. Skjulte biografier bevarer deres
normale `<head>` og `<body>` og må ikke gemmes i XML-kommentarer.

## Blanke linjer

Trim blanke linjer i begyndelsen og slutningen af `<body>`, også i skjulte
biografier. Bevar blanke linjer mellem tekstens afsnit. Ved XML på flere
linjer kan indholdet stå på linjen efter `<body>`, og `</body>` på linjen
lige efter det sidste tekstindhold; der skal ingen tomme linjer imellem.
Biografibuildet trimmer også tomme kantlinjer fra de genererede tekstdata,
herunder linjer, som kun indeholder indrykning eller XML-kommentarer.

## Skribentkreditering og signaturer

Biografiens skribent krediteres kun i `<head><source>`. Udelad originalens
selvstændige forfatterlinjer og afsluttende signaturer fra `<body>`, fx
`<i>J. Kinch.</i>`. Det gælder også signaturer mellem afsnit i et opslag med
flere skribenter; alle skribenter angives i den pågældende kildeangivelse.

Kontrollér skribentens navneform mod originalens signatur og eventuelt
udgavens medarbejderregister. Udvid ikke initialer uden belæg, og forveksl
ikke artiklens skribent med værkets redaktør. Aarestrups DBL1-biografi er
fx signeret Bertel Elmgaard og krediteres med dette navn i kilden.

Fjern kun selve skribentkrediteringen fra brødteksten. Navne i fortællingen,
citerede digte, brevsignaturer i citater og bibliografiske henvisninger
bevares. Ved rettelse af en eksisterende biografi skal en manglende eller
fejlagtig kreditering i `<source>` afklares, før signaturen fjernes.

## Kildevalg

For danske forfattere er <i>Dansk Biografisk Leksikon</i> (DBL) den foretrukne
biografikilde. Hvis DBL ikke har et relevant opslag eller ikke giver en
tilstrækkelig biografisk fremstilling, bruges en artikel fra Salmonsens
Konversationsleksikon som erstatning eller supplement.

### Ophavsret og DBL-udgaver

Biografitekst fra DBL må kun indsættes eller transskriberes fra 1. udgave
(1887-1905) og 2. udgave (1932-44). Angiv altid udgave, bind og sidetal i
`<source>`, og link så vidt muligt til det konkrete digitale facsimile.

Tekst fra DBL's 3. udgave (1979-84) og senere opdateringer på Lex må ikke
kopieres ind i Kalliope, da den for størstedelens vedkommende fortsat er
ophavsretligt beskyttet. Disse opslag må kun bruges til at finde eller
identitetskontrollere et opslag i 1. eller 2. udgave; Kalliopes biografitekst
skal i så fald kontrolleres mod den ældre udgave og kildeangives til denne.

For ikke-danske forfattere er Salmonsens Konversationsleksikon en foretrukken
standardkilde, når der findes et sikkert identificeret personopslag. Følg i
begge tilfælde den særskilte arbejdsgang i
[`docs/salmonsen-biographies.md`](salmonsen-biographies.md), herunder kravet om
kontrol mod facsimilen og fuldstændig transskription.

## Interne henvisninger og manglende digte

I nye eller bearbejdede biografier linkes alle sikkert identificerede omtaler
af eksisterende tekster, værker og personer med `<a poem="id">ordlyd</a>`,
`<a work="person/vaerk">ordlyd</a>` og `<a person="id">ordlyd</a>`.
Bevar kildens ordlyd og typografi; brug ikke `<xref>` til disse henvisninger.
Manglende digte registreres som højt ønskede tekster efter
`docs/person-editorial.md`; `<span data-wish="id">ordlyd</span>` er en
redaktionel markør, som fjernes ved rendering uden at ændre indholdet.
Tilladte biografikilder er udelukkende de udgaver nævnt ovenfor. Andre kræver
brugerens godkendelse. Eksisterende biografier gennemgås ved bearbejdning,
ikke som en automatisk global omskrivning.
