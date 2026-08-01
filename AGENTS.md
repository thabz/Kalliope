# Agent Instructions

Disse regler gælder for AI-agenter og automatiserede assistenter, der arbejder i dette repository.

## Dokumentation

- Læs `docs/style-guide.md` før alle ændringer i repositoryet og før oprettelse
  eller opdatering af issues og PRs.
- Læs derefter den specialdokumentation, som stilguiden henviser til for det
  relevante område.
- Ved oprettelse af et nyt digt skal tekst-id'et bestå af forfatter-id, dags dato
  i formen `YYYYMMDD` og et tocifret løbenummer, fx `merrill2026080101`.

## Git og GitHub

- Når en PR skal lukke et GitHub issue automatisk, skal PR-beskrivelsen bruge GitHubs engelske closing keyword, fx `Fixes #123`. Skriv ikke `Lukker #123`, fordi GitHub ikke auto-lukker issues på dansk.
- Branch-navne må ikke indeholde `/` eller have et teknisk prefix. Brug et kort,
  beskrivende navn som `robert-burns-ikon`.
- Commit, push eller amend aldrig kodeændringer, før brugeren eksplicit har læst ændringen og bedt om commit/push. Det gælder også opdateringer til eksisterende PR-branches.
- Ved `gh issue view ... --comments` kan GitHub CLI i non-TTY give tomt tekstoutput for issues uden kommentarer. Brug enten `--json number,title,state,body,comments` eller kør kommandoen med TTY, når issue-indholdet skal læses.
- Hvis `gh auth status` melder et ugyldigt token, samtidig med at `gh api` melder en forbindelsesfejl, skal GitHub-forbindelsen testes uden sandboxens netværksbegrænsning, før brugeren bedes logge ind igen. En blokeret API-forbindelse kan ellers fejlagtigt ligne et udløbet token.
- Når du opretter eller opdaterer en PR, behøver du ikke vente på GitHubs CI, medmindre brugeren eksplicit beder om det.
- Når brugeren beder dig merge en PR, skal det ske som squash merge.
- Ved `gh pr create`, `gh issue create`, `gh pr comment` og `gh issue comment` skal brødteksten skrives til en midlertidig fil og sendes med `--body-file`. Skriv ikke markdown direkte i shell-argumenter, fordi backticks og anden shell-syntaks kan blive evalueret som kommandoer.
