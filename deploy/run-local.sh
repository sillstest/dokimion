#!/usr/bin/env bash
#
# Local smoke-run of the Dokimion image + a Mongo container. This is the DEV/verify path only —
# NOT the EKS deployment (no ALB / Cognito / TLS; plain HTTP on :PORT). Mongo data PERSISTS in a
# named Docker volume ($MONGO_VOLUME, default dokimion-mongo-data) across up/rebuild/down.
#
#   deploy/run-local.sh up        # (re)create mongo + app (Mongo data persists in the volume)
#   deploy/run-local.sh restart   # restart the existing containers (keeps db)
#   deploy/run-local.sh rebuild   # docker build the image, then `up`
#   deploy/run-local.sh down      # remove containers + network (KEEPS the Mongo volume)
#   deploy/run-local.sh wipe      # remove containers + network + Mongo volume (FRESH db)
#   deploy/run-local.sh logs      # follow the app log
#   deploy/run-local.sh status    # ps + quick health (default)
#
# App config now comes from deploy/quack.properties (rendered from deploy/quack.env), mounted into
# the app container — NOT from env vars. Edit host/port in deploy/quack.env; admin password and
# other settings live in deploy/quack.properties.
# Overridable via env: IMAGE, MONGO_IMAGE, PORT, MONGO_VOLUME, RENDERED_PROPS
#
# ---------------------------------------------------------------------------
# STARTUP OPTIONS (bringing the stack back up after a stop or `down`)
#
#   Restart stopped containers, Mongo data PRESERVED:
#       deploy/run-local.sh restart          # or:  docker start dk-mongo dk-app
#
#   Recreate the containers (Mongo data PRESERVED in its volume across up/rebuild/down):
#       deploy/run-local.sh up
#
#   Start completely fresh (delete the Mongo volume too):
#       deploy/run-local.sh wipe && deploy/run-local.sh up
#
#   Rebuild the image first (after code changes), then recreate:
#       deploy/run-local.sh rebuild
#
#   Browse by IP or over an `ssh -L 8088:localhost:8088` tunnel — set the host so
#   the session cookie matches how you reach it:
#       DOKIMION_HOST=localhost deploy/run-local.sh up
#
#   Open it:   http://<DOKIMION_HOST>:<PORT>/     login:  admin / <auth.admin.password in quack.properties>
#              (defaults: http://s-dokimion3.psonet:8088   admin / DockerTest1)
#
#   Remove containers + network entirely when done:
#       deploy/run-local.sh down
# ---------------------------------------------------------------------------
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
# The app reads its config from deploy/quack.properties (rendered from deploy/quack.env), mounted
# at /etc/dokimion/quack.properties. Source quack.env so host/port here match what goes in the file.
[ -f "$ROOT/deploy/quack.env" ] && { set -a; . "$ROOT/deploy/quack.env"; set +a; }

IMAGE="${IMAGE:-dokimion:verify}"
MONGO_IMAGE="${MONGO_IMAGE:-dokimion-mongo:verify}"   # stock mongo:7 + baked mongod.conf
HOST_FQDN="${DOKIMION_HOST:-s-dokimion3.psonet}"      # from quack.env; cookie domain / browse host
PORT="${PORT:-${DOKIMION_PORT:-8088}}"                # host publish port; keep == DOKIMION_PORT in quack.env
NET=dk-net; MONGO=dk-mongo; APP=dk-app; VOL="${MONGO_VOLUME:-dokimion-mongo-data}"
RENDERED_PROPS="${RENDERED_PROPS:-$ROOT/deploy/quack.properties.rendered}"

# Re-exec under the docker group if the socket isn't reachable (new group needs a fresh shell).
if ! docker info >/dev/null 2>&1; then
  if command -v sg >/dev/null && getent group docker | grep -qw "$(id -un)"; then
    exec sg docker -c "$(printf '%q ' "$0" "$@")"
  fi
  echo "ERROR: can't reach the docker daemon. Open a new shell or run: newgrp docker" >&2
  exit 1
