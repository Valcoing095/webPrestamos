# Skill Registry

**Delegator use only.** Any agent that launches sub-agents reads this registry to resolve compact rules, then injects them directly into sub-agent prompts. Sub-agents do NOT read this registry or individual SKILL.md files.

See `_shared/skill-resolver.md` for the full resolution protocol.

## User Skills

| Trigger | Skill | Path |
|---------|-------|------|
| creating a pull request, opening a PR, preparing changes for review | branch-pr | ~/.config/opencode/skills/branch-pr/SKILL.md |
| writing Go tests, using teatest, adding test coverage | go-testing | ~/.config/opencode/skills/go-testing/SKILL.md |
| creating GitHub issue, reporting a bug, requesting a feature | issue-creation | ~/.config/opencode/skills/issue-creation/SKILL.md |
| "judgment day", "judgment-day", "review adversarial", "dual review", "doble review" | judgment-day | ~/.config/opencode/skills/judgment-day/SKILL.md |
| create a new skill, add agent instructions, document patterns for AI | skill-creator | ~/.config/opencode/skills/skill-creator/SKILL.md |

## Compact Rules

Pre-digested rules per skill. Delegators copy matching blocks into sub-agent prompts as `## Project Standards (auto-resolved)`.

### branch-pr
- Every PR MUST link an approved issue (status:approved label)
- Every PR MUST have exactly one `type:*` label
- Branch naming: `^(feat|fix|chore|docs|style|refactor|perf|test|build|ci|revert)\/[a-z0-9._-]+$`
- Run shellcheck on modified scripts before opening PR
- Automated checks must pass before merge

### go-testing
- Use table-driven tests for multiple test cases
- Bubbletea TUI: use teatest for component testing
- Golden file testing for complex outputs
- Integration tests require httptest ortestcontainers
- Avoid mocks when real dependencies are feasible

### issue-creation
- Blank issues disabled — MUST use bug_report.yml or feature_request.yml template
- Every issue gets `status:needs-review` automatically
- A maintainer MUST add `status:approved` before any PR can be opened
- Questions go to Discussions, not issues

### judgment-day
- Launch TWO independent blind sub-agents via `delegate` (parallel, never sequential)
- Neither agent knows about the other — no cross-contamination
- Resolve skills from registry BEFORE launching judges (inject compact rules)
- Max 2 iterations: synthesize findings → fix → re-judge
- If both judges pass OR 2 iterations reached → stop and report

### skill-creator
- Create skill when patterns repeat, conventions differ from generic, or workflows need steps
- Don't create for one-off tasks or trivial patterns
- Structure: `skills/{name}/SKILL.md`, optional `assets/`, `references/`
- Frontmatter: name, description (with Trigger:), license, metadata (author, version)
- Keep SKILL.md concise with Critical Rules/Patterns sections

## Project Conventions

| File | Path | Notes |
|------|------|-------|
| No project conventions file found | — | No AGENTS.md, CL AUDE.md, .cursorrules, GEMINI.md, or copilot-instructions.md in project root |

Read the convention files listed above for project-specific patterns and rules. All referenced paths have been extracted — no need to read index files to discover more.
