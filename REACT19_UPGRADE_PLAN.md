# React 19 Upgrade Plan

**Created:** 2026-08-13
**Target branch:** `upgrade/react-19` (branched from current `main` — the older `origin/react19_upgrade` branch was reviewed and intentionally set aside: it's 219 commits behind `main` and never actually bumped React past 18.3.1, so it isn't a useful base).
**Do not execute until ready — restore this plan in a future session.**

---

## Context Summary

- **Current:** React 18.3.1. All components are already function components except `ErrorBoundary.js` (permanent — no hooks equivalent for error boundaries), per the completed [REACT_UPGRADE_PLAN.md](REACT_UPGRADE_PLAN.md) (React 16→18).
- **Target:** React 19.x
- **Build:** Create React App + Craco 7, react-scripts 5.0.1 (unchanged)
- **Source tree:** `ui/src/src/`

**Starting-point audit (run 2026-08-13, app code only):** zero string refs, zero legacy context API (`contextTypes`/`childContextTypes`/`getChildContext`), zero `findDOMNode`, zero `defaultProps`, zero `propTypes`, zero `React.createFactory`, `StrictMode` already off (documented decision). This is about as clean a starting point as a React major upgrade gets — the app-code hard part already happened during the React 18 migration. **This plan is almost entirely a dependency exercise, not a code-rewrite exercise.**

---

## Phase 1 — Dependency Compatibility Audit ✅ COMPLETED 2026-08-13

Checked every React-facing dependency's *actual published* peer-dependency range against the npm registry (not just installed version).

### Already declare React 19 support — no action beyond the react/react-dom bump itself

| Package | Installed | Declared peer range |
|---|---|---|
| `@mui/material` | 5.18.0 | `^17 \|\| ^18 \|\| ^19` |
| `react-select` | 5.10.2 | `^16.8 \|\| ^17 \|\| ^18 \|\| ^19` |
| `react-textarea-autosize` | 8.5.9 | `^16.8 \|\| ^17 \|\| ^18 \|\| ^19` |
| `re-resizable` | 6.11.2 | `^16.13.1 \|\| ^17 \|\| ^18 \|\| ^19` |
| `@fortawesome/react-fontawesome` | 0.2.6 | `^16.3 \|\| ^17 \|\| ^18 \|\| ^19` |
| `react-router-dom` | 6.30.4 | `>=16.8` (unbounded) |
| `highcharts-react-official` | 3.2.3 | `>=16.8.0` (unbounded) |
| `reactjs-popup` | 2.0.6 | `>=16` (unbounded) |
| `react-scripts` | 5.0.1 | `>=16` (unbounded) |

### Needs a version bump — newer major already published, declares React 19

| Package | Installed | → Target | Used in |
|---|---|---|---|
| `@tinymce/tinymce-react` | 4.3.2 | **6.3.0** | `index.js`, `testcases/TestCase.js` (**6 editor instances** — highest-risk integration point) |
| `react-date-picker` | 10.6.0 | **12.1.0** | `audit/Events.js` (+ CSS import in `index.js`) |
| `react-helmet-async` | 2.0.5 | **3.0.0** | `common/Header.js` |
| `react-spinners` | 0.13.8 | **0.17.0** | ~21 `FadeLoader` usages |

Vendored (not npm) — **no action needed**: TinyMCE core is self-hosted under `ui/src/public/tinymce` at v6.8.6. `@tinymce/tinymce-react` 6.x's peer range includes `tinymce ^6.0.0`, so the vendored core doesn't need to change.

### No React 19 release exists — remove, don't wait on it

| Package | Installed | Used for | Action |
|---|---|---|---|
| `semantic-ui-react` | 2.1.5 (**latest published version on npm** — declares only up to `^18`, no newer release exists at all) | Only the `Checkbox` component, in exactly 2 files (`launches/LaunchTestcasesHeatmap.js`, `testcases/TestCase.js`) | Replace both with `@mui/material`'s `Checkbox` (already a dependency, already React-19-ready). Small, contained change — **not** a systemic rewrite. Then drop `semantic-ui-react` + `semantic-ui-css` entirely. |

### Dead weight surfaced by this audit — unrelated to React 19, but worth dropping in the same pass

