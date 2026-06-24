# java21_upgrade — Convert the Dokimion Java code to Java 21

**Goal:** Get the Maven multi-module Java codebase compiling and running on **JDK 21**, with the
smallest viable change set. Run the existing Selenium suite + unit tests as the regression net.

## Current stack (what drives the migration)
- **Maven multi-module** (15 modules), `quack 1.22-SNAPSHOT`, ~161 Java files.
- **Java 8** source (`<maven.compiler>1.8`), **plain Spring 5.3.14** (not Boot), **Jersey 2.25.1**
  (JAX-RS), **Jackson 2.8.5**, **JAXB** (beans generated from XSD via `maven-jaxb23-plugin`),
  JUnit (classic).
- **`javax.*` everywhere**: `javax.ws.rs` (66), `javax.servlet.http` (33), `javax.xml.bind` (13), `javax.mail`.
- **Runtime**: WAR on **Eclipse jetty-runner**, `jetty.version=9.4.35.v20201120` (root pom). Prod Docker
  base historically `openjdk:8u212`; the staging boxes (s-dokimion1/2/3) currently run **JDK 11**
  (`/usr/bin/java` → `/etc/alternatives/java` → 11).

## How this project is actually built, deployed & run  ← read before touching build/runtime
Two scripts in `config/common/` drive everything; the plan's tests must use *these*, not ad-hoc mvn:

**Build — `config/common/mvn_build.sh`** (run on the build box):
```sh
export NODE_OPTIONS=--openssl-legacy-provider          # UI (react-scripts/webpack) needs legacy OpenSSL
export PATH=/opt/apache-maven-3.6.3/bin:$PATH
export PATH=/opt/apache-maven/bin:$PATH                 # pinned Maven 3.6.3
mvn clean install -DskipTests                           # FULL build — NO module exclusions (incl. ui + assembly)
```
- Produces `assembly/target/quack.war` and `assembly/target/lib/jetty-runner.jar`. The **assembly
  module pulls jetty-runner** at `${jetty.version}` — so bumping Jetty = bump that property; assembly
  repackages the runner.
- ⚠ My Phase-1 builds used `-pl '!ui,!assembly'`. The real build includes both, so the **assembly and
  ui modules are NOT yet verified on JDK 21** (see Phase 1 status).

**Deploy — `config/common/deploy.sh <N> <prod|test>`** (`N` = 1/2/3 or s1/s2/s3 or `_dev`):
- Tars `ui/src/` → `ui.tgz`; copies `quack.war`→`/home/dokimion/dokimion/dokimion.war`,
  `jetty-runner.jar`, `tools/*.java`, `mongodb_*_init.js`.
- Installs the per-server `startup_dokimion_server.sh`, the common `startup_dokimion_ui.sh`, and
  `.env_prod`/`.env_test` → `src/.env`; chowns to `dokimion`.
- **Restarts systemd `dokimion<N>_server.service` + `dokimion<N>_ui.service`.**

**Runtime — the JVM launch** lives in `config/production/dokimion{1,2,3}/startup_dokimion_server.sh`:
```sh
/usr/bin/java <JMX flags> -Dspring.hazelcast.enable=false \
  -Xms2g -Xmx{4g|8g} -XX:+UseG1GC -verbose:gc -XX:+PrintGCDetails \
  -XX:+HeapDumpOnOutOfMemoryError -XX:MaxMetaspaceSize=512m \
  -Xbootclasspath/a:/etc/dokimion \
  -jar /home/dokimion/dokimion/jetty-runner.jar /home/dokimion/dokimion/dokimion.war | logger
```
- **This file is where `--add-opens` JVM args go and where JDK 21 gets selected** (point `/usr/bin/java`
  at a JDK-21 java, or repoint `/etc/alternatives/java`, or hardcode the JDK-21 path here).
- Bootclasspath is **`/etc/dokimion`** (not `/etc/quack`). dokimion1 uses `-Xmx8g`, dokimion2/3 `-Xmx4g`.
- The **UI** runs separately as `dokimion<N>_ui.service` → `startup_dokimion_ui.sh` (`npm start`,
  the react-scripts dev server). Pure Node — outside the Java-21 scope, but note it's a dev server.

