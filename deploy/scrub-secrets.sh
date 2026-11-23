#!/usr/bin/env bash
#
# scrub-secrets.sh — stop tracking the quack.properties files that contain LIVE secrets, ignore
# them going forward, and (optionally) purge them from git history. Rotating the real credentials
# is a MANUAL step this script only reminds you about — scrubbing git does not un-leak anything
# that was already pushed.
#
# The committed files carry real mongo + admin + hazelcast passwords (identical across the
# production/staging/development configs). Anyone with repo access — or anyone who pulled it —
# has them. Treat them as compromised and rotate.
#
#   ./scrub-secrets.sh                 # DRY RUN: show what it would untrack/ignore, change nothing
#   ./scrub-secrets.sh --untrack       # git rm --cached the secret files + add .gitignore rules
#                                      #   (keeps them on disk; stages a commit for you to make)
#   ./scrub-secrets.sh --purge-history # DESTRUCTIVE: rewrite ALL history to remove them
#                                      #   (requires git-filter-repo; force-push + fresh clones)
#
# Run --untrack first, commit, rotate the secrets, then consider --purge-history.
set -euo pipefail
cd "$(git rev-parse --show-toplevel)"

# Files that hold LIVE credentials (real mongo.password / auth.admin.password / hazelcast pw).
SECRET_FILES=(
  config/development/laptop_VM/quack.properties
  config/production/dokimion1/quack.properties
  config/production/dokimion2/quack.properties
  config/production/dokimion3/quack.properties
  config/staging/s-dokimion1/quack.properties
  config/staging/s-dokimion2/quack.properties
  config/staging/s-dokimion3/quack.properties
)
# These also ship quack.properties but with dev stubs ("somepassword", "rootpassword", "CHANGEME").
# Lower risk; listed so you can decide. Add them to SECRET_FILES if you want them gone too.
STUB_FILES=(
  api/src/main/resources/quack.properties
  assembly/quack.properties
  dal/src/main/resources/quack.properties
)

GITIGNORE_RULES=(
  '# --- secrets: never commit real quack.properties again ---'
  'config/**/quack.properties'
  'cloudflareTurnstile.properties'
)

MODE="${1:-dry}"

tracked() { git ls-files --error-unmatch "$1" >/dev/null 2>&1; }

print_rotate_reminder() {
  cat <<'EOF'

----------------------------------------------------------------------------
ROTATE THESE NOW (scrubbing git does not change a password that already leaked)
----------------------------------------------------------------------------
  1. MongoDB  — change the `dokimion` DB user's password on each server
       (dokimion5 and any prod/staging Mongo), then update MONGO_URI / mongo.password
       in the live /etc/dokimion/quack.properties files (NOT in git).
  2. Admin    — pick a new Dokimion admin password; set its AES ciphertext as
       auth.admin.password  (java deploy/eks/aes-encrypt.java 'NewPassword').
  3. Hazelcast group password — change hazelcast.group.password on all nodes together.
  4. Any Cognito / AWS secret keys that appeared in those files.
Keep the real values only in /etc/dokimion (bootclasspath) or AWS Secrets Manager.
----------------------------------------------------------------------------
EOF
}

case "$MODE" in
# -------------------------------------------------------------------------- dry
  dry|'')
    echo "DRY RUN — nothing changes. Re-run with --untrack to act."
    echo
    echo "Would stop tracking (kept on disk):"
    for f in "${SECRET_FILES[@]}"; do tracked "$f" && echo "  rm --cached  $f" || echo "  (not tracked) $f"; done
    echo
    echo "Dev-stub quack.properties (NOT touched unless you add them to SECRET_FILES):"
    for f in "${STUB_FILES[@]}"; do tracked "$f" && echo "  still tracked  $f" || echo "  (not tracked)  $f"; done
    echo
    echo "Would add to .gitignore:"; printf '  %s\n' "${GITIGNORE_RULES[@]}"
    echo
    echo "History still contains these blobs until you run --purge-history."
    ;;

# ---------------------------------------------------------------------- untrack
  --untrack)
    for f in "${SECRET_FILES[@]}"; do
      if tracked "$f"; then echo "git rm --cached $f"; git rm --cached --quiet "$f"; fi
    done
    # append gitignore rules if not already present
    touch .gitignore
    for rule in "${GITIGNORE_RULES[@]}"; do
      grep -qxF "$rule" .gitignore || printf '%s\n' "$rule" >> .gitignore
    done
    git add .gitignore
    cat <<'EOF'

Staged. Review and commit, e.g.:
    git status
    git commit -m "Stop tracking quack.properties with live secrets; ignore them"

The files remain on disk (untracked) so your running configs keep working.
NEXT, and most important: ROTATE the exposed credentials (see the reminder below).
Then, if the repo was ever pushed/shared, run:  ./deploy/scrub-secrets.sh --purge-history
EOF
    print_rotate_reminder
    ;;

# ---------------------------------------------------------------- purge-history
  --purge-history)
    command -v git-filter-repo >/dev/null 2>&1 || {
      cat >&2 <<'EOF'
ERROR: git-filter-repo is not installed (recommended tool for this).
  pip install git-filter-repo        # or: apt-get install git-filter-repo / brew install git-filter-repo
Alternatively use BFG:  java -jar bfg.jar --delete-files quack.properties
EOF
      exit 1; }

    echo "DESTRUCTIVE: this rewrites every commit to drop the secret files from ALL history."
    echo "It changes commit hashes; everyone must re-clone, and you must force-push."
    read -r -p "Type REWRITE to proceed: " ans
    [ "$ans" = "REWRITE" ] || { echo "aborted."; exit 1; }

    # Back up first.
    bak="../$(basename "$PWD")-prescrub-$(date +%Y%m%d%H%M%S).bundle"
    git bundle create "$bak" --all
    echo "Full backup bundle written to: $bak"

    args=(); for f in "${SECRET_FILES[@]}"; do args+=(--path "$f"); done
    git filter-repo --invert-paths --force "${args[@]}"

    cat <<EOF

History rewritten. Then:
    git remote -v                      # filter-repo drops 'origin'; re-add it:
    git remote add origin <url>
    git push --force --all
    git push --force --tags
Everyone else must re-clone (old clones still contain the secrets).
EOF
    print_rotate_reminder
    ;;

  *) echo "usage: $0 {--untrack|--purge-history}   (no arg = dry run)" >&2; exit 2 ;;
esac
