# Corpus-lært rimmodel

`corpus-model.json.gz` genereres deterministisk fra Kalliopes egne dansksprogede
digte med `npm run train-rhyme-model`. Udvalget omfatter værker fra 1820 til
1880 og digte med mindst fem strofer, hvor alle strofer har samme længde på
mindst fire linjer.

Kun digte med ét entydigt hovedmønster i mindst 60 procent af stroferne bruges
som træningsfacit. Alle sikre strofer har grundvægt 1. En afvigende strofe får
ekstra vægt `1/n`, hvor `n` er digtets antal afvigende strofer; én afvigelse
giver derfor mest ny læring, to afvigelser næstmest osv.

Modellen indeholder kun aggregerede tegnoperationer, rimpar og metadata om
træningskorpusset. Den indeholder ikke digttekster og bygger ikke på NST eller
andre eksterne udtaleleksika.

Analysen har to passager. Først analyseres hver strofe uafhængigt. Derefter
samles evidens fra strofer med samme længde, og rimpar lige under modellens
tærskel kan løftes, når mindst 60 procent af stroferne har det samme
positionsrim. Den analyserede strofe indgår ikke selv i denne beregning.
Par med stærk lokal modevidens ændres ikke. Træningen bruger denne anden
passage fra og med anden iteration.

Ud over konkrete rimpar indeholder modellen kontekstuelle ændringer af hele
endelsessekvenser og en lille logistisk parklassifikator. Klassifikatoren har
en hård nedre beslutningsgrænse på 0,80 og kalibreres til mindst 95 procent
vægtet præcision, fordi falske rim er mere skadelige end manglende rim.

Perioden 1881–1920 indgår ikke i træningen og kan måles som tidsligt benchmark
med `npm run evaluate-rhyme -- --from-year=1881 --to-year=1920`.

Et lille sæt redaktionelt bekræftede positive og negative rimpar i træneren
fungerer som ankre for sjældne historiske rim. De er også dækket af
regressionstests.
