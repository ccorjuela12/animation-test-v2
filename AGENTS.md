# Repository Guidelines

## Project Structure & Module Organization
- `app/`: Next.js App Router entry points (`page.tsx`, `layout.tsx`) and route handlers. Co-locate components per route when practical.
- `public/`: Static assets served from root (e.g., `/next.svg`).
- Config: `next.config.ts`, `tsconfig.json`, `eslint.config.mjs`, `postcss.config.mjs`.
- TypeScript paths: import from root using `@/*` (see `tsconfig.json`).

## Build, Test, and Development Commands
- `npm run dev` — Start the Next.js dev server.
- `npm run build` — Production build.
- `npm run start` — Run the compiled app.
- `npm run lint` — Lint with ESLint (Next + TS rules).
- Optional: `npx tsc --noEmit` — Type-check only.

## Coding Style & Naming Conventions
- Language: TypeScript (`strict: true`). Prefer explicit types at module boundaries.
- Linting: ESLint extends `next/core-web-vitals` and `next/typescript`. Resolve all errors before merging.
- Indentation: 2 spaces; limit line length to readable widths (~100–120).
- Filenames: React components in `PascalCase.tsx`; utilities in `camelCase.ts`; Next routes use framework names (`page.tsx`, `layout.tsx`, `route.ts`). Hooks start with `use*`.
- Styling: Tailwind (via PostCSS). Prefer utility classes over ad‑hoc CSS. Keep global styles in `app/globals.css` minimal.

## Testing Guidelines
- No test runner is configured yet. If adding tests, prefer Vitest/Jest for unit and Playwright for E2E.
- Place tests alongside code as `*.test.ts(x)`.
- Keep tests deterministic and headless by default. Aim for ≥80% coverage on new code.

## Commit & Pull Request Guidelines
- Commits: Follow Conventional Commits (e.g., `feat:`, `fix:`, `docs:`, `refactor:`, `chore:`, `test:`). Keep messages imperative and scoped.
- PRs must include: clear description, rationale, screenshots for UI changes, reproduction/verification steps, and linked issues.
- Pre-merge checklist: `npm run build`, `npm run lint`, and (if added) tests pass.

## Security & Configuration Tips
- Secrets live in `.env.local`; never commit `.env*`. Public values must use `NEXT_PUBLIC_` prefix.
- Avoid embedding secrets or tokens in client components.
- Serve static files from `public/` and reference by `/path`.

## Agent-Specific Instructions
- Keep changes minimal and scoped; do not rename public APIs or routes without necessity.
- Follow this guide, update types/docs with behavior changes, and avoid unrelated refactors in a single PR.

