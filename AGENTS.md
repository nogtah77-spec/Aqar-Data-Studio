# Aqar Data Studio — Agent Instructions

This file is the shared operating contract for every AI agent working in this repository.

## Start here

Before changing anything, read:

1. `AGENTS.md`
2. `docs/PROJECT_MEMORY.md`
3. `replit.md`
4. The relevant files under `docs/` and the relevant artifact package

Treat `docs/PROJECT_MEMORY.md` as the current project handoff. Update it after every important task; remove stale or duplicated information instead of appending a changelog.

## Non-negotiable rules

- Never modify, print, commit, or request Secrets, environment variables, tokens, private keys, or credentials.
- Do not change GitHub, Vercel, Supabase, or Firebase settings, integrations, schemas, or projects without asking the user first and receiving approval.
- Preserve working features and important architectural decisions. Ask before replacing a library, database, auth model, deployment flow, or generated-code workflow.
- Make the smallest focused change that satisfies the request. Avoid unrelated refactors and broad formatting changes.
- Test every fix before committing or pushing.
- Before every commit, run:
  - `pnpm run typecheck`
  - `pnpm build`
  - `git diff --check`
- Do not commit `.env*`, local credentials, generated build output, or unrelated files.
- Do not edit generated API clients directly. Change `lib/api-spec/openapi.yaml` and run the documented codegen command.
- Restart affected workflows after server, package, toolchain, or run-command changes, then inspect logs and the Preview.
- Never push with force unless the user explicitly approves it.

## Repository conventions

- `artifacts/aqar-data-studio/` is the primary React/Vite frontend.
- `artifacts/api-server/` is the Express API.
- `lib/api-spec/openapi.yaml` is the API contract source of truth.
- `lib/api-client-react/` and `lib/api-zod/` are generated; do not hand-edit them.
- Supabase Auth is the auth provider. The service-role key is server-side only.
- Use the existing artifact workflows; do not create duplicate workflows.
- Keep Arabic-first RTL behavior, bilingual labels, accessibility, and responsive layouts intact.

## Completion checklist

Before reporting completion:

1. Re-read the request and verify every explicit requirement.
2. Review the final diff for scope, security, and accidental files.
3. Run the required checks and verify relevant workflows.
4. Update `docs/PROJECT_MEMORY.md` with the new stable state, decision, or remaining follow-up.
5. Report what changed, what was tested, and any blocked external action.