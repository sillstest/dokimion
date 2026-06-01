# React 18 Upgrade Plan: Class → Function Components

**Created:** 2026-05-29  
**Target branch:** `upgrade/react-18`  
**Do not execute until ready — restore this plan in a future session.**

---

## Context Summary

- **Current:** React 16.14, 56 class components, 1 function component
- **Target:** React 18, all function components (except ErrorBoundary)
- **Build:** Create React App + Craco, react-scripts v4
- **UI libs:** Material-UI v4, Semantic-UI v0.88, React Router v4
- **Tests:** Only 1 test file — manual smoke-testing is the primary safety net
- **Source tree:** `ui/src/src/`

**ErrorBoundary.js must stay a class component permanently** (no hooks equivalent for error boundaries).

---

## Phase 1 — Dependency Compatibility Audit ✅ COMPLETED 2026-05-29

### Blocking — must upgrade before React 18

| Package | Installed | Target | Notes |
|---------|-----------|--------|-------|
| `react` / `react-dom` | 16.14.0 | **18.x** | Core upgrade |
| `react-scripts` | 4.0.3 | **5.0.1** | Webpack 5, React 18 support; removes `--openssl-legacy-provider` |
| `@craco/craco` | 6.2.0 | **7.x** | v6 only supports react-scripts v4 |
| `react-router-dom` | 4.3.1 | **6.x** | v4 peer dep is React ^15; v6 supports React 16.8+ and 18 |
| `@material-ui/core` v4 | 4.12.4 | `@mui/material` **5.x** | New package name; JSS to Emotion; codemods available |
| `semantic-ui-react` | 0.88.1 | **2.1.5** | v2 supports React 18; major API changes from v0 |
| `@storybook/react` | 6.3.4 | **7.x** | v6.5.5 is minimum, v7+ recommended for full React 18 support |
| `highcharts-react-official` | 2.1.3 | **3.x** | v2 peer dep is React >=16.0; v3+ required |
| `react-select` | 2.0.0 | **5.5.0** | v2 peer dep is React ^15/^16; v5 supports React 18 |
| `react-spinners` | 0.5.4 | **0.13.0** | v0.5 peer dep is React ^16; v0.13+ supports React 18 |
| `react-date-picker` | 7.3.0 | **10.x** | v7 peer dep is React >=15.5; v10+ supports React 18 |
| `@fortawesome/react-fontawesome` | 0.1.2 | **0.2.6** | v0.1 peer dep is React 16.x only |

### Dead libraries — no React 18 version exists, must replace

| Package | Installed | Action |
|---------|-----------|--------|
| `react-highcharts` | 16.0.2 | **Remove** — abandoned; only supports React ^16. Use `highcharts-react-official` (already a dep) for all charts |
| `react-axios` | 2.0.3 | **Remove** — abandoned; no React 18 version exists. Replace usages with direct `fetch` calls (already used in `backend.js`) |

### Needs attention — works but has known React 18 issues

| Package | Installed | Issue | Action |
|---------|-----------|-------|--------|
| `react-helmet` | 6.1.0 | Known StrictMode double-invoke bugs in React 18 | Replace with `react-helmet-async` (drop-in compatible API) |
| `reactjs-popup` | 2.0.5 | Not officially declared for React 18, likely works | Test in Phase 2; upgrade if issues arise |
| `react-google-recaptcha` | 3.1.0 | Not officially declared for React 18, likely works | Note: already being removed on current `norecaptcha` branch |

### Already compatible — no changes needed

| Package | Installed | Status |
|---------|-----------|--------|
| `react-textarea-autosize` | 8.5.9 | ✅ explicitly supports React ^18 |
| `re-resizable` | 6.9.11 | ✅ explicitly supports React ^18 |
| `@tinymce/tinymce-react` | 4.2.0 | ✅ explicitly supports React ^18 |
| `prop-types` | 15.7.2 | ✅ React-version agnostic |
| `d3`, `moment`, `jquery`, `bootstrap`, `prismjs`, `qs`, `query-string` | — | ✅ Not React-specific |

**Step 1.2** — Create feature branch: `upgrade/react-18`.

---

## Phase 2 — Upgrade React (engine first, components unchanged) ✅ COMPLETED 2026-05-29

**Step 2.1** ✅ — Upgraded packages:
- `react` 16.14.0 → 18.3.1
- `react-dom` 16.14.0 → 18.3.1
- `react-scripts` 4.0.3 → 5.0.1 (Webpack 5; removed `--openssl-legacy-provider`)
- `@craco/craco` 6.2.0 → 7.1.0
- Removed `--env=jsdom` from test script (default in react-scripts v5)

