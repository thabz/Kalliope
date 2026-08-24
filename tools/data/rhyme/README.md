# Corpus-lært rimmodel

`corpus-model.json.gz` genereres deterministisk fra Kalliopes egne dansksprogede
digte med `npm run train-rhyme-model`. Udvalget omfatter værker fra 1820 til
1880 og digte med mindst ni strofer, hvor alle strofer har samme længde på
mindst fire linjer.

Modellen indeholder kun aggregerede tegnoperationer, rimpar og metadata om
træningskorpusset. Den indeholder ikke digttekster og bygger ikke på NST eller
andre eksterne udtaleleksika.

Et lille sæt redaktionelt bekræftede positive og negative rimpar i træneren
fungerer som ankre for sjældne historiske rim. De er også dækket af
regressionstests.
