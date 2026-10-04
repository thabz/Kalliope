---
name: kalliope-mellemleder
description: Koordiner en Kalliope-opgave mellem fire synlige Codex-sessioner i et 2x2-grid i det aktuelle CMUX-workspace. Brug når brugeren beder om flere agenter, arbejdsfordeling, en mellemleder, synligt parallelt arbejde eller uafhængig kontrol. Brug CMUX-terminaler, aldrig skjulte interne subagenter.
---

# Kalliope-mellemleder

Led opgaven fra caller-surface og brug tre andre synlige Codex-terminaler som arbejdere. Udfør ikke arbejdernes faglige opgave selv, medmindre en arbejder bliver blokeret.

## 1. Indlæs regler

1. Læs repositoryets `AGENTS.md` og `docs/style-guide.md` før koordinering.
2. Identificer specialdokumentationen og relevante repository-skills for opgaven.
3. Send de samme krav videre til alle arbejdere. En rolleprompt tilsidesætter aldrig `AGENTS.md`.

## 2. Find eller opret et synligt 2x2-grid

1. Brug `CMUX_WORKSPACE_ID` og `CMUX_SURFACE_ID` som ankre. Fald tilbage til `cmux identify --json`.
2. Inspicer kun caller-workspace med `cmux list-panes` og `cmux list-pane-surfaces`.
3. Genbrug tre eksisterende, ledige Codex-terminaler, når workspace allerede har fire egnede panes.
4. Opret kun manglende panes. Byg fra caller-surface: split højre; split caller ned; split den nye højre surface ned. Brug eksplicitte surface-referencer og `--focus false`.
5. Start `codex` i nye terminaler, og vent til inputfeltet er klar. Send aldrig en arbejdsordre til en shell-prompt.
6. Flyt, luk eller fokuser ikke brugerens eksisterende surfaces. Opret et nyt workspace i stedet, hvis den eksisterende topologi ikke sikkert kan genbruges.
7. Bekræft med `cmux read-screen`, at alle tre arbejdere har modtaget opgaven og viser aktivitet.

Brug CMUX CLI direkte. Brug aldrig interne subagenter som erstatning for de synlige sessioner.

## 3. Isoler arbejdet

1. Kontroller arbejdstræets tilstand uden at ændre brugerens filer.
2. Følg Kalliopes worktree-regler. Ved issue-fixes: opret altid et nyt worktree fra `origin/master`.
3. Brug korte branch-navne uden `/` eller teknisk prefix.
4. Lad alle fire sessioner arbejde mod samme aftalte worktree, men giv kun én agent skriveret i rollefordelingen.
5. Bevar scratch-data uden for Git-scope og undgå at blande uvedkommende ændringer ind.

## 4. Fordel roller

Læs [references/role-prompts.md](references/role-prompts.md), og tilpas prompterne til opgaven.

- `caller`: mellemleder; koordinerer, samler findings og kommunikerer med brugeren.
- `worker 1`: primær udfører og eneste filejer.
- `worker 2`: uafhængig kilde-, indholds- og korrekturauditor; redigerer intet.
- `worker 3`: uafhængig struktur-, diff- og valideringsreviewer; redigerer intet.

Ved en opgave, der naturligt kræver andre fagroller, må auditorernes specialer ændres, men behold én filejer og mindst én uafhængig slutreviewer.

Send prompts med `cmux send --surface ...`, indsend dem med `cmux send-key --surface ... enter`, og målret altid en eksplicit surface. Kræv korte, løbende statusopdateringer, så arbejdet er synligt.

## 5. Koordiner findings

1. Lad auditorerne undersøge uafhængigt af filejeren.
2. Aflæs status og svar med `cmux read-screen --surface ... --scrollback --lines ...` uden at ændre fokus.
3. Send konkrete findings til filejeren med kilde, fil og lokation.
4. Lad filejeren rette alle bekræftede findings og markere `READY_FOR_REVIEW`.
5. Hvis agenter er uenige, afgør mellemlederen konflikten ud fra repositoryregler og primærkilder; skjul aldrig tvivl.

## 6. Kræv uafhængig slutkontrol

Efter `READY_FOR_REVIEW` skal mindst én agent, som ikke lavede ændringerne:

1. læse den faktiske slutdiff;
2. kontrollere ændringerne mod relevante primærkilder;
3. korrekturlæse brugerrettet tekst og data;
4. køre relevante målrettede kontroller og den fulde testpakke, når repositoryreglerne kræver det;
5. kontrollere Git-scope og fravær af scratch-filer;
6. svare `APPROVED` eller levere konkrete findings.

Ved findings går arbejdet tilbage til filejeren og derefter gennem en ny uafhængig reviewrunde. Erklær aldrig opgaven færdig uden en eksplicit `APPROVED` på den seneste diff.

## 7. GitHub-checkpoint

1. Følg `AGENTS.md` for commit, push, PR og CI.
2. Commit eller push aldrig, før den krævede brugeraccept foreligger.
3. Skriv PR-titel og -beskrivelse på dansk, konkret om observationer, ændringer og validering.
4. Brug en midlertidig body-fil ved `gh pr create`, kommentarer og issue-oprettelse.
5. Vent kun på CI, når brugeren eller repositoryreglerne kræver det.

## 8. Aflever

Oplys kort:

- hvilken surface der havde hver rolle;
- hvilke kilder og filer der blev kontrolleret;
- hvilke tests og kontroller der bestod;
- hvem der udførte den uafhængige slutkontrol;
- eventuelle uløste spørgsmål;
- om ændringerne kun ligger lokalt eller er publiceret i en PR.

