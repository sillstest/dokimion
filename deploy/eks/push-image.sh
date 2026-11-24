#!/usr/bin/env bash
#
# push-image.sh — build the Dokimion container image and push it to the ECR repo named in
# deploy.env (ECR_IMAGE). Run this after provision-aws.sh has created the repo and you have
# filled ECR_IMAGE in deploy/eks/deploy.env.
#
#   ./push-image.sh            # build (BuildKit) + ecr login + push   (default)
#   ./push-image.sh build      # build the image only, no login/push
#   ./push-image.sh push       # ecr login + push an already-built image
#   ./push-image.sh login      # just `docker login` to the ECR registry
#
# Env overrides: ENV_FILE (default deploy.env), DOCKERFILE (default ../Dockerfile),
#                UI_ENV (build arg, default test), PLATFORM (default linux/amd64 — EKS nodes).
set -euo pipefail
cd "$(dirname "$0")"

ENV_FILE="${ENV_FILE:-deploy.env}"
[ -f "$ENV_FILE" ] || { echo "ERROR: $ENV_FILE not found." >&2; exit 1; }
case "$ENV_FILE" in /*) ENV_SRC="$ENV_FILE";; *) ENV_SRC="./$ENV_FILE";; esac
set -a; . "$ENV_SRC"; set +a

: "${ECR_IMAGE:?set ECR_IMAGE in $ENV_FILE first (run provision-aws.sh to create the repo)}"
case "$ECR_IMAGE" in
  *REPLACE*|*123456789012*|"") echo "ERROR: ECR_IMAGE is still a placeholder in $ENV_FILE." >&2; exit 1;;
esac

# Registry host + region parsed from the ECR_IMAGE URI: <acct>.dkr.ecr.<region>.amazonaws.com/<repo>:<tag>
REGISTRY="${ECR_IMAGE%%/*}"
REGION="$(printf '%s\n' "$REGISTRY" | sed -nE 's/.*\.dkr\.ecr\.([^.]+)\.amazonaws\.com$/\1/p')"
[ -n "$REGION" ] || { echo "ERROR: couldn't parse an ECR region from '$REGISTRY'." >&2; exit 1; }

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"   # repo root = build context (deploy/eks -> ../..)
DOCKERFILE="${DOCKERFILE:-$ROOT/deploy/Dockerfile}"
UI_ENV="${UI_ENV:-test}"
PLATFORM="${PLATFORM:-linux/amd64}"

# Re-exec under the docker group if the socket isn't reachable (matches run-local.sh).
if ! docker info >/dev/null 2>&1; then
  if command -v sg >/dev/null && getent group docker | grep -qw "$(id -un)"; then
    exec sg docker -c "$(printf '%q ' "$0" "$@")"
  fi
  echo "ERROR: can't reach the docker daemon. Open a new shell or run: newgrp docker" >&2
  exit 1
fi
command -v aws >/dev/null || { echo "ERROR: aws CLI not found." >&2; exit 1; }

do_login() {
  echo "==> docker login $REGISTRY (region $REGION)" >&2
  aws ecr get-login-password --region "$REGION" \
    | docker login --username AWS --password-stdin "$REGISTRY"
}
do_build() {
  echo "==> building $ECR_IMAGE  (platform $PLATFORM, UI_ENV=$UI_ENV)" >&2
  DOCKER_BUILDKIT=1 docker build \
    --platform "$PLATFORM" \
    -f "$DOCKERFILE" \
    --build-arg "UI_ENV=$UI_ENV" \
    -t "$ECR_IMAGE" \
    "$ROOT"
}
do_push() { echo "==> pushing $ECR_IMAGE" >&2; docker push "$ECR_IMAGE"; }

# --- mongo image (mongo:7 + baked mongod.conf) ---
MONGO_DOCKERFILE="${MONGO_DOCKERFILE:-$ROOT/deploy/Dockerfile.mongo}"
mongo_build() {
  : "${MONGO_IMAGE:?set MONGO_IMAGE in $ENV_FILE}"
  echo "==> building $MONGO_IMAGE  (platform $PLATFORM)" >&2
  DOCKER_BUILDKIT=1 docker build --platform "$PLATFORM" -f "$MONGO_DOCKERFILE" -t "$MONGO_IMAGE" "$ROOT/deploy"
}
mongo_push() { echo "==> pushing $MONGO_IMAGE" >&2; docker push "$MONGO_IMAGE"; }

case "${1:-all}" in
  build)       do_build ;;
  login)       do_login ;;
  push)        do_login; do_push ;;
  mongo-build) mongo_build ;;
  mongo-push)  do_login; mongo_push ;;
  mongo)       mongo_build; do_login; mongo_push ;;
  all)         do_build; mongo_build; do_login; do_push; mongo_push
               echo "==> done (app + mongo). Deploy with: ./apply.sh apply" >&2 ;;
  *) echo "usage: $0 {all|build|login|push|mongo|mongo-build|mongo-push}" >&2; exit 2 ;;
esac
