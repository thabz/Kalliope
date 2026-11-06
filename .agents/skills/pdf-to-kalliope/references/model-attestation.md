# Modeloplysninger ved korrekturattestation

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
- Hvis reviewerens sessions-id mangler, kan Codex' lokale `state_*.sqlite`
  hjælpe med at finde loggen. Åbn databasen read-only og undersøg først
  skemaet. I tabellen `threads` kan `source` identificere underagenten via
  `subagent.thread_spawn.agent_path` og `parent_thread_id`; `id` og
  `rollout_path` peger på dens session. Kontrollér derefter de relevante
  `turn_context`-poster i selve loggen.
- Hold modelnavn og reasoning-niveau adskilt: fx `gpt-6.1-sol` og `high`.
  XML-attestens `model` indeholder modelnavnet efter `docs/xml-work-format.md`;
  reasoning-niveau og grundlaget for identifikationen kan dokumenteres i
  reviewrapporten. Brug tidspunktet for den attesterede slutkontrol, ikke
  filens ændringstid, som attesttidspunkt.
  Afslutningen kan dokumenteres med tidsstemplet på en `event_msg` med
  `payload.type == "task_complete"`; kontrollér, at afslutningsrapporten
  faktisk vedrører den færdige korrektur eller genkontrol.
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
