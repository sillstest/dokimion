#!/usr/bin/env bash
#
# Render the Dokimion EKS manifests with values from deploy.env, then apply/preview them in order.
#   ./apply.sh render    # print the rendered YAML (preview; no cluster changes)
#   ./apply.sh diff      # kubectl diff against the cluster
#   ./apply.sh apply     # render | kubectl apply -f -   (default)
#
# Only the ${VARS} listed below are substituted; any other $… in the YAML is left untouched.
set -euo pipefail
cd "$(dirname "$0")"

ENV_FILE="${ENV_FILE:-deploy.env}"
[ -f "$ENV_FILE" ] || { echo "ERROR: $ENV_FILE not found." >&2; exit 1; }
case "$ENV_FILE" in /*) ENV_SRC="$ENV_FILE";; *) ENV_SRC="./$ENV_FILE";; esac
set -a; . "$ENV_SRC"; set +a

VARS='${ECR_IMAGE} ${MONGO_IMAGE} ${DOKIMION_HOST} ${QUACK_UI_URL} ${AUTH_ADMIN_PASSWORD_CIPHER} ${ACM_CERT_ARN} ${COGNITO_USER_POOL_ARN} ${COGNITO_APP_CLIENT_ID} ${COGNITO_DOMAIN_PREFIX}'
MANIFESTS=(00-namespace.yaml 10-mongo.yaml 20-dokimion-config.yaml 30-dokimion.yaml 40-ingress.yaml)

# fail fast if a required value is still a placeholder (render is exempt so you can preview)
require_filled() {
  local bad=0 v val
  for v in ECR_IMAGE MONGO_IMAGE DOKIMION_HOST AUTH_ADMIN_PASSWORD_CIPHER ACM_CERT_ARN \
           COGNITO_USER_POOL_ARN COGNITO_APP_CLIENT_ID COGNITO_DOMAIN_PREFIX; do
    val="${!v:-}"
    case "$val" in
      ""|*REPLACE*|*example.org*|123456789012*)
        echo "  - $v is still a placeholder: '$val'" >&2; bad=1 ;;
    esac
  done
  [ "$bad" -eq 0 ] || { echo "ERROR: fill the above in $ENV_FILE first." >&2; exit 1; }
}

render() { for m in "${MANIFESTS[@]}"; do echo "---"; envsubst "$VARS" < "$m"; done; }

case "${1:-apply}" in
  render) render ;;
  diff)   require_filled; render | kubectl diff  -f - || true ;;
  apply)  require_filled; render | kubectl apply -f - ;;
  *) echo "usage: $0 {render|diff|apply}" >&2; exit 2 ;;
esac