fi

# Render deploy/quack.properties (${DOKIMION_HOST}/${DOKIMION_PORT} from quack.env) -> a concrete
# file we mount into the app. Admin password & turnstile secret come from the file, not env.
render_props() {
  command -v envsubst >/dev/null || { echo "ERROR: envsubst not found (gettext-base)." >&2; exit 1; }
  envsubst '${DOKIMION_HOST} ${DOKIMION_PORT}' < "$ROOT/deploy/quack.properties" > "$RENDERED_PROPS"
  chmod 600 "$RENDERED_PROPS"
}

build_mongo() {
  docker image inspect "$MONGO_IMAGE" >/dev/null 2>&1 && return 0
  DOCKER_BUILDKIT=1 docker build -f "$ROOT/deploy/Dockerfile.mongo" -t "$MONGO_IMAGE" "$ROOT/deploy"
}
# mongod.conf is baked into $MONGO_IMAGE (its CMD runs `mongod --config /etc/mongod.conf`),
# so no config bind-mount is needed — only the data volume.
start_mongo() {
  docker run -d --name "$MONGO" --network "$NET" -v "${VOL}:/data/db" "$MONGO_IMAGE" >/dev/null
}
# The app gets ALL its config from the mounted quack.properties (entrypoint skips env-render when
# the file is present). No -e config vars needed.
start_app() {
  render_props
  docker run -d --name "$APP" --network "$NET" -p "${PORT}:80" \
    -v "${RENDERED_PROPS}:/etc/dokimion/quack.properties:ro" \
    "$IMAGE" >/dev/null
}

case "${1:-status}" in
  up)
    docker rm -f "$APP" "$MONGO" >/dev/null 2>&1 || true
    docker network rm "$NET" >/dev/null 2>&1 || true
    docker network create "$NET" >/dev/null
    build_mongo; start_mongo; start_app
    echo "started.  URL: http://${HOST_FQDN}:${PORT}   login: admin / (password from deploy/quack.properties: auth.admin.password)"
    echo "(jetty ready in ~15-20s — check with: $0 status)"
    ;;
  restart)
    docker restart "$MONGO" "$APP" >/dev/null
    echo "restarted (db preserved).  URL: http://${HOST_FQDN}:${PORT}"
    ;;
  rebuild)
    DOCKER_BUILDKIT=1 docker build -f "$ROOT/deploy/Dockerfile" -t "$IMAGE" "$ROOT"
    DOCKER_BUILDKIT=1 docker build -f "$ROOT/deploy/Dockerfile.mongo" -t "$MONGO_IMAGE" "$ROOT/deploy"
    exec "$0" up
    ;;
  down)
    docker rm -f "$APP" "$MONGO" >/dev/null 2>&1 || true
    docker network rm "$NET" >/dev/null 2>&1 || true
    echo "removed containers + network.  Mongo volume '$VOL' KEPT (data survives) — use 'wipe' to delete it."
    ;;
  wipe)
    docker rm -f "$APP" "$MONGO" >/dev/null 2>&1 || true
    docker network rm "$NET" >/dev/null 2>&1 || true
    docker volume rm "$VOL" >/dev/null 2>&1 || true
    echo "removed containers + network + Mongo volume '$VOL' — next 'up' starts a FRESH db."
    ;;
  logs) exec docker logs -f "$APP" ;;
  status)
    docker ps --filter "name=dk-" --format "  {{.Names}}  {{.Status}}  {{.Ports}}" || true
    curl -s -o /dev/null -w "  http://localhost:${PORT}/              -> %{http_code}\n" "http://localhost:${PORT}/" || true
    curl -s -o /dev/null -w "  http://localhost:${PORT}/api/user/session -> %{http_code} (401=up)\n" "http://localhost:${PORT}/api/user/session" || true
    ;;
  *) echo "usage: $0 {up|restart|rebuild|down|wipe|logs|status}" >&2; exit 2 ;;
esac
