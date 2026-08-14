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
2. ✅ **Bumped 2026-08-14** — `react-date-picker` 10.6.0 → 12.1.0, installed and resolved (pulls `react-calendar` 6.0.1); `yarn eslint src` clean at the documented baseline (0 errors / 1 pre-existing `Launch.js:140` warning). Registry-checked: 12.1.0 declares `react: ^16.8 || ^17 || ^18 || ^19`.
   - The `calendarIcon`/`clearIcon`/locale prop churn between v11 and v12 **does not apply here** — the 2 call sites in `audit/Events.js` pass only `id`, `value`, and `onChange`. No code change was needed.
   - Real risk was the CSS imports, not the props: v12 and react-calendar 6 are both ESM-only (`"type": "module"`) with an `exports` map. Both keep a `"./*": "./*"` catch-all, so the deep imports at `index.js:11-12` (`react-date-picker/dist/DatePicker.css`, `react-calendar/dist/Calendar.css`) still resolve — verified against the published tarballs, and both files confirmed present in `node_modules` after install.
   - ✅ **Fixed 2026-08-14 — phantom `react-calendar` dependency.** `index.js` imported `react-calendar/dist/Calendar.css` while `react-calendar` was **not** a direct dependency; it only resolved via hoisting of `react-date-picker`'s transitive dep, and survived the 10→12 jump by luck (the CSS path happened not to move). Added `"react-calendar": "^6.0.0"` to `dependencies` — the range deliberately matches `react-date-picker` 12.1.0's own declared range, so yarn dedupes to a **single** hoisted copy (verified: one `node_modules/react-calendar` at 6.0.1, one `react-calendar@^6.0.0` lockfile entry). No second copy in the tree, no bundle-size cost, and the CSS import no longer depends on another package's transitive tree.
   - ⚠️ **Still needs a build + smoke test of the `Events.js` date filter** before moving to 3.3 — blocked, see Open Blockers #1.
3. ✅ **Bumped 2026-08-14** — `react-helmet-async` 2.0.5 → 3.0.0, installed and resolved; `yarn eslint src` clean at baseline (0 errors / 1 pre-existing `Launch.js:140` warning). Registry-checked: 3.0.0 declares `react: ^16.6 || ^17 || ^18 || ^19`. No code change needed.
   - Usage is slightly wider than "minimal in `Header.js`" — it spans **two different APIs**: `HelmetProvider` wrapping the tree in `index.js:31`, a children-style `<Helmet><script/></Helmet>` at `Header.js:170`, **and** the legacy array-prop form `<Helmet script={[{type, innerHTML}]}/>` at `Header.js:175` (the gtag/analytics inline script). The array-prop form is the older react-helmet-style API and was the thing worth checking.
   - Verified against the published tarballs rather than assumed: v3's built `lib/index.js` still handles `SCRIPT`/`innerHTML`/`cssText`/`defer`/`prioritizeSeoTags` and still exports `HelmetProvider`, so both call styles survive.
   - v3 adds an `exports` map (v2 had none), but it covers only the root entry — the app imports only the root, so no deep-import breakage.
   - ⚠️ **Still needs a build + smoke test** — confirm both analytics `<script>` tags actually land in `<head>` when `session.metainfo.analyticsEnabled` is true; a silently-dropped inline script would not fail the build or the Selenium suite.
