# Agent Instructions

Disse regler gælder for AI-agenter og automatiserede assistenter, der arbejder i dette repository.

## Dokumentation

- Læs `docs/style-guide.md` før alle ændringer i repositoryet og før oprettelse
  eller opdatering af issues og PRs.
- Læs derefter den specialdokumentation, som stilguiden henviser til for det
  relevante område.
- Ved oprettelse af et nyt digt skal tekst-id'et bestå af forfatter-id, dags dato
  i formen `YYYYMMDD` og et tocifret løbenummer, fx `merrill2026080101`.

## Repository-skills

- Brug `$add-kalliope-work`, når et nyt værk skal indsættes og afleveres som
  en pull request.
- Brug også `$pdf-to-kalliope`, når kilden er en komplet scannet PDF, der skal
  OCR-behandles eller transskriberes. I den arbejdsgang styrer
  `$pdf-to-kalliope` selve PDF-, transskriptions- og korrekturarbejdet, mens
  `$add-kalliope-work` styrer PR-checklisten og overdragelsen til brugeren.
- Brug `$prepare-kalliope-titlepage`, når et titelblad skal rettes op,
  beskæres eller kvalitetskontrolleres. `$pdf-to-kalliope` bruger denne skill
  som sit faste billedbehandlingstrin for `p1`.

## Kalliopes dækningsmål

Ved arbejde med personer, værker, kilder og import skal
`docs/alle-danske-digtere.md` læses først.

Løsninger må ikke optimere for enkelte kendte forfattere på bekostning af
det langsigtede mål om dokumenterbar dækning af alle relevante danske
digtere.

## Forespørgsler på korpusdata

- Brug de genererede JSONL-gzipfiler i `public/api/v1/` til opslag,
  optællinger, filtrering og audit af korpusdata. Læs
  `docs/corpus-dataset.md` først, og brug streaming med `gzip` og `jq` frem for
  at pakke hele datasættet ud.
- Scan ikke alle XML-filer i `fdirs/` eller `content/` som førstevalg. Gå kun
  til XML, når bulkfilerne ikke indeholder de nødvendige felter, eller når den
  konkrete opgave kræver kilde-XML'en.
- Ved komplekse relationelle audits kan et valgfrit lokalt SQLite-indeks bygges
  med `make build-sqlite` og åbnes med `make sqlite`. Læs
  `docs/sqlite-index.md` først. Indekset er ikke en del af standard-buildet
  eller det offentlige datasæt.

## XML-data

- Angiv altid `lang` med en ISO 639-1-sprogkode på `<quote>`, når citatet ikke
  er på dansk. Gennemgå korte mottoer og enkeltord manuelt; dansk- og
  norskprægede historiske sprogformer må ikke mærkes uden en sikker vurdering.
- Brug ikke `<a>` eller `<xref>` i værkernes egentlige brødtekst i `<body>`.
  Henvisninger fra digte, prosa og citatblokke skal ligge i `<note>` eller
  `<footnote>`; links i keywordtekster og biografier er fortsat tilladt.
  Attributlinks som `source/@href` er metadata og berøres ikke af reglen.

## Git og GitHub

- Hele testpakken skal køres og bestå, før der oprettes en PR.
- Når brugeren beder om at få fikset et issue, skal agenten starte i et nyt
  worktree baseret på `origin/master` og først melde arbejdet klar, når GitHub
  CI er gennemført.
- Når en PR skal lukke et GitHub issue automatisk, skal PR-beskrivelsen bruge GitHubs engelske closing keyword, fx `Fixes #123`. Skriv ikke `Lukker #123`, fordi GitHub ikke auto-lukker issues på dansk.
- Branch-navne må ikke indeholde `/` eller have et teknisk prefix. Brug et kort,
  beskrivende navn som `robert-burns-ikon`.
- Når brugeren beder om at få fikset et GitHub issue, skal arbejdet udføres i et
  nyt worktree og afsluttes med en PR. Agenten har i denne arbejdsgang automatisk
  godkendelse til at committe og pushe de nødvendige ændringer for at oprette PR'en.
- Uden for arbejdsgangen for GitHub issue-fixes må agenten aldrig committe, pushe
  eller amende kodeændringer, før brugeren eksplicit har læst ændringen og bedt om
  commit/push. Det gælder også opdateringer til eksisterende PR-branches.
- Ved `gh issue view ... --comments` kan GitHub CLI i non-TTY give tomt tekstoutput for issues uden kommentarer. Brug enten `--json number,title,state,body,comments` eller kør kommandoen med TTY, når issue-indholdet skal læses.
- Hvis `gh auth status` melder et ugyldigt token, samtidig med at `gh api` melder en forbindelsesfejl, skal GitHub-forbindelsen testes uden sandboxens netværksbegrænsning, før brugeren bedes logge ind igen. En blokeret API-forbindelse kan ellers fejlagtigt ligne et udløbet token.
- Når du opretter eller opdaterer en PR, behøver du ikke vente på GitHubs CI, medmindre brugeren eksplicit beder om det.
- Når brugeren beder dig merge en PR, skal det ske som squash merge.
- Ved `gh pr create`, `gh issue create`, `gh pr comment` og `gh issue comment` skal brødteksten skrives til en midlertidig fil og sendes med `--body-file`. Skriv ikke markdown direkte i shell-argumenter, fordi backticks og anden shell-syntaks kan blive evalueret som kommandoer.
