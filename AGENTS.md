# Agent Instructions

Disse regler gælder for AI-agenter og automatiserede assistenter, der arbejder i dette repository.

## Dokumentation

- Læs `docs/style-guide.md` før alle ændringer i repositoryet og før oprettelse
  eller opdatering af issues og PRs.
- Læs derefter den specialdokumentation, som stilguiden henviser til for det
  relevante område.

## Repository-skills

- Brug `$add-kalliope-person` ved personoprettelse og målrettet berigelse.
- Brug `$add-person-portrait` ved portrætsøgning, portrætmetadata og square-beskæring.

- Brug `$add-kalliope-work`, når et nyt værk skal indsættes og afleveres som
  en pull request.
- Brug også `$pdf-to-kalliope`, når kilden er en komplet scannet PDF, der skal
  OCR-behandles eller transskriberes. I den arbejdsgang styrer
  `$pdf-to-kalliope` selve PDF-, transskriptions- og korrekturarbejdet, mens
  `$add-kalliope-work` styrer PR-checklisten og overdragelsen til brugeren.
- Brug `$prepare-kalliope-titlepage`, når et titelblad skal rettes op,
  beskæres eller kvalitetskontrolleres. `$pdf-to-kalliope` bruger denne skill
  som sit faste billedbehandlingstrin for `p1`.
- Brug `$add-translation-original`, når en originaltekst til en oversættelse
  skal opspores, udvælges, indsættes eller forbindes med oversættelsen. Brug
  også `$add-kalliope-work`, når originalen oprettes som et selvstændigt værk.

## Modeloplysninger og korrekturattester

Før et præcist modelnavn meldes utilgængeligt, skal agenten undersøge den
konkrete sessions metadata. En generel beskrivelse som »baseret på GPT-6«
eller listen over tilgængelige modeller identificerer ikke den valgte variant.

- Find sessions-id'et i `CODEX_THREAD_ID`, alternativt `CODEX_SESSION_ID`.
  Søg efter id'et i filnavnene under `$CODEX_HOME/sessions` og
  `$CODEX_HOME/archived_sessions`; standardroden er `~/.codex`.
- Læs de relevante `turn_context`-poster i den matchende JSONL-log.
  `payload.model` er modelnavnet; `payload.effort` eller
  `payload.reasoning_effort` angiver reasoning-niveauet. Brug postens
  tidspunkt og `payload.turn_id` til at finde den konkrete gennemgang, hvis
  modellen er ændret undervejs. Udskriv kun de nødvendige metadatafelter.
- `model` og `model_reasoning_effort` i `$CODEX_HOME/config.toml` kan bruges
  som supplerende kontrol. Konfigurationens aktuelle standardvalg dokumenterer
  ikke alene en tidligere sessions model eller et sessionsspecifikt override.
- Ved uafhængig korrektur skal oplysningerne gælde reviewerens session.
  Brug dens eget sessions-id og log, eller dokumenteret modelarv uden
  override. Producentens modelnavn må ikke uden belæg overføres til revieweren.
  Bed revieweren registrere model, reasoning-niveau og tidspunkt sammen med
  sin afsluttende rapport, mens sessionen stadig er tilgængelig.
- Hold modelnavn og reasoning-niveau adskilt: fx `gpt-6.1-sol` og `high`.
  XML-attestens `model` indeholder modelnavnet efter `docs/xml-work-format.md`;
  reasoning-niveau og grundlaget for identifikationen kan dokumenteres i
  reviewrapporten. Brug tidspunktet for den attesterede slutkontrol, ikke
  filens ændringstid, som attesttidspunkt.
- Hvis oplysningerne stadig ikke kan findes, beskriv hvilke konkrete kilder
  der er undersøgt, og hvad der faktisk vides. Gæt ikke et modelnavn.

Eksempel på afgrænset opslag; begge kommandoer læser kun lokale data:

```sh
rg --files "${CODEX_HOME:-$HOME/.codex}/sessions" \
  "${CODEX_HOME:-$HOME/.codex}/archived_sessions" \
  | rg --fixed-strings -- "${CODEX_THREAD_ID:-${CODEX_SESSION_ID:?Sessions-id mangler}}"

jq -c 'select(.type == "turn_context") | {
  timestamp, turn_id: .payload.turn_id, model: .payload.model,
  effort: (.payload.effort // .payload.reasoning_effort)
}' /sti/til/den-matchende-sessionslog.jsonl | tail -n 10
```

## OCR and PDF tooling

- Kør `tools/ocr-environment` som første trin ved OCR- og PDF-opgaver. Kontrollér
  eksisterende værktøjer, før et nyt systemværktøj installeres.
- Kraken er den foretrukne OCR-motor til historiske tryk og fraktur. Brug den
  eksisterende installation; geninstallér den ikke, og læg ikke
  projektdependencies i Krakens pipx-miljø. Brug projektets eget venv/uv-miljø
  til projektkode.
- Brug `pdftoppm` til PDF-sider som billeder og `pdftotext` til eksisterende
  PDF-tekst. Brug ImageMagick (`magick`) til billedbehandling. `ocrmypdf` kan
  bruges til almindelige PDF/OCR-workflows. Tesseract er et hjælpeværktøj og
  ikke nødvendigvis førstevalg til historisk fraktur.

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

