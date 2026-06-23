# paws-prototype

Idle tactical prototype — **NINE LIVES CORP** operational command UI.

## Stack

- `@paws/core` — pure TypeScript simulation (WASM-ready)
- `@paws/ui` — React + Vite + Canvas map

## Dev

```bash
pnpm install
# if pnpm warns about ignored builds: pnpm approve-builds esbuild
pnpm dev
```

Open http://localhost:5173 — KOBRA-1 runs missions automatically.

## Test

```bash
cd packages/core && pnpm exec vitest run
cd packages/ui && pnpm exec vitest run
```

## Docs

- Spec: `docs/superpowers/specs/2026-05-23-minimal-mvp-design.md`
- Plan: `docs/superpowers/plans/2026-05-23-minimal-mvp.md`
