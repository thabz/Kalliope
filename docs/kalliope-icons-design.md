# Kalliopes dagsikoner

## Formål

Kalliopes ikon i sidens header kan skifte på udvalgte mærkedage. Ikonerne er
illustrationer, som knytter sig til en dato, en højtid eller en digter. På almindelige
dage vises standardikonet.

Denne mekanisme er adskilt fra forsiden **I dag**:

- dagsikonet vælges af `common/kalliope-icon.js`
- dagens begivenheder og digterportræt bygges af `tools/build-static/today.js`
- et portræt kan prioriteres i `content/today/portrait-priorities.json`

Et dagsikon med en digter garanterer derfor ikke i sig selv, at digterens portræt
vises blandt dagens begivenheder. Når de to ting skal følges ad, skal både
datoregisteret og portrætprioriteringen opdateres.

## Filer og navngivning

Dagsikoner ligger i:

```text
public/images/about/kalliope-days/
```

En datospecifik fil navngives `MM-DD.jpg`, for eksempel `01-25.jpg`. Filnavnet
skal også optages i datolisten i `common/kalliope-icon.js`.

`12-xx.jpg` er et fælles decemberikon. Enkelte datoer kan genbruge et andet
ikon ved at pege på dets datonøgle; Kingos fødselsdag den 15. december genbruger
for eksempel `09-08.jpg`.

## Valg af ikon

`getKalliopeIconSrc()` anvender denne rækkefølge:

1. Et eksplicit ikon eller en eksplicit genbrug for datoen.
2. Det fælles decemberikon fra 1. til og med 26. december.
3. Standardikonet `/images/about/poet.jpg`.

`getKalliopeIconDate()` understøtter `?date=MM-DD`, så et ikon kan ses uden at
ændre systemdatoen. Ugyldige datoer ignoreres.

## Billedkrav

- Formatet er JPEG.
- Motivet skal have samme høje, portrætorienterede komposition som de øvrige
  ikoner.
- Den ydre baggrund skal fremstå ensartet hvid uden papirstruktur, skygge eller
  farvestik.
- Motivet må gerne have cremefarvet akvareltekstur; kravet om hvid gælder kun
  baggrunden omkring motivet.
- JPEG-komprimering kan flytte en hvid pixel få værdier fra RGB
  `(255, 255, 255)`. Testen accepterer derfor en lille teknisk tolerance.

## Portræt på en digters mærkedag

Hvis en bestemt digter altid skal levere dagens portræt:

1. Digterens `info.xml` skal indeholde datoen.
2. Digteren skal have `portraits.xml` med et primært portræt.
3. `content/today/portrait-priorities.json` skal knytte `MM-DD` til digterens id.

Læg prioriteringen under `all`, når den skal gælde på alle sprog. En
sprogspecifik prioritering kan overskrive den fælles værdi.

## Test

`__tests__/kalliope-icon.test.js` kontrollerer datovalg, genbrug og fallback.
`__tests__/kalliope-icons-background.test.js` finder automatisk alle JPEG-filer
i ikonmappen og kontrollerer den yderste otte pixels brede ramme. Rammen skal
være næsten hvid og neutral; bredden er valgt, så testen måler baggrunden uden
at ramme motiver, der ligger tæt på kanten.

Tests af portrætprioriteringer ligger i
`__tests__/today-portrait-priorities.test.js`.
