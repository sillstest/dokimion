#!/usr/bin/env bash
#
# Local smoke-run of the Dokimion image + a throwaway Mongo. This is the DEV/verify path only —
# NOT the EKS deployment (no ALB / Cognito / TLS; plain HTTP on :PORT, Mongo data is not persisted).
#
#   deploy/run-local.sh up        # (re)create mongo + app from scratch (FRESH db)
#   deploy/run-local.sh restart   # restart the existing containers (keeps db)
#   deploy/run-local.sh rebuild   # docker build the image, then `up`
#   deploy/run-local.sh down      # stop & remove containers + network
#   deploy/run-local.sh logs      # follow the app log
#   deploy/run-local.sh status    # ps + quick health (default)
#
# Overridable via env: IMAGE, PORT, DOKIMION_HOST, ADMIN_PLAINTEXT
#
# ---------------------------------------------------------------------------
# STARTUP OPTIONS (bringing the stack back up after a stop or `down`)
#
#   Restart stopped containers, Mongo data PRESERVED:
#       deploy/run-local.sh restart          # or:  docker start dk-mongo dk-app
#
#   Recreate from scratch (FRESH Mongo — wipes anything you created):
#       deploy/run-local.sh up
#
#   Rebuild the image first (after code changes), then recreate:
#       deploy/run-local.sh rebuild
#
#   Browse by IP or over an `ssh -L 8088:localhost:8088` tunnel — set the host so
#   the session cookie matches how you reach it:
#       DOKIMION_HOST=localhost deploy/run-local.sh up
#
#   Open it:   http://<DOKIMION_HOST>:<PORT>/     login:  admin / <ADMIN_PLAINTEXT>
#              (defaults: http://s-dokimion3.psonet:8088   admin / DockerTest1)
#
#   Remove containers + network entirely when done:
#       deploy/run-local.sh down
# ---------------------------------------------------------------------------
set -euo pipefail

IMAGE="${IMAGE:-dokimion:verify}"
PORT="${PORT:-8088}"
HOST_FQDN="${DOKIMION_HOST:-s-dokimion3.psonet}"   # must match how you browse (session cookie domain)
ADMIN_PLAINTEXT="${ADMIN_PLAINTEXT:-DockerTest1}"  # the admin password; its AES ciphertext is computed below
NET=dk-net; MONGO=dk-mongo; APP=dk-app
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

# Re-exec under the docker group if the socket isn't reachable (new group needs a fresh shell).
if ! docker info >/dev/null 2>&1; then
  if command -v sg >/dev/null && getent group docker | grep -qw "$(id -un)"; then
    exec sg docker -c "$(printf '%q ' "$0" "$@")"
  fi
  echo "ERROR: can't reach the docker daemon. Open a new shell or run: newgrp docker" >&2
  exit 1
fi

cipher() { java "$ROOT/deploy/eks/aes-encrypt.java" "$ADMIN_PLAINTEXT"; }

start_mongo() { docker run -d --name "$MONGO" --network "$NET" mongo:7 --bind_ip_all >/dev/null; }
start_app() {
  docker run -d --name "$APP" --network "$NET" -p "${PORT}:80" \
    -e MONGO_URI="mongodb://${MONGO}:27017/" -e MONGO_DBNAME=dokimion \
    -e AUTH_DOMAIN="$HOST_FQDN" -e QUACK_UI_URL="http://${HOST_FQDN}:${PORT}" \
    -e AUTH_ADMIN_PASSWORD="$(cipher)" \
    "$IMAGE" >/dev/null
}

case "${1:-status}" in
  up)
    docker rm -f "$APP" "$MONGO" >/dev/null 2>&1 || true
    docker network rm "$NET" >/dev/null 2>&1 || true
    docker network create "$NET" >/dev/null
    start_mongo; start_app
    echo "started.  URL: http://${HOST_FQDN}:${PORT}   login: admin / ${ADMIN_PLAINTEXT}"
    echo "(jetty ready in ~15-20s — check with: $0 status)"
    ;;
  restart)
    docker restart "$MONGO" "$APP" >/dev/null
    echo "restarted (db preserved).  URL: http://${HOST_FQDN}:${PORT}"
    ;;
  rebuild)
    DOCKER_BUILDKIT=1 docker build -f "$ROOT/deploy/Dockerfile" -t "$IMAGE" "$ROOT"
    exec "$0" up
    ;;
  down)
    docker rm -f "$APP" "$MONGO" >/dev/null 2>&1 || true
    docker network rm "$NET" >/dev/null 2>&1 || true
    echo "removed containers + network."
    ;;
  logs) exec docker logs -f "$APP" ;;
  status)
    docker ps --filter "name=dk-" --format "  {{.Names}}  {{.Status}}  {{.Ports}}" || true
    curl -s -o /dev/null -w "  http://localhost:${PORT}/              -> %{http_code}\n" "http://localhost:${PORT}/" || true
    curl -s -o /dev/null -w "  http://localhost:${PORT}/api/user/session -> %{http_code} (401=up)\n" "http://localhost:${PORT}/api/user/session" || true
    ;;
  *) echo "usage: $0 {up|restart|rebuild|down|logs|status}" >&2; exit 2 ;;
esac