4. ✅ **Bumped 2026-08-14** — `react-spinners` 0.13.8 → 0.17.0, installed and resolved; `yarn eslint src` clean at baseline (0 errors / 1 pre-existing `Launch.js:140` warning). Registry-checked: 0.17.0 declares `react: ^16 || ^17 || ^18 || ^19`. No code change needed.
   - Usage is perfectly uniform: 21 files, all `import { FadeLoader } from "react-spinners"`, all passing exactly `size` + `color` + `loading` (+ `className` on the wrapper). One prop set to reason about, not 21.
   - **No prop removals between 0.13.8 and 0.17.0.** Diffed the published `helpers/props.d.ts` from both tarballs: `CommonProps` (`color`/`loading`/`cssOverride`/`speedMultiplier`) and `LoaderHeightWidthRadiusProps` (`height`/`width`/`radius`/`margin`) are **byte-identical** across the two versions, and `FadeLoader`'s destructured signature is unchanged.
   - The dropped `cjs/` and `umd/` build dirs in 0.17.0 are a non-issue: `main` (`index.js`) and `module` (`esm/index.js`) still point at files that ship, there's no `exports` map and no `"type": "module"`, so resolution is identical to 0.13.8.
   - ⚠️ **Pre-existing latent bug surfaced by this audit — NOT caused by the bump, and not fixed here.** All 21 call sites pass `size={100}` (e.g. `launches/Launches.js:171`), but **`FadeLoader` has never accepted a `size` prop** — in *both* 0.13.8 and 0.17.0 it takes `height`/`width`/`radius`/`margin`, and `size` belongs to the unrelated `LoaderSizeProps`/`LoaderSizeMarginProps` interfaces used by other loaders. `size` therefore falls into `...additionalprops` and is spread onto the DOM element, where it does nothing to the spinner's dimensions. The spinners have been rendering at default size all along. Behaviour is **unchanged** by this bump (equally inert before and after), which is why it's out of scope here — but if the spinners are meant to be sized, the fix is `height`/`width`/`radius`, and it should be its own change with its own visual check.

---

## Phase 4 — Upgrade React itself

1. ✅ **Bumped 2026-08-14** — `react` + `react-dom` 18.3.1 → **19.2.8** together. `yarn install` clean; `yarn eslint src` at baseline (0 errors / 1 pre-existing `Launch.js:140` warning).
   - The post-install peer-warning list is **byte-identical to the pre-bump one** — not one new React-related warning — and `npm ls react --all` reports **zero** `invalid`/`UNMET` entries anywhere in the tree. The Phase 1 dependency audit held up exactly as predicted.
2. ✅ **Audit re-run 2026-08-14** — string refs, legacy context, `findDOMNode`, `defaultProps`, `propTypes`, `createFactory` all still zero in app code. No Phase 3 bump reintroduced a removed pattern.
3. ⚠️ **Audit correction — the Phase 1 claim "no `ReactDOM.render` call exists anywhere" was WRONG.** It scanned app code and missed `src/App.test.js`, the vestigial CRA default smoke test, which used **both** `ReactDOM.render` and `ReactDOM.unmountComponentAtNode` — both **removed** in React 19. `src/index.js` itself was fine (`createRoot` only, confirmed).
   - That file turned out to be broken on **three** independent axes, and had been dead weight for a long time: (a) removed React 19 APIs; (b) it rendered a bare `<App />`, which cannot work because `Header`/`Main`/`Footer` consume router and Helmet context that only `index.js` provides; (c) jest could no longer even parse its import graph — see below.
   - Rewritten against `createRoot` + `act`, wrapped in the same `HelmetProvider` + `BrowserRouter` providers `index.js` uses. **Now genuinely passes under React 19** — a small but real smoke signal that the whole component tree mounts and unmounts cleanly on 19.
4. ✅ **Regression fixed — `yarn test` was broken by the Phase 3.2 bump (found here, caused earlier).** `react-date-picker` 10.6.0 shipped a CJS entry (`main: ./dist/cjs/index.js`); 12.1.0 ships **no CJS build at all** (`main: ./dist/index.js`, `"type": "module"`). Jest resolves `main` and does not transform `node_modules` by default, so every test died on `SyntaxError: Cannot use import statement outside a module`. Webpack and the Selenium suite handle ESM fine, which is exactly why this slipped through Phases 3.2–3.4 unnoticed — **the build passing is not evidence the test suite does.**
   - Fixed with a `jest.transformIgnorePatterns` override in `package.json`. An allowlist of ESM package names was tried first and rejected: the ESM chain runs deeper than it looks (`react-date-picker` → `react-calendar` → `get-user-locale` → `memoize` → `mimic-function`, plus `react-fit` → `detect-element-overflow`, and `stylis` under MUI — 56 `"type": "module"` packages are in the tree), so any hand-maintained list would silently rot on the next dependency bump. The override now transforms all imported `node_modules` JS, keeping only the CSS-modules pattern ignored. Suite runs in ~11s.
   - Note `react-calendar` is ESM-only too, so this fix also depends on the Phase 3.2 phantom-dependency fix above.
