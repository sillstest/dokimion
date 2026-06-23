# java21_upgrade — Convert the Dokimion Java code to Java 21

**Goal:** Get the Maven multi-module Java codebase compiling and running on **JDK 21**, with the
smallest viable change set. Run the existing Selenium suite + unit tests as the regression net.

## Current stack (what drives the migration)
- **Maven multi-module** (15 modules), `quack 1.22-SNAPSHOT`, ~161 Java files.
- **Java 8** (`<maven.compiler>1.8`), **plain Spring 5.3.14** (not Boot), **Jersey 2.25.1** (JAX-RS),
  **Jackson 2.8.5**, **JAXB** (beans generated from XSD via `maven-jaxb23-plugin`), JUnit (classic).
- **`javax.*` everywhere**: `javax.ws.rs` (66), `javax.servlet.http` (33), `javax.xml.bind` (13), `javax.mail`.
- **Runtime**: WAR on **Eclipse jetty-runner** —
  `java -Xbootclasspath/a:/etc/quack -jar jetty-runner.jar quack.war`; Docker base `openjdk:8u212`.

## Strategy decision (read first)
Two very different efforts — this plan does **(A)**, not **(B)**:
- **(A) Run on JDK 21, keep `javax.*`** — bump the build to JDK 21 and bump only the libraries needed
  for JDK-21 compatibility (Jersey 2.x latest, Jackson, Spring 5.3 latest, JAXB RI, Jetty), keeping the
  `javax` namespace. **Smallest viable path** and what "convert to Java 21" should mean.
- **(B) Jakarta modernization** — Spring 6 + Jersey 3 + rename every `javax.*`→`jakarta.*`. Massive,
  separate project. **Out of scope**; flagged where a bumped lib might force it.

---

## Phase 0 — Baseline & prep (no code change)
1. Install **JDK 21** (build + runtime); keep JDK 8 for rollback. Branch `upgrade/java-21`.
2. Green baseline **on Java 8**: `mvn clean install`, run existing unit tests, build `quack.war`,
   deploy, smoke-test, run the Selenium suite (TC1–TC28).
   - **Test:** all pass on Java 8; record as the comparison point.

## Phase 1 — Build *with* JDK 21 but keep bytecode at Java 8 (de-risk tooling first)
Decouple "build JVM" from "language level": build under JDK 21 while `source/target` stays `1.8`.
Surfaces JDK-21 *tooling* breakage without touching the language yet.
1. Bump Maven plugins to JDK-21-capable versions: **maven-compiler-plugin 3.13+, surefire 3.2+**,
   war, jar, shade, source, javadoc.
2. **Fix the JAXB code-gen** (`maven-jaxb23-plugin` in `beans`) — old jaxb2 plugins often fail on
   JDK 21; bump/replace it. *(Likely the first build blocker.)*
3. Ensure **JDK-removed EE modules** are explicit deps (JAXB RI `2.3.x` javax, `javax.annotation-api`,
   `javax.activation`) — several already declared; verify versions resolve.
   - **Test:** `mvn clean install` on JDK 21 (still Java-8 bytecode) succeeds; unit tests pass; `quack.war`
     builds; deploy on a JDK-21 runtime; smoke + Selenium. **Biggest single de-risk.**

## Phase 2 — Bump runtime-critical libraries (still Java-8 source), one family at a time
Old libs do reflection JDK 17+ blocks. Bump and test **incrementally** so a failure pinpoints the culprit:
1. **Jackson 2.8.5 → 2.17.x** (2.8 breaks on JDK 16+).
2. **Jersey 2.25.1 → 2.41+** (latest 2.x, *still `javax.ws.rs`*) + matching HK2.
3. **Spring 5.3.14 → 5.3.39** (latest 5.3.x; JDK 21 support; stays `javax`).
4. **Runtime (Jetty):** check `jetty.version`; jetty-runner is Jetty 9.x. Confirm latest Jetty 9.4.5x runs
   on JDK 21; if not, move to a JDK-21-supported `javax`-Servlet runtime (Jetty 10 EE8, or run the WAR
   another way).
5. Add `--add-opens` JVM args in `startup.sh` as needed
   (`--add-opens java.base/java.lang=ALL-UNNAMED`, `java.util`, `java.lang.reflect`) for Jersey/HK2/Jackson.
   - **Test after *each* bump:** `mvn clean install` + tests + war + deploy + smoke + Selenium. Bisect any
     regression to the lib just changed.

## Phase 3 — Flip the language/bytecode level to 21
1. Change `<maven.compiler>` → `<maven.compiler.release>21</maven.compiler.release>` across the build.
2. Fix compile errors from removed/deprecated APIs (few expected; watch `sun.misc.*`, deprecated `java.*`).
   - **Test:** compile, unit tests, war, deploy, smoke, Selenium.

## Phase 4 — Runtime hardening & containerization on JDK 21
1. Resolve illegal-reflective-access warnings (tune `--add-opens`); validate `-Xbootclasspath/a:/etc/quack`
   still behaves on 21 (deprecated but functional).
2. Update Docker base `openjdk:8u212-slim-stretch` → `eclipse-temurin:21-jre` (adjust startup).
   - **Test:** container builds and runs on JDK 21; full smoke + Selenium against the container.

## Phase 5 — (Optional) Adopt Java 21 features / cleanup
Records, pattern-matching `switch`, text blocks where they simplify — optional, file-by-file, each
independently testable. Not required for running on 21.

---

## Cross-cutting testing strategy
- **Unit:** `mvn -pl <module> test` per module (services has `TestCaseServiceTest`, `ProjectServiceTest`,
  etc.); full `mvn clean install`.
- **Integration/smoke:** build `quack.war`, deploy on JDK 21, curl key endpoints
  (`/api/user/session`, login, project/testcase list).
- **End-to-end regression:** the **Selenium suite (TC1–TC28)** — run against each phase's JDK-21 deployment.
  The real behavior safety net.
- **Bisect-friendly:** one dependency/level change per commit so failures are attributable.

## Top risks (likely order)
1. **JAXB codegen** on JDK 21 (build blocker, `beans` module).
2. **Jersey 2.25 / HK2** reflection on JDK 17+ (runtime) → Jersey 2.41+ and `--add-opens`.
3. **Jetty 9 runner** on JDK 21 (runtime) → may force a runtime bump.
4. **Jackson 2.8** on JDK 16+ (must bump).
5. **Hidden jakarta pull-in:** if any bumped lib only ships `jakarta`, scope jumps toward (B) — pin to the
   last `javax` line instead.
