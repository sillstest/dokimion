#!/usr/bin/env bash
#
# migrate-data.sh — move the Dokimion MongoDB data between the LOCAL docker container (dk-mongo)
# and the EKS Mongo pod. mongodump/mongorestore run INSIDE the containers (the image ships them),
# so nothing but docker (local) / kubectl (EKS) is needed on this host. The archive streams over
# stdin/stdout — no temp files left in the pod.
#
#   ./migrate-data.sh dump-local  [archive]   # dump local  dk-mongo  -> archive file
#   ./migrate-data.sh dump-eks    [archive]   # dump EKS     mongo pod -> archive file
#   ./migrate-data.sh restore-local <archive> # restore archive -> local dk-mongo   (DROPS first)
#   ./migrate-data.sh restore-eks   <archive> # restore archive -> EKS   mongo pod  (DROPS first)
#   ./migrate-data.sh to-eks      [archive]   # dump-local then restore-eks   (the cutover)
#   ./migrate-data.sh from-eks    [archive]   # dump-eks   then restore-local (rollback/refresh)
#
# Archive default: ./dokimion-<UTC-timestamp>.archive.gz  (keep these OUT of git — they hold data).
# Env overrides: DB (dokimion), NS (dokimion namespace), MONGO_CONTAINER (dk-mongo),
#   EXTRA_DUMP_ARGS / EXTRA_RESTORE_ARGS (e.g. --username ... if you later enable Mongo auth).
set -euo pipefail

DB="${DB:-dokimion}"
NS="${NS:-dokimion}"
MONGO_CONTAINER="${MONGO_CONTAINER:-dk-mongo}"
EXTRA_DUMP_ARGS="${EXTRA_DUMP_ARGS:-}"
EXTRA_RESTORE_ARGS="${EXTRA_RESTORE_ARGS:-}"
STAMP="$(date -u +%Y%m%dT%H%M%SZ)"

# --- docker, with an sg-docker fallback when the socket isn't directly reachable ---
DOCKER_SG=0
if ! docker info >/dev/null 2>&1; then
  command -v docker >/dev/null || true
  DOCKER_SG=1
fi
dk() {   # run a docker command; redirections applied by the caller pass through sg transparently
  if [ "$DOCKER_SG" = 1 ]; then sg docker -c "$(printf '%q ' docker "$@")"; else docker "$@"; fi
}
need_docker() { dk version >/dev/null 2>&1 || { echo "ERROR: can't reach the docker daemon (open a new shell or 'newgrp docker')." >&2; exit 1; }; }
need_kubectl() { command -v kubectl >/dev/null || { echo "ERROR: kubectl not found / not configured for the EKS cluster." >&2; exit 1; }; }
eks_pod() { kubectl -n "$NS" get pod -l app=mongo -o jsonpath='{.items[0].metadata.name}'; }

confirm_overwrite() {  # $1 = human target description
  echo "About to RESTORE into $1 — this DROPS the '$DB' collections there and replaces them." >&2
  printf "Type the database name '%s' to proceed: " "$DB" >&2
  read -r ans; [ "$ans" = "$DB" ] || { echo "aborted." >&2; exit 1; }
}

# --- primitives -------------------------------------------------------------
dump_local() {  # $1 archive
  need_docker
  echo "==> dumping LOCAL $MONGO_CONTAINER db='$DB' -> $1" >&2
  dk exec "$MONGO_CONTAINER" mongodump --db "$DB" --archive --gzip $EXTRA_DUMP_ARGS > "$1"
  echo "   wrote $(du -h "$1" | cut -f1)" >&2
}
restore_local() {  # $1 archive
  need_docker; [ -s "$1" ] || { echo "ERROR: archive '$1' missing/empty." >&2; exit 1; }
  confirm_overwrite "LOCAL $MONGO_CONTAINER"
  echo "==> restoring $1 -> LOCAL $MONGO_CONTAINER" >&2
  dk exec -i "$MONGO_CONTAINER" mongorestore --archive --gzip --drop --nsInclude "$DB.*" $EXTRA_RESTORE_ARGS < "$1"
}
dump_eks() {  # $1 archive
  need_kubectl; local pod; pod="$(eks_pod)"
  echo "==> dumping EKS $NS/$pod db='$DB' -> $1" >&2
  kubectl -n "$NS" exec "$pod" -- mongodump --db "$DB" --archive --gzip $EXTRA_DUMP_ARGS > "$1"
  echo "   wrote $(du -h "$1" | cut -f1)" >&2
}
restore_eks() {  # $1 archive
  need_kubectl; [ -s "$1" ] || { echo "ERROR: archive '$1' missing/empty." >&2; exit 1; }
  local pod; pod="$(eks_pod)"
  confirm_overwrite "EKS $NS/$pod"
  echo "==> restoring $1 -> EKS $NS/$pod" >&2
  kubectl -n "$NS" exec -i "$pod" -- mongorestore --archive --gzip --drop --nsInclude "$DB.*" $EXTRA_RESTORE_ARGS < "$1"
}

# --- commands ---------------------------------------------------------------
cmd="${1:-}"; arg="${2:-}"
case "$cmd" in
  dump-local)    dump_local  "${arg:-./dokimion-local-$STAMP.archive.gz}" ;;
  dump-eks)      dump_eks    "${arg:-./dokimion-eks-$STAMP.archive.gz}" ;;
  restore-local) [ -n "$arg" ] || { echo "usage: $0 restore-local <archive>" >&2; exit 2; }; restore_local "$arg" ;;
  restore-eks)   [ -n "$arg" ] || { echo "usage: $0 restore-eks <archive>"   >&2; exit 2; }; restore_eks   "$arg" ;;
  to-eks)        a="${arg:-./dokimion-cutover-$STAMP.archive.gz}"; dump_local "$a"; restore_eks   "$a"; echo "==> cutover done (archive kept: $a)" >&2 ;;
  from-eks)      a="${arg:-./dokimion-fromeks-$STAMP.archive.gz}"; dump_eks   "$a"; restore_local "$a"; echo "==> pulled EKS->local (archive kept: $a)" >&2 ;;
  *) sed -n '2,19p' "$0" >&2; exit 2 ;;
esac