5. `yarn build` — **user-run.**

---

## Phase 5 — React 19 opportunities (optional — not required for the upgrade to land)

Nothing here is a blocker; this codebase is already hooks-only and already on `createRoot`. Only pursue if there's a specific reason to invest beyond "reach React 19":
- Ref cleanup functions in place of ref callbacks that manually return `undefined`.
- `useActionState`/form Actions — not applicable; nothing here uses `<form action={fn}>`, and adopting it would be a separate, larger refactor, not part of this upgrade.

---

## Open Blockers & Findings (added 2026-08-13)

Discovered while executing Phases 2–3.1. None are caused by the React 19 work; all three predate it.

**Status as of 2026-08-14: #1 and #2 are RESOLVED. #3 is still open. Two new findings (#4, #5) added below.**

### 1. ✅ RESOLVED — `yarn build` fails with EACCES — blocks the per-bump build gate

`ui/src/build/images/` is owned by `root` (from a root-run build/deploy on 2026-08-12), so `yarn build` under an ordinary uid dies on `EACCES: permission denied, unlink '.../build/images/1px.png'`. `build/` is gitignored generated output, so the fix is just `sudo rm -rf ui/src/build`. Until then the "build after every single bump" discipline in Phase 3 can't run, and bumps 3.2–3.4 should **not** be stacked on top of an unbuilt 3.1 — the whole point of one-at-a-time is losing that isolation.

**Scope correction (2026-08-14): it is wider than `ui/src/build`.** All 15 Maven `*/target` dirs are root-owned from the same 2026-08-12 root build (1746 root-owned files repo-wide), so the project build script `config/common/mvn_build.sh` fails immediately at `maven-clean-plugin` on the first module (`beans`), never reaching `ui`. Full fix:

```
sudo rm -rf ~/dokimion/*/target ~/dokimion/ui/src/build
```

This must be run by a user who can authenticate to `sudo` — it cannot be done from a non-interactive session.

**Cleared 2026-08-14** by the repo owner; builds and deploys have run normally since, and Phases 3.2–3.4 were each build-verified and Selenium-verified before the next bump, restoring the one-at-a-time isolation discipline.

### 2. ✅ RESOLVED — `yarn.lock` is not tracked in git

Deleted in commit `66473c9f` ("replace google recaptcha with cloudflare turnstile") and never restored; it was not in `.gitignore`, just untracked. Every `yarn install` therefore re-resolved all `^` ranges freely, so a dev machine and the deploy target could silently land on different versions of the very packages this plan bumps — which also meant a green Selenium run proved less than it appeared to.

**Fixed:** the lockfile was restored and committed in `80a859ed`, and every subsequent bump (3.2, 3.3, 3.4, Phase 4) has updated it in the same commit. The React 19 dependency set is now genuinely pinned and reproducible.

### 3. ⚠️ STILL OPEN — `yarn lint` as configured is impractical

