# Titelbladsbilleder

Denne vejledning er den autoritative billedstandard for titelblade i Kalliope.
Den gælder selve billedbehandlingen; filnavne og XML-markup er beskrevet i
`docs/xml-work-format.md` og PDF-importens repository-skill.

## Formål

Et titelbladsbillede skal vise den trykte bogside trofast og rent. Tekstlinjerne
skal stå vandret, og scannerbed, sorte rammer og anden baggrund uden for bogen
skal fjernes. Hele den fysiske bogside skal samtidig bevares, inklusive dens
naturlige papirmarginer.

Kildens tekst, ornamentik, trykte rammer, pletter, papirfarve og andre fysiske
spor er en del af facsimilet. De må ikke repareres væk.

## Klassificér kilden før behandling

Kontrollér først, at billedet faktisk er publikationens titelblad og har
tilstrækkelig opløsning. En halvtitel, forside eller forkert side må ikke gøres
til et titelblad ved beskæring. Et forkert eller for lille kildebillede skal
udskiftes fra PDF'en.

Skeln mellem:

- en korrekt titelbladsside, der kan rettes op og beskæres;
- en forkert side, som skal erstattes;
- en korrekt, men utilstrækkelig gengivelse, som skal genudtrækkes i højere
  opløsning.

## Tilladte transformationer

Titelbladet må:

- roteres, så de bærende tekstlinjer er vandrette;
- beskæres for scannerbed, sorte scannerkanter og fremmed baggrund;
- eksporteres én gang som JPEG efter den geometriske behandling.

Beskæringen følger bogsidens papirkant, ikke trykfladen. Bevar blanke marginer,
og beskær aldrig tekst, ornamentik, trykte rammer eller andre elementer på
siden. Hvis papirkanten ikke kan bestemmes sikkert, skal billedet markeres til
manuel vurdering frem for at blive beskåret aggressivt.

Titelbladet må ikke:

- opskaleres;
- perspektivkorrigeres automatisk, når tekstlinjerne konvergerer eller siden er
  buet;
- skarpnes, udglattes, støjreduceres eller farvekorrigeres;
- retoucheres med Repair-, klonings- eller generative værktøjer;
- få rekonstrueret eller på anden måde nydannet tekst.

## Kvalitetskontrol

Sammenlign altid kilden og kandidaten visuelt i samme størrelse. Et resultat
kan kun godkendes automatisk, når alle disse forhold er opfyldt:

1. Det er den korrekte titelbladsside.
2. De bærende tekstlinjer fremstår vandrette.
3. Scannerbed og fremmede kanter er fjernet.
4. Hele bogsiden og dens naturlige marginer er bevaret.
5. Ingen tekst, ornamentik eller trykt ramme er beskåret eller ændret.
6. Farve, tone, slid og papirspor svarer til kilden.
7. Outputtet er ikke opskaleret, og højst 5% er beskåret fra hver enkelt kant
   efter rotationen.

Kantmålingen udføres i fuld opløsning. Sammenhængende mørke scannerstriber
beskæres, indtil striben ophører; lokale mørke genstande som sideklemmer må
ikke udløse yderligere beskæring.

Ved alvorlig perspektivforvrængning, buede tekstlinjer, utydelig papirkant,
meget lidt genkendelig tekst eller tvivl om indholdstab er status
`manual-review`. I den situation må den eksisterende titelbladsfil ikke
overskrives.

## Dokumenterede før/efter-eksempler

Følgende mergede pull requests bevarer brugerskabte korrektioner i deres
commitforløb og kan bruges som regressionsmateriale uden at kopiere billederne
ind i repositoryet:

- PR #1656, commit `3552aa188a`: rotation og beskæring af Mads Hansens
  *Sange*.
- PR #1657, commit `d9a196d52f`: beskæring af Ove Christian Drejers *Digte*.
- PR #1624, commit `1d8b8269dc`: opretning og beskæring af Anton Nielsens
  *Bakkegaarden*.
- PR #1472, #1468 og #1479: fjernelse af scannerkanter med den trykte side
  bevaret.
- PR #1527 og #1428: et forkert eller mindre egnet billede blev udskiftet;
  problemet var ikke en geometrisk korrektion.
- PR #1473, commit `00383129b0`: udskiftning med en gengivelse i højere
  opløsning.

Commit-SHA'er er permanente referencer. Hent eventuelle evalueringsbilleder til
en midlertidig mappe; de skal ikke committes som test-fixtures.
