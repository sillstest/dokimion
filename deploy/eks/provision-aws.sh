#!/usr/bin/env bash
#
# provision-aws.sh — create the AWS resources the Dokimion EKS deploy needs, and print the values
# to paste into deploy.env. Covers: ECR repo, ACM certificate (DNS-validated), and a Cognito
# User Pool + hosted domain + app client (the ALB login gate).
#
# It does NOT create the EKS cluster, the ALB controller, the EBS CSI driver, or Route 53 records
# (cluster-level, usually already in place / managed elsewhere). See deploy/eks/README.md.
#
#   ./provision-aws.sh              # DRY RUN: print every aws command it WOULD run, change nothing
#   ./provision-aws.sh --run        # actually create the resources
#   ./provision-aws.sh --run ecr    # create just one piece: ecr | acm | cognito  (default: all)
#
# Safe to re-run: each step checks for an existing resource (by name/prefix) before creating.
#
# Required env (or edit the defaults below):
#   AWS_REGION        target region (must match the ALB / ACM cert region)
#   DOKIMION_HOST     the public hostname users browse to (e.g. dokimion.example.org)
# Optional env:
#   ECR_REPO          ECR repository name            (default: dokimion)
#   IMAGE_TAG         tag to report in ECR_IMAGE     (default: latest)
#   COGNITO_POOL_NAME Cognito user pool name         (default: dokimion-users)
#   COGNITO_DOMAIN_PREFIX  hosted-UI domain prefix   (default: dokimion-<account-id>)
#
# After it prints the values, copy them into deploy/eks/deploy.env, then build & push the image
# with push-image.sh and apply with ./apply.sh apply.
set -euo pipefail
cd "$(dirname "$0")"

# ---- args ------------------------------------------------------------------
RUN=0; ONLY=all
for a in "$@"; do
  case "$a" in
    --run) RUN=1 ;;
    ecr|acm|cognito|all) ONLY="$a" ;;
    -h|--help) sed -n '2,32p' "$0"; exit 0 ;;
    *) echo "unknown arg: $a (use --run and/or one of: ecr acm cognito all)" >&2; exit 2 ;;
  esac
done

AWS_REGION="${AWS_REGION:-us-east-1}"
DOKIMION_HOST="${DOKIMION_HOST:-dokimion.example.org}"
ECR_REPO="${ECR_REPO:-dokimion}"
IMAGE_TAG="${IMAGE_TAG:-latest}"
COGNITO_POOL_NAME="${COGNITO_POOL_NAME:-dokimion-users}"

command -v aws >/dev/null || { echo "ERROR: aws CLI not found." >&2; exit 1; }

# run() prints the command; executes it only with --run. Captures stdout so later steps can use it.
run() {
  if [ "$RUN" -eq 1 ]; then
    echo "+ aws $*" >&2
    aws "$@"
  else
    echo "    aws $*" >&2
    return 0
  fi
}
note() { printf '\n==> %s\n' "$*" >&2; }

ACCOUNT_ID="$(aws sts get-caller-identity --query Account --output text 2>/dev/null || echo '<ACCOUNT_ID>')"
COGNITO_DOMAIN_PREFIX="${COGNITO_DOMAIN_PREFIX:-dokimion-${ACCOUNT_ID}}"
REGISTRY="${ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com"

[ "$RUN" -eq 1 ] || note "DRY RUN — no resources will be created. Re-run with --run to apply. Account=${ACCOUNT_ID} Region=${AWS_REGION}"

OUT_ECR_IMAGE="${REGISTRY}/${ECR_REPO}:${IMAGE_TAG}"
OUT_ACM_ARN=""; OUT_POOL_ARN=""; OUT_CLIENT_ID=""

# ---- ECR -------------------------------------------------------------------
do_ecr() {
  note "ECR repository: ${ECR_REPO}"
  if aws ecr describe-repositories --repository-names "$ECR_REPO" --region "$AWS_REGION" >/dev/null 2>&1; then
    echo "    (exists)" >&2
  else
    run ecr create-repository --repository-name "$ECR_REPO" --region "$AWS_REGION" \
        --image-scanning-configuration scanOnPush=true \
        --image-tag-mutability MUTABLE >/dev/null
  fi
  echo "    ECR_IMAGE => ${OUT_ECR_IMAGE}" >&2
}