| Package | Why |
|---|---|
| `@storybook/*` (6 packages) + `storybook` devDependency | **Zero** `*.stories.*` files exist anywhere in `src`. Confirmed via `npm ls react`: its own transitive deps (`react-inspector`, `react-element-to-jsx-string`) are *already* peer-dep-invalid under the **current** React 18 — nobody noticed because nothing uses it. Upgrading Storybook 6→10 (4 majors) to silence warnings for an unused tool isn't worth it; remove it. |
| ~~`typescript` (`^4.3.3`, devDependency)~~ | ~~No `.ts`/`.tsx` files exist in `src` — vestigial.~~ **AUDIT WAS WRONG — do not remove.** Tried 2026-08-13 and reverted: `eslint-config-react-app` registers an `@typescript-eslint/parser` override unconditionally, and that parser `require()`s the `typescript` module at load time regardless of whether any `.ts` files exist. Removing it makes `yarn lint` fail outright with `Cannot find module 'typescript'`. "No `.ts` files in `src`" was the wrong test — the dependency belongs to eslint, not to the source tree. (Webpack is unaffected: its TS checker no-ops when no TS files are present, so `yarn build` still succeeded without it.) |

---

## Phase 2 — Remove dead weight first (before touching React at all) ✅ COMPLETED 2026-08-13

Doing this first isolates "stuff we removed" build breakage from "React 19" build breakage.

1. ✅ Replace `import { Checkbox } from "semantic-ui-react"` with `import Checkbox from "@mui/material/Checkbox"` in both files. Watch the onChange contract — semantic-ui-react's `Checkbox` calls `onChange(e, data)` with `data.checked`; MUI's calls `onChange(e)` with `e.target.checked`. This is the one real code change in the whole plan.
   - Used `@mui/material`'s **`Switch`** rather than `Checkbox` — the originals passed `toggle`, so `Switch` is the faithful equivalent.
   - The onChange contract risk turned out to be a **non-issue**: `onBrokenToggle()` in `TestCase.js` takes no arguments and derives the new value from current state, so nothing depended on the old `(e, data)` signature.
   - **Follow-up fix:** the first pass wrapped only `TestCase.js` in `FormControlLabel` and dropped the `label` on `LaunchTestcasesHeatmap.js` entirely, so the heatmap toggle silently lost its On/Off text. Restored — both call sites now use `FormControlLabel` and render consistently.
2. ✅ Remove `semantic-ui-react`, `semantic-ui-css` from `dependencies`; drop the CSS import for `semantic-ui-css` if present in `index.js`.
3. ✅ Remove `@storybook/*` (6 packages) + `storybook` from `devDependencies`; delete the `storybook` / `build-storybook` scripts. Also removed two things the audit missed: the now-dead `**/*.stories.*` override in `eslintConfig`, and the `.storybook/` config directory (`main.js` + `preview.js`, both pointing only at story globs that match nothing).
4. ❌ ~~Remove `typescript` from `devDependencies`~~ — **attempted and reverted.** Breaks `yarn lint`; see the corrected Phase 1 dead-weight table above. `typescript: ^4.3.3` stays.
5. ⚠️ `yarn install` clean. **`yarn build` not yet run** — blocked on a pre-existing permissions issue, see Open Blockers below.

---

## Phase 3 — Bump the four libraries with newer React-19-declaring majors

One at a time, `yarn build` after each — a failure then points at exactly one cause.

1. ✅ **Bumped 2026-08-13** — `@tinymce/tinymce-react` 4.3.2 → 6.3.0, installed and resolved; `eslint src` clean. Confirmed against the registry: 6.3.0 declares `react: ^19 || ^18 || ^17 || ^16.7` and `tinymce: ^8 || ^7 || ^6 || ^5.5.1`, so the vendored core at 6.8.6 satisfies it and **does not need to change**. All 6 call sites already use the modern prop API (`tinymceScriptSrc` / `initialValue` / `onInit` / `init={{…}}` / `onEditorChange`), with `plugins` and `toolbar` nested inside `init` rather than as top-level shorthand props — which is where most 4→6 breakage lands, so the exposure here is smaller than the 2-major jump suggests.
   - ⚠️ **Still needs a build + manual smoke test of all 6 editor instances** in `TestCase.js` (description, preconditions, and the per-step sub-editors) before moving to 3.2. Not yet done — see Open Blockers.
2. `react-date-picker` 10.6.0 → 12.1.0. Check v11/v12 changelogs (locale handling and `calendarIcon`/`clearIcon` prop shapes commonly change between majors). Smoke-test `Events.js`'s date filter.
3. `react-helmet-async` 2.0.5 → 3.0.0. Low risk — usage in `Header.js` is minimal per the React 18 plan's notes.
4. `react-spinners` 0.13.8 → 0.17.0. Check for further prop removals beyond the `sizeUnit` removal already handled in the React 18 upgrade; spot-check a few of the ~21 `FadeLoader` call sites.

---

## Phase 4 — Upgrade React itself

