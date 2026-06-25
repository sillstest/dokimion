#!/bin/bash
#
# deploy_local.sh - Run dokimion server + UI DIRECTLY from this build tree
# (no sudo, no systemd, no copy to /home/dokimion). For local dev/testing on the
# build+deploy box, launched as the current user (e.g. from VS Code).
#
# This mirrors what `deploy.sh <N> <prod|test>` ends up running, but in place:
#   - server: jetty-runner + quack.war on JDK 21, config read from /etc/dokimion
#   - ui    : react-scripts dev server (npm start) with the test/prod .env, and
#             TinyMCE staged into public/ (the step `npm start` alone omits).
#
# PREREQUISITE: build first ->  config/common/mvn_build.sh
#   (produces assembly/target/quack.war, assembly/target/lib/jetty-runner.jar,
#    and ui/src/node_modules + ui/src/build)
#
# USAGE:
#   config/common/deploy_local.sh [test|prod]   # bring up server+ui (default: test)
#   config/common/deploy_local.sh stop          # stop the server+ui this script started
#
# PORTS: server -> :8080 (API), ui -> :3000. This box's nginx fronts / and /api,
# so the app works end-to-end at http://<this-host>/ once both are up.
#
# NOTE: these are UNMANAGED processes (survive your shell via nohup, but no
# auto-restart and they die on reboot). They hold 8080/3000, so the systemd
# services dokimion3_{server,ui} can't run at the same time. Stop one before
# starting the other.
#
set -u

# repo root (this script lives in config/common/)
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
LOGDIR="$ROOT/local-run"          # logs + pid files (safe to gitignore / delete)
mkdir -p "$LOGDIR"

MODE="${1:-test}"

# ---- stop subcommand -------------------------------------------------------
if [ "$MODE" = "stop" ]; then
  for svc in ui server; do
    pf="$LOGDIR/$svc.pid"
    if [ -f "$pf" ]; then
      pid="$(cat "$pf" 2>/dev/null)"
      if [ -n "$pid" ] && kill -0 "$pid" 2>/dev/null; then
        pkill -P "$pid" 2>/dev/null    # children first (npm -> react-scripts)
        kill "$pid" 2>/dev/null
        echo "stopped $svc (pid $pid)"
      fi
      rm -f "$pf"
    fi
  done
  # belt-and-suspenders: the react-scripts dev server child
  pkill -f "$ROOT/ui/src/node_modules/react-scripts/scripts/start.js" 2>/dev/null
  echo "done. (to return to the managed deployment: sudo systemctl start dokimion3_server.service dokimion3_ui.service)"
  exit 0
fi

if [ "$MODE" != "test" ] && [ "$MODE" != "prod" ]; then
  echo "usage: $0 [test|prod|stop]" >&2
  exit 2
fi

# ---- resolve JDK 21 (same preference order as mvn_build.sh / startup script) ----
JAVA_BIN=""
for c in /opt/jdk-21/bin/java \
         /usr/local/sdkman/candidates/java/21*/bin/java \
         /usr/lib/jvm/temurin-21-jdk-amd64/bin/java \
         /usr/lib/jvm/java-21-openjdk-amd64/bin/java \
         "$HOME"/.sdkman/candidates/java/21*/bin/java; do
  [ -x "$c" ] && JAVA_BIN="$c" && break
done
JAVA_BIN="${JAVA_BIN:-/usr/bin/java}"
if ! "$JAVA_BIN" -version 2>&1 | grep -q '"21'; then
  echo "WARNING: no JDK 21 found; using $JAVA_BIN ($("$JAVA_BIN" -version 2>&1 | head -1))" >&2
fi

# ---- prerequisite build artifacts -----------------------------------------
WAR="$ROOT/assembly/target/quack.war"
RUNNER="$ROOT/assembly/target/lib/jetty-runner.jar"
for f in "$WAR" "$RUNNER"; do
  [ -f "$f" ] || { echo "ERROR: missing $f -- run config/common/mvn_build.sh first" >&2; exit 1; }
done

# ---- ports must be free (else systemd services or a prior run hold them) ---
for p in 8080 3000; do
  if ss -ltn 2>/dev/null | grep -q ":$p "; then
    echo "ERROR: port $p already in use. Stop whatever holds it first, e.g.:" >&2
    echo "  sudo systemctl stop dokimion3_server.service dokimion3_ui.service" >&2
    echo "  (or: $0 stop)" >&2
    exit 1
  fi
done

# ---- 1. SERVER: jetty-runner + quack.war on JDK 21 -------------------------
# (same flags as config/production/dokimion3/startup_dokimion_server.sh, minus the
#  JMX monitoring block, which is not needed for a local run)
echo "starting server: $JAVA_BIN ... jetty-runner.jar quack.war  -> :8080"
cd "$ROOT"
nohup "$JAVA_BIN" \
  -Dspring.hazelcast.enable=false \
  -Xms2g -Xmx4g -XX:+UseG1GC -XX:MaxMetaspaceSize=512m \
  -Xbootclasspath/a:/etc/dokimion \
  -jar "$RUNNER" "$WAR" \
  > "$LOGDIR/server.log" 2>&1 &
echo $! > "$LOGDIR/server.pid"
echo "  server pid $(cat "$LOGDIR/server.pid")  (log: $LOGDIR/server.log)"

# ---- 2. UI: select env, stage TinyMCE, run react-scripts dev server --------
cd "$ROOT/ui/src"

# .env selects the Cloudflare Turnstile keys (test = always-pass invisible key).
# deploy.sh copies .env_test/.env_prod here; do the same.
cp "$ROOT/config/common/.env_$MODE" .env && echo "  ui .env  <- config/common/.env_$MODE"

# Stage TinyMCE into public/ so /tinymce/tinymce.min.js is served statically.
# Without this, react-scripts returns index.html for that path -> the app throws
# "Unexpected token '<'" / "tinymce should have been loaded into global scope".
# (deploy.sh does this as its last step; `npm start` alone does NOT.)
cp -r node_modules/tinymce* public/. && echo "  staged TinyMCE -> public/tinymce"

export NODE_OPTIONS=--openssl-legacy-provider   # react-scripts 5 / OpenSSL 3 on Node 20
export BROWSER=none                              # don't try to open a browser
export CI=false
echo "starting ui: npm start (react-scripts dev server)  -> :3000"
nohup /usr/bin/npm start > "$LOGDIR/ui.log" 2>&1 &
echo $! > "$LOGDIR/ui.pid"
echo "  ui pid $(cat "$LOGDIR/ui.pid")  (log: $LOGDIR/ui.log)"

echo
echo "Launching. The UI takes ~30-60s to compile; then open  http://$(hostname)/"
echo "Watch:  tail -f $LOGDIR/server.log   |   tail -f $LOGDIR/ui.log"
echo "Stop :  $0 stop"