**Step 2.2** ✅ — Updated `ui/src/src/index.js`: `ReactDOM.render` → `createRoot`, removed `registerServiceWorker`.

**Step 2.3** ✅ — `yarn build` completed successfully: `Compiled with warnings`. Warnings are pre-existing Prettier/ESLint formatting issues, not React 18 regressions. No compile errors.

---

## Phase 3 — Eliminate Deprecated Lifecycle Methods ✅ COMPLETED 2026-05-29

**Step 3.1** ✅ — `componentWillMount` removed from 2 files: `ProjectSettings.js` and `TestCases.js`. Bodies merged into existing `componentDidMount`.

**Step 3.2** ✅ — `componentWillReceiveProps` replaced with `componentDidUpdate(prevProps)` in all 25 files (28 occurrences). Pattern: `nextProps.foo` → `this.props.foo`; guards added on `prevProps.foo !== this.props.foo` to prevent infinite re-render loops.

**Step 3.3** ✅ — `yarn build` succeeded: `Compiled with warnings`. Warnings are pre-existing Prettier/ESLint formatting only, no new errors.

---

## Phase 4 — Upgrade Blocking Libraries

**Step 4.1** — Upgrade `react-router-dom` v4 → v6. Update all `<Switch>`, `<Route>`, and history/navigation patterns in `App.js` and router-aware components.

**Step 4.2** — Upgrade `@material-ui/core` v4 → `@mui/material` v5. Rename all imports (`@material-ui/core/...` → `@mui/material/...`), update theme/style API. One sweep + fix compile errors.

**Step 4.3** — Upgrade other flagged libraries from Step 1.1 one at a time. Test after each.

---

## Phase 5 — Convert Class Components to Functions (bottom-up)

Convert leaf components first (no sub-components), work upward to root.

### Step 5.1 — Leaf/presentational components
- `ui/src/src/pager/Pager.js`
- `ui/src/src/common/uicomponents/ConfirmButton.js`
- `ui/src/src/common/Footer.js`
- `ui/src/src/user/components/` (all files in this directory)

### Step 5.2 — Stateful leaf components (single concern)
- `ui/src/src/comments/Comments.js`
- Form components: `AttributeForm.js`, `OrganizationForm.js`, `ProjectForm.js`, `LaunchForm.js`, `TestCaseForm.js`

### Step 5.3 — User/auth module (self-contained)
- `Login.js`, `ForgotPassword.js`, `CreateUser.js`, `DeleteUser.js`
- `ChangeProfile.js`, `Profile.js`, `OrgSelect.js`
- `Auth.js`, `IdpAuth.js`, `Users.js`

### Step 5.4 — Domain modules (convert all files in each module, test before moving on)
1. Attributes module (2 files)
2. Audit module (2 files)
3. Organizations module (3 files)
4. TestSuites module (2 files)
5. Projects module (6 files)
6. TestCases module (7 files)
7. Launches module (14 files — largest, do last)

### Step 5.5 — Shell components
- `ui/src/src/common/Header.js`
- `ui/src/src/common/Main.js`
- `ui/src/src/common/SubComponent.js`
- `ui/src/src/common/Redirect.js`

### Step 5.6 — Root component
- `ui/src/src/App.js` — convert last.

### Conversion rules for each component
- `this.state` → `useState` hook(s), one per logical state value
- `componentDidMount` → `useEffect(() => {...}, [])`
- `componentDidUpdate(prevProps, prevState)` → `useEffect(() => {...}, [deps])`
- `componentWillUnmount` → cleanup function returned from `useEffect`
- Bound methods (`this.onFoo = this.onFoo.bind(this)`) → plain arrow functions
- `this.props.foo` → destructured props
- One component per commit; smoke-test each module before moving on

---

## Phase 6 — React 18 Strict Mode & Cleanup

**Step 6.1** — Enable `<React.StrictMode>` in `index.js`. Fix any double-effect bugs surfaced in development.

**Step 6.2** — Audit `useEffect` calls for missing dependency arrays or stale closures.

**Step 6.3** — Remove `prop-types` declarations (optional cleanup).

---

## Risk Mitigation Summary

| Risk | Mitigation |
|------|------------|
| Library incompatibility | Phase 1 audit before any code changes |
| Routing breakage | React Router upgrade as isolated step |
| MUI migration breakage | One sweep, compile-error-driven fixes |
| Regression in converted components | Bottom-up order; test each module before moving on |
| ErrorBoundary breakage | Explicitly excluded from conversion |
| Strict mode double-effect bugs | Phase 6 dedicated to catching these |
