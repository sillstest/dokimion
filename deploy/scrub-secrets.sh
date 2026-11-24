#!/usr/bin/env bash
#
# scrub-secrets.sh — keep the ONE authoritative, live quack.properties out of git.
#
# The real config used by the Docker containers is:
#     config/production/dokimion/quack.properties
# That file holds live secrets and must never be committed. This script adds a .gitignore rule
# for exactly that path and, if it was ever accidentally tracked, stops tracking it (keeping the
# file on disk).
#
# The OTHER quack.properties in the repo (config/production/dokimion{1,2,3}, config/staging/*,
# config/development/*, and the src/main/resources + assembly dev stubs) are intentionally LEFT
# ALONE and remain tracked — per project decision, they stay in the repo.
#
#   ./scrub-secrets.sh            # DRY RUN: show what it would do, change nothing
#   ./scrub-secrets.sh --apply    # add the .gitignore rule + untrack the live file if tracked
#
set -euo pipefail
cd "$(git rev-parse --show-toplevel)"

# Live config files used by the containers — must stay out of git (hold secrets / live host).
PROTECT_FILES=(
  config/production/dokimion/quack.properties   # production container config (live secrets)
  deploy/quack.properties                        # docker-deploy config template (live secrets)
  deploy/quack.properties.rendered               # run-local render of the above, mounted into the app
  deploy/quack.env                               # host/port values for the above
)

# Ignore ONLY these exact paths (a broad config/**/quack.properties rule is avoided so the other,
# intentionally-tracked quack.properties keep working normally).
GITIGNORE_RULES=(
  '# --- live config: never commit (secrets / live host values) ---'
  'config/production/dokimion/quack.properties'
  'deploy/quack.properties'
  'deploy/quack.properties.rendered'
  'deploy/quack.env'
)

# Files we must NOT remove from git (left here for clarity / safety).
KEEP_FILES=(
  config/development/laptop_VM/quack.properties
  config/production/dokimion1/quack.properties
  config/production/dokimion2/quack.properties
  config/production/dokimion3/quack.properties
  config/staging/s-dokimion1/quack.properties
  config/staging/s-dokimion2/quack.properties
  config/staging/s-dokimion3/quack.properties
  api/src/main/resources/quack.properties
  assembly/quack.properties
  dal/src/main/resources/quack.properties
)

tracked() { git ls-files --error-unmatch "$1" >/dev/null 2>&1; }

MODE="${1:-dry}"
case "$MODE" in
  dry|'')
    echo "DRY RUN — nothing changes. Re-run with --apply to act."
    echo
    echo "Protect (keep OUT of git):"
    for f in "${PROTECT_FILES[@]}"; do
      if tracked "$f"; then echo "  $f -> TRACKED; would: git rm --cached (kept on disk)"
      else echo "  $f -> not tracked (good); would just ensure the .gitignore rule"; fi
    done
    echo
    echo "Would add to .gitignore (if missing):"; printf '  %s\n' "${GITIGNORE_RULES[@]}"
    echo
    echo "LEFT ALONE (stay tracked, per project decision):"
    for f in "${KEEP_FILES[@]}"; do tracked "$f" && echo "  keep  $f" || echo "  (not tracked) $f"; done
    ;;

  --apply)
    touch .gitignore
    for rule in "${GITIGNORE_RULES[@]}"; do
      grep -qxF "$rule" .gitignore || { printf '%s\n' "$rule" >> .gitignore; echo "gitignore += $rule"; }
    done
    git add .gitignore
    for f in "${PROTECT_FILES[@]}"; do
      if tracked "$f"; then echo "git rm --cached $f  (kept on disk)"; git rm --cached --quiet "$f"; fi
    done
    cat <<EOF

Done (staged). Review and commit:
    git status
    git commit -m "Ignore live docker/production config files; keep them out of git"

Untouched: the other quack.properties files remain tracked.
EOF
    ;;

  *) echo "usage: $0 [--apply]   (no arg = dry run)" >&2; exit 2 ;;
esac
