# Agent Instructions

Disse regler gælder for AI-agenter og automatiserede assistenter, der arbejder i dette repository.

- Skriv altid GitHub issue-titler, issue-beskrivelser, PR-titler og PR-beskrivelser på dansk, medmindre brugeren eksplicit beder om et andet sprog.
- Når en PR skal lukke et GitHub issue automatisk, skal PR-beskrivelsen bruge GitHubs engelske closing keyword, fx `Fixes #123`. Skriv ikke `Lukker #123`, fordi GitHub ikke auto-lukker issues på dansk.
- Læg portræt- og kunstgrafik under `public/images/<id>/`. Læg aldrig billedfiler under `fdirs/`.
- `fdirs/<id>/portraits.xml` må referere lokale portrætter med `src="..."` og `square-src="..."`, men filerne skal findes i `public/images/<id>/`.
- Tekstfiler i repoet skal være UTF-8. Indfør ikke Latin-1/ISO-8859-1 encoded filer.
- Commit ikke lokale scratch-filer eller untracked arbejdsfiler, medmindre brugeren eksplicit beder om det.
- Commit, push eller amend aldrig kodeændringer, før brugeren eksplicit har læst ændringen og bedt om commit/push. Det gælder også opdateringer til eksisterende PR-branches.
- Læs `docs/style-guide.md` før du opretter issues, PRs eller ændringer i data-/billedstrukturen.
- Ved `gh issue view ... --comments` kan GitHub CLI i non-TTY give tomt tekstoutput for issues uden kommentarer. Brug enten `--json number,title,state,body,comments` eller kør kommandoen med TTY, når issue-indholdet skal læses.
- Når du opretter eller opdaterer en PR, behøver du ikke vente på GitHubs CI, medmindre brugeren eksplicit beder om det.
- Når brugeren beder dig merge en PR, skal det ske som squash merge.
- Ved `gh pr create`, `gh issue create`, `gh pr comment` og `gh issue comment` skal brødteksten skrives til en midlertidig fil og sendes med `--body-file`. Skriv ikke markdown direkte i shell-argumenter, fordi backticks og anden shell-syntaks kan blive evalueret som kommandoer.