The script is `eslint .`, which walks the entire 681MB `node_modules` (the `ignorePatterns` entry doesn't stop directory traversal). A cold run was killed at 2h34m of CPU time. It only ever appeared to work because `.eslintcache` masked it — and `postinstall: yarn clean` deletes that cache on every install, so any run right after an install pays full cost. Scope the script to `src` (`eslint src`) to make Phase 6.1 usable; `yarn eslint src` completes in ~3s.

Every lint result recorded in Phases 3.2–4 of this plan was obtained via `yarn eslint src`, not `yarn lint`.

### 4. `craco` is a dependency and `craco.config.js` exists, but nothing uses it

`@craco/craco` is installed and `craco.config.js` wires up `postcss.config.js`, but **every** npm script (`start`, `build`, `test`) invokes `react-scripts` directly — so the craco config, and the postcss customisation it carries, is never applied. Either the scripts should call `craco`, or craco and its config should be dropped as dead weight. Unrelated to React 19 and deliberately left untouched during this upgrade; flagged so it isn't mistaken later for upgrade fallout.

### 5. `FadeLoader size={100}` is inert at all 21 call sites

See Phase 3.4 above. Pre-existing, unchanged by the upgrade, and deliberately not fixed inside it — but the spinners are almost certainly not the size somebody intended. Fix is `height`/`width`/`radius`, as its own change with its own visual check.

---

## Phase 6 — Validation

1. `yarn lint` — should still be 0 errors/0 warnings (final state of the React 18 plan); flag anything new introduced by the dependency bumps.
   - **Correction:** the real baseline is 0 errors / **1** warning — a pre-existing `prettier/prettier` "Delete `··`" at `launches/Launch.js:140`, introduced by commit `b000f06a` ("Phase 4 working"), unrelated to any upgrade work. Treat 0 errors / 1 warning as the clean baseline, or clear it with `yarn lint:fix`.
   - See Open Blockers #3 — run it as `yarn eslint src`, not `yarn lint`, until the script is rescoped.
2. `CI=true npx react-scripts test --watchAll=false` — **new step, added 2026-08-14.** `yarn test` was silently broken for three phases (Open Blockers #4 context / Phase 4.4) and nobody noticed, because a green `yarn build` and a green Selenium run say nothing about whether jest can even parse the import graph. Expect 1 passing suite, ~11s. Run it after every future dependency bump, not just at the end.
3. Manual smoke test each module, with extra attention to: the 6 TinyMCE editor instances, the date picker, the 2 replaced checkboxes, and the spinners.
   - Add for Phase 3.3: confirm both analytics `<script>` tags actually reach `<head>` when `session.metainfo.analyticsEnabled` is true. A dropped inline script fails neither the build nor Selenium — it just silently turns analytics off.
4. Run the Dokimion_Tests Selenium suite (TC1–TC22) against the built React 19 app. This is the same finish line the React 18 plan never crossed (its "Remaining to finalize" section still reads "Get the Selenium suite green" as of last update) — worth clearing both upgrades' validation in the same pass rather than twice. Note: the suite has an unrelated, currently-open flakiness issue (intermittent 429s from a load-balancer rate limit tripped by TinyMCE's per-plugin asset bursts on the testcase page) — don't let that get misattributed to this upgrade if it resurfaces mid-testing.
5. Merge `upgrade/react-19` → `main`.

---

## Risk Mitigation Summary

| Risk | Mitigation |
|---|---|
| `@tinymce/tinymce-react` 4→6 (2 majors, 6 editor instances) | Highest-usage integration point; dedicated smoke-test pass before moving on (Phase 3.1) |
| `semantic-ui-react` has no React 19 path, and never will (no newer release exists) | Usage was only `Checkbox` in 2 files — replace rather than wait on/fork the library |
| `react-scripts` 5 / CRA is unmaintained upstream | No upper `react` bound, has built fine across majors historically; not a blocker here, but flag as a standing risk for whatever comes after React 19 |
| Storybook already broken under React 18, invisible because unused | Remove rather than fix — confirmed 0 real usage |
| Bundling all dependency bumps together obscures which one broke the build | Bump one at a time (Phase 3), build after each |
| A green build + green Selenium reads as "everything works" | It isn't. Webpack tolerates ESM-only deps that jest cannot load, so `yarn test` broke for three phases undetected. Gate on **lint + unit tests + build + Selenium** — see Phase 6.2 |
| Grep audits scoped to app code miss removed APIs elsewhere | The Phase 1 "no `ReactDOM.render` anywhere" claim was falsified by `src/App.test.js`. Audit the whole tree, tests included |