# ---- ACM (DNS-validated cert for DOKIMION_HOST) ----------------------------
do_acm() {
  note "ACM certificate for ${DOKIMION_HOST}"
  # reuse an existing ISSUED/PENDING cert for this exact domain if present
  local existing
  existing="$(aws acm list-certificates --region "$AWS_REGION" \
                --query "CertificateSummaryList[?DomainName=='${DOKIMION_HOST}'].CertificateArn | [0]" \
                --output text 2>/dev/null || echo None)"
  if [ -n "$existing" ] && [ "$existing" != "None" ]; then
    OUT_ACM_ARN="$existing"; echo "    (exists) $OUT_ACM_ARN" >&2
  else
    OUT_ACM_ARN="$(run acm request-certificate --domain-name "$DOKIMION_HOST" \
        --validation-method DNS --region "$AWS_REGION" \
        --query CertificateArn --output text)" || true
    [ "$RUN" -eq 1 ] && echo "    requested $OUT_ACM_ARN" >&2 || OUT_ACM_ARN="arn:aws:acm:${AWS_REGION}:${ACCOUNT_ID}:certificate/<new>"
  fi
  echo "    NOTE: a DNS-validated cert is not usable until you add the CNAME it asks for:" >&2
  echo "          aws acm describe-certificate --certificate-arn <arn> --region ${AWS_REGION} \\" >&2
  echo "            --query 'Certificate.DomainValidationOptions[].ResourceRecord'" >&2
  echo "          then create that CNAME in Route 53 and wait for status ISSUED." >&2
}

# ---- Cognito (user pool + domain + app client) -----------------------------
do_cognito() {
  note "Cognito user pool: ${COGNITO_POOL_NAME}"
  local pool_id
  pool_id="$(aws cognito-idp list-user-pools --max-results 60 --region "$AWS_REGION" \
              --query "UserPools[?Name=='${COGNITO_POOL_NAME}'].Id | [0]" --output text 2>/dev/null || echo None)"
  if [ -n "$pool_id" ] && [ "$pool_id" != "None" ]; then
    echo "    (pool exists) $pool_id" >&2
  else
    pool_id="$(run cognito-idp create-user-pool --pool-name "$COGNITO_POOL_NAME" \
        --region "$AWS_REGION" --auto-verified-attributes email \
        --query 'UserPool.Id' --output text)" || true
    [ "$RUN" -eq 1 ] || pool_id="${AWS_REGION}_<new>"
  fi
  OUT_POOL_ARN="arn:aws:cognito-idp:${AWS_REGION}:${ACCOUNT_ID}:userpool/${pool_id}"

  note "Cognito hosted domain: ${COGNITO_DOMAIN_PREFIX}"
  if aws cognito-idp describe-user-pool-domain --domain "$COGNITO_DOMAIN_PREFIX" \
        --region "$AWS_REGION" --query 'DomainDescription.Domain' --output text 2>/dev/null | grep -q .; then
    echo "    (domain exists)" >&2
  else
    run cognito-idp create-user-pool-domain --domain "$COGNITO_DOMAIN_PREFIX" \
        --user-pool-id "$pool_id" --region "$AWS_REGION" >/dev/null || true
  fi

  note "Cognito app client (ALB OIDC): dokimion-alb"
  # The ALB uses the hosted UI (authorization code flow). Callback MUST be https://<host>/oauth2/idpresponse.
  OUT_CLIENT_ID="$(run cognito-idp create-user-pool-client --user-pool-id "$pool_id" \
      --client-name dokimion-alb --region "$AWS_REGION" \
      --generate-secret \
      --allowed-o-auth-flows code --allowed-o-auth-scopes openid email \
      --allowed-o-auth-flows-user-pool-client \
      --supported-identity-providers COGNITO \
      --callback-urls "https://${DOKIMION_HOST}/oauth2/idpresponse" \
      --logout-urls "https://${DOKIMION_HOST}" \
      --query 'UserPoolClient.ClientId' --output text)" || true
  [ "$RUN" -eq 1 ] || OUT_CLIENT_ID="<new-app-client-id>"
  echo "    app client => ${OUT_CLIENT_ID}" >&2
  echo "    NOTE: create at least one user to log in with:" >&2
  echo "          aws cognito-idp admin-create-user --user-pool-id ${pool_id} --username you@example.org --region ${AWS_REGION}" >&2
}

case "$ONLY" in
  ecr)     do_ecr ;;
  acm)     do_acm ;;
  cognito) do_cognito ;;
  all)     do_ecr; do_acm; do_cognito ;;
esac

# ---- summary: paste into deploy.env ---------------------------------------
cat >&2 <<EOF

============================================================================
Paste these into deploy/eks/deploy.env $( [ "$RUN" -eq 1 ] || echo '(values are placeholders — this was a DRY RUN)' )
----------------------------------------------------------------------------
ECR_IMAGE="${OUT_ECR_IMAGE}"
DOKIMION_HOST="${DOKIMION_HOST}"
ACM_CERT_ARN="${OUT_ACM_ARN:-<run acm step>}"
COGNITO_USER_POOL_ARN="${OUT_POOL_ARN:-<run cognito step>}"
COGNITO_APP_CLIENT_ID="${OUT_CLIENT_ID:-<run cognito step>}"
COGNITO_DOMAIN_PREFIX="${COGNITO_DOMAIN_PREFIX}"
# AUTH_ADMIN_PASSWORD_CIPHER — generate separately:  java aes-encrypt.java 'YourAdminPassword'
============================================================================
Next: ./push-image.sh   (build + push the image to ECR), then ./apply.sh apply
EOF