1. `react` 18.3.1 → 19.x, `react-dom` 18.3.1 → 19.x — bump together; React 19 refuses to run against a mismatched `react-dom`.
2. Re-run the Phase 1 grep audit (string refs, legacy context, `findDOMNode`, `defaultProps`, `createFactory`) — already clean, but re-check in case any Phase 3 bump reintroduced a pattern.
3. Confirm `src/index.js` still only uses `createRoot` (already true since the React 18 upgrade) and that no `ReactDOM.render` call exists anywhere (Phase 1 audit found none).
4. `yarn build`.

---

## Phase 5 — React 19 opportunities (optional — not required for the upgrade to land)

Nothing here is a blocker; this codebase is already hooks-only and already on `createRoot`. Only pursue if there's a specific reason to invest beyond "reach React 19":
- Ref cleanup functions in place of ref callbacks that manually return `undefined`.
- `useActionState`/form Actions — not applicable; nothing here uses `<form action={fn}>`, and adopting it would be a separate, larger refactor, not part of this upgrade.

---

## Open Blockers & Findings (added 2026-08-13)

Discovered while executing Phases 2–3.1. None are caused by the React 19 work; all three predate it.

### 1. `yarn build` fails with EACCES — blocks the per-bump build gate

`ui/src/build/images/` is owned by `root` (from a root-run build/deploy on 2026-08-12), so `yarn build` under an ordinary uid dies on `EACCES: permission denied, unlink '.../build/images/1px.png'`. `build/` is gitignored generated output, so the fix is just `sudo rm -rf ui/src/build`. Until then the "build after every single bump" discipline in Phase 3 can't run, and bumps 3.2–3.4 should **not** be stacked on top of an unbuilt 3.1 — the whole point of one-at-a-time is losing that isolation.

### 2. `yarn.lock` is not tracked in git — real hazard for a dependency-driven upgrade

Deleted in commit `66473c9f` ("replace google recaptcha with cloudflare turnstile") and never restored; it is not in `.gitignore`, just untracked. Every `yarn install` therefore re-resolves all `^` ranges freely, so a dev machine and the deploy target can silently land on different versions of the very packages this plan bumps — which also means a green Selenium run proves less than it appears to. **The lockfile should be committed as part of this branch** so the React 19 dependency set is actually pinned and reproducible.

### 3. `yarn lint` as configured is impractical

The script is `eslint .`, which walks the entire 681MB `node_modules` (the `ignorePatterns` entry doesn't stop directory traversal). A cold run was killed at 2h34m of CPU time. It only ever appeared to work because `.eslintcache` masked it — and `postinstall: yarn clean` deletes that cache on every install, so any run right after an install pays full cost. Scope the script to `src` (`eslint src`) to make Phase 6.1 usable; `yarn eslint src` completes in ~3s.

---

## Phase 6 — Validation

1. `yarn lint` — should still be 0 errors/0 warnings (final state of the React 18 plan); flag anything new introduced by the dependency bumps.
   - **Correction:** the real baseline is 0 errors / **1** warning — a pre-existing `prettier/prettier` "Delete `··`" at `launches/Launch.js:140`, introduced by commit `b000f06a` ("Phase 4 working"), unrelated to any upgrade work. Treat 0 errors / 1 warning as the clean baseline, or clear it with `yarn lint:fix`.
   - See Open Blockers #3 — run it as `yarn eslint src`, not `yarn lint`, until the script is rescoped.
2. Manual smoke test each module, with extra attention to: the 6 TinyMCE editor instances, the date picker, the 2 replaced checkboxes, and the spinners.
3. Run the Dokimion_Tests Selenium suite (TC1–TC22) against the built React 19 app. This is the same finish line the React 18 plan never crossed (its "Remaining to finalize" section still reads "Get the Selenium suite green" as of last update) — worth clearing both upgrades' validation in the same pass rather than twice. Note: the suite has an unrelated, currently-open flakiness issue (intermittent 429s from a load-balancer rate limit tripped by TinyMCE's per-plugin asset bursts on the testcase page) — don't let that get misattributed to this upgrade if it resurfaces mid-testing.
4. Merge `upgrade/react-19` → `main`.

---

## Risk Mitigation Summary

| Risk | Mitigation |
|---|---|
| `@tinymce/tinymce-react` 4→6 (2 majors, 6 editor instances) | Highest-usage integration point; dedicated smoke-test pass before moving on (Phase 3.1) |
| `semantic-ui-react` has no React 19 path, and never will (no newer release exists) | Usage was only `Checkbox` in 2 files — replace rather than wait on/fork the library |
| `react-scripts` 5 / CRA is unmaintained upstream | No upper `react` bound, has built fine across majors historically; not a blocker here, but flag as a standing risk for whatever comes after React 19 |
| Storybook already broken under React 18, invisible because unused | Remove rather than fix — confirmed 0 real usage |
| Bundling all dependency bumps together obscures which one broke the build | Bump one at a time (Phase 3), build after each |