- Værker registreres automatisk fra `<kalliopework>`-filer i digtermappen.
  Opret aldrig `<works>` i `info.xml`; elementet er ulovligt i RELAX NG.
  XML-filer skal være værker eller en dokumenteret metadatafil efter
  `docs/xml-info-format.md`. Særlige værkrækkefølger angives med `sort-order`
  på de enkelte værkfiler.

- Et trykt rettelsesark skal altid opdages ved sidegennemgangen og alle dets
  relevante rettelser indføres før færdigstatus. Registrér arket som `<errata>`
  i `<workhead>`, og mærk hver rettelse med XML-kommentaren
  `<!-- Rettelsesark: rettet] trykt -->`. Arket må aldrig oprettes som en
  selvstændig tekstpost.
- Angiv altid `lang` med en ISO 639-1-sprogkode på `<epigraph>`, når mottoet ikke
  er på dansk. Gennemgå korte mottoer og enkeltord manuelt; dansk- og
  norskprægede historiske sprogformer må ikke mærkes uden en sikker vurdering.
- Brug ikke `<a>` eller `<xref>` i værkernes egentlige brødtekst i `<body>`.
  Henvisninger fra digte, prosa og citatblokke skal ligge i `<note>` eller
  `<footnote>`; links i keywordtekster og biografier er fortsat tilladt.
  Attributlinks som `source/@href` er metadata og berøres ikke af reglen.

## Git og GitHub

- Når en kodeændring medfører ændringer i UI, skal PR'en altid ledsages af
  et skærmskud af den ændrede visning. Indsæt skærmskuddet i PR-beskrivelsen,
  så ændringen kan vurderes direkte i PR'en.
- Kør `make test`, før der oprettes en PR. Kommandoen skal afslutte med
  exitkode 0; der kræves ikke andre testkommandoer, medmindre en relevant
  specialdokumentation udtrykkeligt angiver dem.
- Opret altid worktrees under
  `$HOME/src/kalliope-worktrees/<digterid>-<titel>-<årstal>/`, fx
  `$HOME/src/kalliope-worktrees/blicher-digte-1814/`.
- Når brugeren beder om at få fikset et issue, skal agenten starte i et nyt
  worktree baseret på `origin/master` og først melde arbejdet klar, når GitHub
  CI er gennemført.
- Alle PR'er, der udspringer af et GitHub issue, skal have `Fixes #123` med
  det konkrete issue-nummer i beskrivelsen fra oprettelsen. Det gælder også
  draft-PR'er, og uanset om issuet eller arbejdet er et udkast, afventer noget
  eller har en anden ufærdig tilstand. Dermed kan forbindelsen til det
  igangværende arbejde ses i GitHub. Bevar henvisningen ved senere opdateringer
  af PR-beskrivelsen. Skriv ikke `Lukker #123`, fordi GitHub ikke auto-lukker
  issues på dansk.
- Branch-navne må ikke indeholde `/` eller have et teknisk prefix. Brug et kort,
  beskrivende navn som `robert-burns-ikon`.
- Når brugeren beder om at få fikset et GitHub issue, skal arbejdet udføres i et
  nyt worktree og afsluttes med en PR. Agenten har i denne arbejdsgang automatisk
  godkendelse til at committe og pushe de nødvendige ændringer for at oprette PR'en.
- Agenten må aldrig oprette en commit med Codex, OpenAI eller en anden agent som
  author eller committer. Før hver commit skal agenten kontrollere den effektive
  Git-identitet og bruge repositoryejerens allerede konfigurerede navn og
  e-mailadresse; agenten må ikke erstatte dem med en agentidentitet via Git-config
  eller `GIT_AUTHOR_*`-/`GIT_COMMITTER_*`-miljøvariable.
- Ved `gh issue view ... --comments` kan GitHub CLI i non-TTY give tomt tekstoutput for issues uden kommentarer. Brug enten `--json number,title,state,body,comments` eller kør kommandoen med TTY, når issue-indholdet skal læses.
- Hvis `gh auth status` melder et ugyldigt token, samtidig med at `gh api` melder en forbindelsesfejl, skal GitHub-forbindelsen testes uden sandboxens netværksbegrænsning, før brugeren bedes logge ind igen. En blokeret API-forbindelse kan ellers fejlagtigt ligne et udløbet token.
- Når du opretter eller opdaterer en PR, behøver du ikke vente på GitHubs CI, medmindre brugeren eksplicit beder om det.
- Når brugeren siger "commit og push", skal agenten efter push vente, til alle
  påkrævede GitHub CI-checks er gennemført og grønne. Fejlende checks skal
  undersøges og rettes; rettelserne skal testes, committes og pushes, og CI skal
  overvåges igen. Opgaven må ikke meldes færdig, mens CI er ventende eller fejler.
- Når brugeren beder dig merge en PR, skal det ske som squash merge.
- Ved `gh pr create`, `gh issue create`, `gh pr comment` og `gh issue comment` skal brødteksten skrives til en midlertidig fil og sendes med `--body-file`. Skriv ikke markdown direkte i shell-argumenter, fordi backticks og anden shell-syntaks kan blive evalueret som kommandoer.
- Avoid commands that dump large amounts of text into context. Use grep -l, head, targeted searches, counts, or write large intermediate output to a temporary file and inspect only relevant portions.
