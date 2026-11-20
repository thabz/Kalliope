# Lien-Hua (1919): import stoppet ved manglende opslag

## Kilde

Aage Matthison-Hansen (oversætter): *Lien-Hua. En Samling kinesiske Digte*,
Nyt Nordisk Forlag, København og Kristiania, 1919.

- [KB's farve-PDF](https://www.kb.dk/e-mat/dod/115408052380-color.pdf), hentet
  20. november 2026: 211 PDF-sider, 68.680.492 bytes.
- SHA-256: `c9f6d8e842c5464c75826834bdc768c158f618451df451786cc22fa356a3f5f6`.
- Eksisterende værk: `fdirs/matthison/1919.xml`, en tom bibliografisk
  registrering med `status="incomplete"`. Den er bevaret uændret.

## Manglende sider

Scanningen mangler opslaget med bogens side 23–24. Den visuelle kontrol af
PDF-side 24–29 viser følgende rækkefølge. Filnavnene angiver den normale
nulbaserede facsimilemapping; billederne er ikke publiceret.

| PDF-side | Facsimilefil | Indhold |
| --- | --- | --- |
| 24 | `023.jpg` | Sidste forordsside, trykt side 19; dateret København 1919 og signeret Aage Matthison-Hansen. |
| 25 | `024.jpg` | Unummereret blank bagside, svarende til side 20. |
| 26 | `025.jpg` | Illustration med billedteksten »Thu Fu og Li Tai-Pé (Kinas Schiller og Goethe.)«, svarende til side 21. |
| 27 | `026.jpg` | Unummereret blank bagside, svarende til side 22. |
| — | — | Side 23–24 mangler. |
| 28 | `027.jpg` | Unummereret afsnitsblad »Liang-Dynastiet (e. Kr. 502–557)«, svarende til side 25. |
| 29 | `028.jpg` | Wang Séng-Yu: »Selvbebrejdelser«, trykt side 26. |

Sidernes blanke bagsider og de to følgende blade er kontrolleret direkte på
farvescanningen. Springet på to sider ligger mellem PDF-side 27 og 28.
Indholdet af de manglende sider er ikke fastslået; det kan derfor heller ikke
afgøres, hvilke tekster eller paratekster der berøres.

## Udført kontrol og stop

OCR/PDF-miljøet er kontrolleret med `tools/ocr-environment`. PDF-metadata og
den eksisterende OCR er undersøgt diagnostisk, og PDF-side 24–29 er gengivet
til visuel kontrol af hullet. Der er ikke produceret frisk OCR, transskriberet
tekst eller gennemført korrektur. Sideinventaret er ikke fuldført.

Importen er stoppet efter `pdf-to-kalliope`-reglen om manglende facsimilesider.
Ingen XML, titelbladsbilleder eller facsimileaktiver er tilføjet. Arbejdsfiler
ligger uden for repositoryet.

## Genoptagelse

Der kræves en komplet scanning af samme udgave, som indeholder side 23–24.
Kontrollér først opslaget og derefter hele sidernes rækkefølge. Udarbejd så et
nyt sideinventar og en ny mapping mellem trykte sider, PDF-sider og
facsimilefiler, før OCR og transskription begynder. De manglende sider må ikke
rekonstrueres fra en anden udgave eller en eksisterende transskription.