## Strategy decision (read first)
Two very different efforts — this plan does **(A)**, not **(B)**:
- **(A) Run on JDK 21, keep `javax.*`** — bump the build to JDK 21 and bump only the libraries needed
  for JDK-21 compatibility (Jersey 2.x latest, Jackson, Spring 5.3 latest, JAXB RI, Jetty), keeping the
  `javax` namespace. **Smallest viable path** and what "convert to Java 21" should mean.
- **(B) Jakarta modernization** — Spring 6 + Jersey 3 + rename every `javax.*`→`jakarta.*`. Massive,
  separate project. **Out of scope**; flagged where a bumped lib might force it.

---

## Phase 0 — Baseline & prep (no code change)  ✅ DONE
1. JDK 21 installed via SDKMAN at `~/.sdkman/candidates/java/21.0.11-tem`; system/runtime JDK is 11
   (`/usr/lib/jvm/java-11-openjdk-amd64`). Work is on branch `upgrade/react-18` (not a separate java-21
   branch). JDK 11/8 retained for rollback.
2. Green baseline: 14 non-UI modules build + **49 unit tests pass on JDK 11** (incl. embedded-mongo
   `dal`/`services` tests). Recorded as the comparison point.

## Phase 1 — Build *with* JDK 21, bytecode still Java 8 (de-risk tooling)  ✅ MOSTLY DONE
All changes were in root `pom.xml` (~20 lines), backward-compatible with JDK 8/11. Result: **14 non-UI
modules compile + all 49 unit tests pass on BOTH JDK 21 and JDK 11**, WAR builds.
1. Build plugins bumped: `maven-compiler-plugin` 2.3.2→**3.13.0**, `maven-surefire-plugin` 2.16→**3.2.5**,
   `maven-source-plugin` 2.1.2→**3.3.1**, and pinned `maven-war-plugin`→**3.4.0** (super-pom default 2.2
   fails on JDK 18+: "Cannot access defaults field of Properties").
