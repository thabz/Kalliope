# Kalliope

Snapshot af Kalliopes eksisterende personregister, brugt som baseline for
kandidatmatchning. Kildegrundlaget er repoets `fdirs/*/info.xml`; de udtrukne
observationer ligger i `observations.json`.

## Hentning

Data er læst lokalt fra repositoryets `fdirs/*/info.xml`. Der er ingen ekstern
netværkshentning. Snapshotet kan genskabes med kandidatregisterets normale
pipeline, men skal ikke genskabes, hvis `observations.json` og manifestet stadig
passer til XML-formatet.

## Begrænsning

Dette er Kalliopes eksisterende redaktionelle register, ikke en komplet liste
over alle danske digtere.

## Felter og problemer

Kalliope-id, navn, navneformer, fødsels- og dødsdata, sprog, autoritets-id’er
og værk-id’er bevares, når de findes. XML-formatet er den lokale
kildesandhed; den afledte JSON-fil må ikke erstatte XML’en.