2. **JAXB codegen fixed** (the predicted #1 blocker): `maven-jaxb23-plugin` 0.14.0→**0.15.3** (bundles
   JAXB RI 2.3.7 w/ MethodHandles; 2.3.0's XJC used the removed `Unsafe.defineClass`). A surgical 2.3.9
   override was tried first and abandoned — mixing versions broke on rngom/`NameClass`.
3. JDK-removed EE modules: resolved transitively via the 0.15.3 toolchain.
   - **assembly verified on JDK 21** ✅ — full Java reactor `mvn clean install -DskipTests -pl '!ui'`
     builds all 15 modules incl. `assembly`, producing `assembly/target/quack.war` (61M) +
     `assembly/target/lib/jetty-runner.jar` (8.8M), the exact artifacts `deploy.sh` ships.
   - **`ui` module NOT built here** — s-dokimion3 has no node/npm (it's a runtime box; the build box has
     node + Maven 3.6.3). The UI build is pure Node/webpack, unaffected by the JDK, so it's verified on
     the build box, not as part of JDK-21 work.
   - **Runtime smoke on JDK 21 PASSED (2026-06-24)** ✅ — ran the JDK-21-built `quack.war` under JDK 21
     (Temurin 21.0.11) on a spare port (18080), same `/etc/dokimion` config, **NO `--add-opens`, NO lib
     bumps**. Spring context, Mongo (driver 4.9.1 → dokimion5:27017), Hazelcast 5.3.0, Jersey 2.25.1/HK2
     resource scan, and Jetty 9.4.35 runner ALL started clean; `GET /` → 200, `GET /api/user/session` →
     401 (full Jersey→resource→exception-mapper path). **Zero** InaccessibleObjectException / IllegalAccess
     / NoClassDefFound. The predicted Phase-2 reflection blockers did NOT appear on basic smoke.
   - **Still TODO for full Phase-1 confidence:** the deep regression — run the **Selenium suite (TC1–TC28)**
     against a JDK-21 deployment (exercises authed flows, complex Jackson JSON, JAXB marshalling, uploads,
     launchers — where any remaining reflection issue would surface).

## Phase 2 — Bump runtime-critical libraries (still Java-8 source) — RE-SCOPED after the smoke passed
**Re-scope (2026-06-24):** the basic JDK-21 runtime smoke passed with the *current* libs and NO
`--add-opens` (see Phase 1), so these bumps are **no longer presumed blockers** — they're now
*contingent*, driven by what the Selenium regression actually breaks. New order of operations:
- **First:** run the full Selenium suite against a JDK-21 deployment with libs UNCHANGED. If it's green,
  Phase 2 may be a no-op (or just the prudent Jackson bump). Only bump a lib when a specific failure
  points at it. Bump incrementally; after each: `mvn_build.sh` → `deploy.sh <N> test` → smoke + Selenium.
- Candidate bumps if/when needed (prudent even if smoke-clean, given the versions' age):
  1. **Jackson 2.8.5 → 2.17.x** (most likely to bite under complex JSON; safest proactive bump).
  2. **Jersey 2.25.1 → 2.41+** (latest 2.x, *still `javax.ws.rs`*) + matching HK2.
  3. **Spring 5.3.14 → 5.3.39** (latest 5.3.x; stays `javax`).
  4. **Jetty:** bump root-pom `jetty.version` (9.4.35 → latest **9.4.5x**); assembly repackages the runner.
     9.4.35 already runs on 21 (proven in smoke), so this is hygiene, not a blocker.
  5. `--add-opens` in **`config/production/dokimion{1,2,3}/startup_dokimion_server.sh`** — NOT needed for
     basic startup (proven); add only if a deep flow throws InaccessibleObjectException. Redeploy via
     `deploy.sh` (it reinstalls the startup script + restarts the service).

## Phase 3 — Flip the language/bytecode level to 21
1. Change `<maven.compiler>` → `<maven.compiler.release>21</maven.compiler.release>` across the build.
2. Fix compile errors from removed/deprecated APIs (few expected; watch `sun.misc.*`, deprecated `java.*`).
   - **Test:** `mvn_build.sh`, unit tests, `deploy.sh <N> test`, smoke, Selenium.

## Phase 4 — Runtime hardening & containerization on JDK 21
1. **Point the runtime at JDK 21:** make `/usr/bin/java` (or `/etc/alternatives/java`, or the explicit
   path in `startup_dokimion_server.sh`) a JDK-21 java on each `dokimion<N>` box. Resolve any
   illegal-reflective-access warnings (tune `--add-opens`); confirm `-Xbootclasspath/a:/etc/dokimion`
   still behaves on 21 (deprecated but functional).
2. Update prod Docker base `openjdk:8u212` → `eclipse-temurin:21-jre` (adjust startup).
   - **Test:** container/host builds and runs on JDK 21; full smoke + Selenium against the deployment.

## Phase 5 — (Optional) Adopt Java 21 features / cleanup
Records, pattern-matching `switch`, text blocks where they simplify — optional, file-by-file, each
independently testable. Not required for running on 21.

---

## Cross-cutting testing strategy
- **Unit:** `mvn -pl <module> test` per module (services has `TestCaseServiceTest`, `ProjectServiceTest`,
  etc.); full `mvn_build.sh` (i.e. `mvn clean install`).
- **Integration/smoke:** build via `mvn_build.sh`, `deploy.sh <N> test` to a staging node, curl key
  endpoints (`/api/user/session`, login, project/testcase list); tail `dokimion<N>_server.service` logs.
- **End-to-end regression:** the **Selenium suite (TC1–TC28)** — run against each phase's JDK-21
  deployment. The real behavior safety net. (Note: TC22/TC23 were last blocked by the staging nginx 429
  rate-limit, not the app.)
- **Bisect-friendly:** one dependency/level change per commit so failures are attributable.

## Top risks (likely order)
1. **JAXB codegen** on JDK 21 — ✅ resolved in Phase 1 (plugin 0.15.3 / JAXB 2.3.7).
2. **Jersey 2.25 / HK2** reflection on JDK 17+ (runtime) → Jersey 2.41+ and `--add-opens` in the server
   startup script.
3. **Jetty 9.4.35 runner** on JDK 21 (runtime) → bump `jetty.version`; may force a runtime bump.
4. **Jackson 2.8** on JDK 16+ (must bump).
5. **Hidden jakarta pull-in:** if any bumped lib only ships `jakarta`, scope jumps toward (B) — pin to the
   last `javax` line instead.
6. **assembly/ui build on 21 unverified** — the full `mvn clean install` (not the `-pl '!ui,!assembly'`
   subset) hasn't run on 21 yet; do this first.
