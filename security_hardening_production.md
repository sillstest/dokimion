# security_hardening_production — Load Balancer ↔ Web Server communication (PRODUCTION)

**Scope:** the internal hop between the nginx load balancer and the three nginx web servers, as
deployed in **production**. Supersedes the staging-scoped `security_hardening.md` for the prod boxes.

**Live configs analyzed (fetched via SSH on port 32, 2026-07-23):**
- Load balancer: `dokimion.psonet:/etc/nginx/sites-available/load_balancer.conf`
  (+ includes `rate_limiting.h`, `certificates.h`, `proxy_pass.h`, `server_name.h`, `http_return.h`, `servers.h`)
- Web servers: `dokimion{1,2,3}.psonet:/etc/nginx/sites-available/dokimion_common.conf`

---

## Status — re-verified live on 2026-07-27

**Production is unchanged since the 2026-07-23 analysis. Every finding below is still open as written.**
The H1 hardening built this week has been deployed to **staging only**; production has deliberately not
been touched.

| # | Item | Status |
|---|------|--------|
| H1 | LB bypass — no `allow/deny`, no mTLS | 🔴 Open — **nothing deployed**; `lb_access.h` / `lb_mtls.h` / `lb_client_cert.h` absent from all four boxes |
| H2 | Shared key `644` on all 4 boxes; needless copy on the LB | 🔴 Open — 644 on all 4 boxes at the 2026-07-23 analysis. The 07-27 re-check covered the **LB and `dokimion1` only** — both still `-rw-r--r--`. `dokimion2/3` were *not* re-checked; assume still 644 until measured |
| M1 | Wildcard CORS | 🟠 Open **live** — but the fix is already written in the shared `dokimion_common.conf` (`ed8cc604`…`28b05893`) and is not deployed anywhere yet. See the note under the finding |
| M2 | `auth` zone defined but unapplied | 🟠 Open — `general` + `limit_conn` + `429` live; `zone=auth` used 0× |
| M3 | No `ssl_ciphers` on the web servers | 🟠 Open — unchanged |
| L1 | LB redirect double slash | 🟡 Open — `return 301 https://$host/$request_uri;` still live |
| L2 | HSTS `preload` | 🟡 Open — still sent |
| L3 | Stray / world-readable certs on the LB | 🟡 Open — `test_staging.*` pair and `testing_languagetechnology_org.key` still `644`. **Read the ⚠️ in the L3 finding before deleting either** |
| N1 | LB `server_name` :80 vs :443 mismatch | 🟡 Open — `:443` = `testing…`, `:80` = `test_staging…` |
| L4 | Web-server config drift | ✅ Resolved |

### Why production is behind, and why that is currently safe

**Checkout state re-measured live on 2026-07-29: all four boxes are now at `de168077` on
`https_upgrade`** (they were at `d82e1435` / `210031a8` when this section was written). The *checkouts*
are therefore current; what is behind is the **installed** config in `/etc/nginx`, which still predates
the H1 include lines. That combination — repo ahead, live behind — is exactly the state the two traps
below are about, so it is self-consistent and nginx is healthy only until someone installs half of it.

**Do not pull `d3ddff57` onto production and deploy without preparation.** Two traps:

1. The shared `dokimion_common.conf` and `load_balancer.conf` now contain `include` lines for
   `lb_access.h`, `lb_mtls.h` and `lb_client_cert.h`. nginx treats a missing `include` as **fatal**, so
   all three files must be present before a reload. Production copies exist in the repo and ship inert
   (`lb_access.h` is `allow all;`), preserving current behaviour.
2. `webserver_cert.h` is another such required include, and it used to carry **staging** certificate
   paths on `dokimion1` — deployed to a production box it referenced a nonexistent file and nginx
   would not start. Fixed in `dfc6ccb8`: all three production copies now point at
   `dokimion-production.crt/key`. Verify before deploying if working from an older checkout.

~~Also note `dokimion1/2/3` have dirty working trees — check `git status` before pulling.~~
**Retracted 2026-07-29 (measured):** the only dirt is untracked build artifacts — `ui/ui.tgz` on all
three, plus `ui/src/package-lock.json` on `dokimion1`. Nothing is modified, no incoming commit touches
`ui/`, and neither path is git-ignored, so a pull cannot conflict. There is nothing to clear.

### Installing the repo configs into `/etc/nginx/sites-available`

The per-host `README`s do this in five `cp` lines each. One `install` call per host replaces them: it
takes multiple sources into one destination directory (`-t`) and sets the mode explicitly, so nothing
inherits a stray permission from the checkout.

**What each box needs.** nginx reads sites *through* `sites-enabled/*.conf` (see `nginx.conf`), but
every `include` inside the site file resolves against `sites-available/`, so all of these land in
`sites-available`:

| Host | From repo | Files |
|---|---|---|
| `dokimion{1,2,3}` | `config/production/dokimion1` | `dokimion_common.conf` — the single shared copy |
| | `config/production/dokimion<N>` | `server_name.h`, `webserver_cert.h`, `lb_access.h`, `lb_mtls.h` |
| `dokimion` (LB) | `config/production/dokimion` | `load_balancer.conf`, `servers.h`, `certificates.h`, `server_name.h`, `rate_limiting.h`, `proxy_pass.h`, `http_return.h`, `lb_client_cert.h` |

`dokimion-production.crt/key` are already installed on all four boxes and are **not** part of this
sync — see the warning at the end of this section.

**What the install will actually change — measured live 2026-07-29.** Everything not listed is already
byte-identical to the repo (`servers.h`, `certificates.h`, `server_name.h`, `rate_limiting.h`,
`http_return.h`, and — since `de168077` — `proxy_pass.h`):

| Box | File | Change |
|---|---|---|
| `dokimion{1,2,3}` | `dokimion_common.conf` | **54 lines differ** — the H1 includes *and* the M1 CORS rework |
| `dokimion{1,2,3}` | `webserver_cert.h`, `lb_access.h`, `lb_mtls.h` | **absent live → newly added.** All three are required includes; they must land in the *same* `install` as the conf above or nginx will not start |
| `dokimion` (LB) | `load_balancer.conf` | **5 lines** — adds only `include .../lb_client_cert.h` plus comments |
| `dokimion` (LB) | `lb_client_cert.h` | **absent live → newly added**, and inert (all directives commented) |

Behaviour after this lands: unchanged. `lb_access.h` ships `allow all;` on production, `lb_mtls.h` and
`lb_client_cert.h` are fully commented out. The one real behaviour change is the M1 CORS tightening
carried inside those 54 lines — wildcard `*` replaced by the trusted-origin allowlist, which now includes
`https://dokimion.psonet`. Verify after reload with:

```bash
curl -sI -H 'Origin: https://evil.example.com' https://dokimion1.psonet/api/ | grep -i access-control || echo "no CORS header for an untrusted origin — correct"
curl -sI -H 'Origin: https://dokimion.psonet'  https://dokimion1.psonet/api/ | grep -i access-control
```

**Per web server** — run on the box, substituting its own number for `<N>`:

```bash
R=~/dokimion/config/production
sudo install -m 644 -t /etc/nginx/sites-available \
  $R/dokimion1/dokimion_common.conf \
  $R/dokimion<N>/server_name.h $R/dokimion<N>/webserver_cert.h \
  $R/dokimion<N>/lb_access.h   $R/dokimion<N>/lb_mtls.h
sudo nginx -t && sudo systemctl reload nginx
```

Only `server_name.h` actually differs between the three hosts today — `webserver_cert.h`,
`lb_access.h` and `lb_mtls.h` are byte-identical across `dokimion{1,2,3}`. Keep sourcing them from
the host's own directory anyway: they are per-host by design, and `lb_access.h` is where the three
will diverge when the `allow`/`deny` restriction is enforced.

**On the load balancer:**

```bash
R=~/dokimion/config/production/dokimion
sudo install -m 644 -t /etc/nginx/sites-available \
  $R/load_balancer.conf $R/servers.h $R/certificates.h $R/server_name.h \
  $R/rate_limiting.h $R/proxy_pass.h $R/http_return.h $R/lb_client_cert.h
sudo nginx -t && sudo systemctl reload nginx
```

**`proxy_pass.h` drift — resolved 2026-07-29.** Until then the repo copy was **stale and unsafe to
deploy**: untouched since `d31cfbcc` (2026-07-21), it read `proxy_ssl_trusted_certificate
/etc/nginx/sites-available/dokimion-staging.crt` — a filename that exists nowhere, neither the production
name (`dokimion-production.crt`) nor the staging one (`s-dokimion-staging.crt`) — and
`proxy_pass http://prod_servers$empty` in place of `https://`. Installing it would have failed
`nginx -t` on the missing certificate; worse, correcting only the certificate path would have left the
LB→upstream hop in **cleartext**, with every `proxy_ssl_*` directive in `load_balancer.conf` inert and
`nginx -t` passing silently.

The live LB was correct all along. Its file was captured and committed verbatim, so the repo now matches
`dokimion.psonet` and `$R/proxy_pass.h` is safe to include in the `install` above.

Two lessons worth keeping:

- **`nginx -t` does not validate the upstream scheme.** A wrong `proxy_pass http://` is syntactically
  valid; only the missing-certificate error made this file fail loudly. Do not treat a passing
  `nginx -t` as proof the internal hop is still encrypted — check the scheme directly.
- **The Phase -1(b) audit missed this.** `mtls_h1_deploy.md` records
  `grep -rn s-dokimion-staging config/production/` as clean, and it was — but that pattern does not match
  `dokimion-staging`. Audit for wrong-environment paths with a looser pattern:
  ```bash
  grep -rniE 'staging|s-dokimion' config/production/ | grep -vi 'shared with staging'
  grep -rn 'proxy_pass http://' config/          # scheme downgrades
  ```

⚠️ **Never revert to `sudo cp ~/dokimion/config/production/dokimion/* .`** That glob copies
`dokimion-production.key` into `sites-available` — which *is* finding **H2** (needless world-readable
copy of the shared key on the LB) — along with `nginx.conf`, `nginx.service`, `rsyslog.conf`,
`rsyslog.service` and `README`, none of which belong in that directory. `config/production/dokimion/README`
used to say exactly that; it now carries the explicit list above, which is both fewer bytes on the wire
and the fix for H2's second half.

**All three web boxes in one pass**, stopping at the first failure rather than rolling a broken config
forward:

```bash
for n in 1 2 3; do
  echo "===== dokimion$n ====="
  ssh -p 32 "dokimion$n.psonet" bash -s "$n" <<'REMOTE' || { echo "dokimion$n FAILED — stopping"; break; }
set -euo pipefail
n=$1
R=$HOME/dokimion/config/production
cd "$HOME/dokimion" && git pull --ff-only
sudo install -m 644 -t /etc/nginx/sites-available \
  "$R/dokimion1/dokimion_common.conf" \
  "$R/dokimion$n/server_name.h" "$R/dokimion$n/webserver_cert.h" \
  "$R/dokimion$n/lb_access.h"   "$R/dokimion$n/lb_mtls.h"
sudo nginx -t && sudo systemctl reload nginx
REMOTE
done
```

`git pull --ff-only` is deliberate: it refuses to merge if the branch has diverged, rather than
creating a merge commit on a production box. (It is *not* needed to guard against dirty trees — see the
retraction above.) As of 2026-07-29 all four boxes are already at `de168077`, so the pull is a no-op.

🛑 **`sudo` requires a password on all four production boxes** — measured 2026-07-29 (`sudo -n true`
fails on `dokimion`, `dokimion1`, `dokimion2`, `dokimion3`). The loop above therefore **cannot run
unattended**, and neither can any single `install`/`nginx -t`/`systemctl reload` from a non-interactive
session. Run the per-host commands yourself in an interactive shell, or grant NOPASSWD for exactly
`install`, `nginx` and `systemctl reload nginx` first. The `config/common/sudoers` file in this repo does
not currently give that.

For the mTLS cutover, ignore the loop and roll one node at a time per `mtls_h1_deploy.md`.

**One-time step — retiring `dokimion<N>.conf`.** `dokimion_common.conf` supersedes the old per-host site
file. The READMEs used to retire it with `sudo mv dokimion<N>.conf dokimion<N>.conf_good`, which leaves
`sites-enabled/dokimion<N>.conf` dangling — and a broken symlink in `sites-enabled` is **fatal** to nginx.
All six web-server READMEs now do the swap in `sites-enabled` instead, leaving the old file untouched in
`sites-available` so rollback needs no repo access:

```bash
ls -l /etc/nginx/sites-enabled/
sudo ln -sfn ../sites-available/dokimion_common.conf /etc/nginx/sites-enabled/dokimion_common.conf
sudo rm -f /etc/nginx/sites-enabled/dokimion<N>.conf
sudo nginx -t
```

**Inspected 2026-07-29 — this step is already done on production and is now a no-op.** All three web
boxes have `sites-enabled/dokimion_common.conf -> ../sites-available/dokimion_common.conf` (symlinks
dated Jul 22), and **no `dokimion<N>.conf` symlink exists** in `sites-enabled` on any of them, so there
is nothing dangling and nothing to swap. The LB has `load_balancer.conf` symlinked (Apr 2023). Keep the
commands above for a rebuilt box; run the `ls` first either way.

Note the retired `dokimion<N>.conf` is therefore *not* enabled anywhere, which also means the rollback
path in the per-host READMEs — re-pointing `sites-enabled` at `dokimion<N>.conf` — reverts to a site that
has not been live since July. Rolling back that way is a change in behaviour, not a restoration of the
current state; prefer restoring the previous `dokimion_common.conf`.

### mTLS key material for production already exists

Generated 2026-07-27 **on `dokimion.psonet` itself**, so no private key crossed the network. In
`~bob_beck/lb-mtls/` (dir `700`, keys `600`), not yet installed:

- CA `Dokimion production LB Client CA`, RSA 4096, `pathlen:0`, expires 2036-07-25
- Client `CN=dokimion.psonet`, RSA 2048, `extendedKeyUsage = critical,clientAuth`,
  serial `E4C5A25756357F80`, expires **2029-07-26**
- Verified: chain OK for `sslclient`; key matches cert; the staging certificate does **not** validate
  against this CA (separate CA per environment).

Sequence for production: land H1 part 1 first (inert includes → enforce `allow 10.3.0.43; deny all;`),
then follow `mtls_h1_deploy.md` for part 2.

---

## What changed since the staging analysis (verified fixed — do not regress)

The LB has been materially hardened; several staging findings are now closed in production:

- **Rate limiting is now ACTIVE at the LB** (was M2). `rate_limiting.h` applies
  `limit_req zone=general burst=20 nodelay` + `limit_conn conn_limit 20`, returning `429`.
  Zones defined: `general` 10r/s, `auth` 5r/m, `conn_limit`.
- **Web-server TLS parity / drift resolved** (was L4). All three deployed `dokimion_common.conf` are
  **byte-identical**, and each includes the websocket `Upgrade`/`Connection` block. Drift cannot recur:
  the repo now keeps a single copy at `config/production/dokimion1/dokimion_common.conf`, shared by
  `dokimion{1,2,3}` and `s-dokimion{1,2,3}` alike.
- **LB TLS is strong**: `TLSv1.2/1.3`, explicit strong `ssl_ciphers`, `http2 on`,
  `ssl_session_cache`, `ssl_session_tickets off`, `ssl_buffer_size 4k`,
  `X-Frame-Options DENY`, `X-Content-Type-Options nosniff`.
- **Web-server redirect is clean**: the `:80` blocks use `https://$host$request_uri` (no double slash).
- **Per-host cert leftovers removed from the web boxes** (was L3): each web box now carries only
  `dokimion-production.crt/key`.
- LB→upstream is verified: `proxy_ssl_verify on`, `proxy_ssl_verify_depth 1`,
  `proxy_ssl_name dokimion1.psonet`, `proxy_ssl_trusted_certificate dokimion-production.crt`.
  Upstream `prod_servers` uses `ip_hash` across `dokimion{1,2,3}.psonet:443` with `keepalive 64`.
  The repo's `proxy_pass.h` had drifted from this and would have regressed it if deployed; captured from
  the live LB and committed 2026-07-29 (see the drift note in the install section).

---

## Findings, by severity (production)

### 🔴 H1 — The LB can still be bypassed; web servers don't authenticate the LB — OPEN
Each web server does `listen 443 ssl;` on **all interfaces**, with **no `ssl_verify_client`** (no mTLS)
and **no `allow`/`deny`**. The LB's `proxy_pass.h` sets `proxy_ssl_trusted_certificate` +
`proxy_ssl_name` but presents **no client certificate** (`proxy_ssl_certificate`/`_key` absent). Trust
is one-way: the LB verifies the web server, the web server accepts any client. Any host that can route
to `dokimionN.psonet:443` reaches the app **directly**, bypassing the LB's rate limiting, security
headers, and the Cloudflare/WAF layer in front of it.

Firewall status could not be confirmed (`ufw status` needs interactive sudo) — **verify it is not the
only control.**

**Fix (do both):**
- **mTLS** — issue an LB client cert (from the internal CA in H2). On each web server:
  ```nginx
  ssl_verify_client       on;
  ssl_client_certificate  /etc/nginx/sites-available/lb-client-ca.crt;
  ```
  On the LB, add to `proxy_pass.h`:
  ```nginx
  proxy_ssl_certificate     /etc/nginx/sites-available/lb-client.crt;
  proxy_ssl_certificate_key /etc/nginx/sites-available/lb-client.key;
  ```
- **Source restriction** — in each web `server {}` (443) block:
  ```nginx
  allow <LB_IP>;   # dokimion.psonet
  deny  all;
  ```
  plus a host firewall limiting `:443` to the LB. Cheap defense-in-depth even with mTLS.

### 🔴 H2 — Shared private key on all 4 boxes, world-readable (`644`) — OPEN (confirmed)
`dokimion-production.key` (1704 bytes) is **byte-for-byte identical** and mode **`-rw-r--r--` (644)**
on the LB and all three web servers **as measured on 2026-07-23**. Any local account on any box can
read the key that authenticates the *entire* pool; self-signed with `verify_depth 1` means **no
revocation** — remediation is re-issuing on every box.

**Scope of the 2026-07-27 re-check:** the LB and `dokimion1` only, both confirmed still `644`.
`dokimion2` and `dokimion3` were not re-measured, so treat them as unchanged from 07-23 rather than
as verified. Confirm all four before calling H2 closed:

```bash
for h in dokimion dokimion1 dokimion2 dokimion3; do
  echo -n "$h: "
  ssh -p 32 "$h.psonet" 'stat -c "%a %U:%G %n" /etc/nginx/sites-available/dokimion-production.key 2>&1'
done
```

**New sub-finding:** the LB carries `dokimion-production.key` even though it only needs the `.crt`
(`proxy_ssl_trusted_certificate`). That is an **unnecessary copy of the upstream private key** on the
internet-facing box — delete it.

**Fix now (all boxes that legitimately hold it):**
```bash
sudo chown root:root /etc/nginx/sites-available/dokimion-production.key
sudo chmod 600       /etc/nginx/sites-available/dokimion-production.key
# On the LB, the upstream key is not needed at all:
sudo rm /etc/nginx/sites-available/dokimion-production.key   # LB only
```
**Fix structurally:** move to **per-host certs signed by a small internal CA**. LB trusts the CA
(`proxy_ssl_trusted_certificate` = CA); each web server holds only its own key (single-box compromise ≠
pool-wide) and you gain revocation. Trade-off: `proxy_ssl_name` must match each upstream's cert, or
keep one SAN cert and accept the shared-key risk.

### 🟠 M1 — Wildcard CORS on the web servers — OPEN
Each web server sets a **server-level** `add_header Access-Control-Allow-Origin *;` and, in
`location /api`, `Access-Control-Allow-Origin "*"` with `GET,PUT,OPTIONS,POST,DELETE`. Any web origin
can invoke the API from a victim's browser; with bearer-token auth this is real cross-origin exposure.
(Note: nginx `add_header` in a `location` **replaces** inherited server-level headers, so `/api` emits
only its own CORS set — but `location /` still inherits the server-level `*`.)
**Fix:** reflect an allowlist of trusted origins instead of `*`; narrow methods to those actually used;
drop the blanket server-level `*`.

> **The fix is already committed — and it is in the file production now shares with staging.**
> `dokimion_common.conf` at HEAD carries a `map $http_origin $cors_origin` allowlist (untrusted origins
> get *no* `Access-Control-Allow-Origin` header, since nginx omits an `add_header` with an empty value),
> the server-level blanket `*` deleted, and `proxy_hide_header` on
> `Access-Control-Allow-{Origin,Methods,Headers}` in `location /` to strip the wildcards the UI upstream
> on `:3000` sets for itself. Commits `ed8cc604`, `96cb8910`, `28b05893` — all *after* staging's last
> deploy (`f7070f46`), so this is live on **neither** environment.
>
> ⚠️ **Consequence of the single shared copy:** the next time any web box installs
> `dokimion_common.conf` it picks up this CORS change too — M1 cannot be deployed to staging alone, and
> a production deploy done for some unrelated reason will carry it. Decide deliberately, don't discover it.
>
> ⚠️ **The allowlist is currently staging-only.** The `map` lists
> `https://test_staging.languagetechnology.org`, `https://testing.languagetechnology.org` and
> `https://s-dokimion.psonet` — **`https://dokimion.psonet` is absent.** Deployed to production as-is,
> any browser request carrying the production LB's own origin gets no CORS header. Add that origin
> before, or with, the first production deploy of this file.

### 🟠 M2 — `auth` rate-limit zone defined but never applied — OPEN (downgraded)
General flood protection is now live (good). However the stricter **`auth` zone (5r/m) is defined but
applied to no location** — login/sensitive endpoints get only the `general` 10r/s. Web servers have no
`limit_req` at all (only matters if H1 bypass is possible).
**Fix:** apply `limit_req zone=auth burst=… nodelay;` to the login/auth endpoints; keep a verified
Selenium-runner exemption if still needed.

### 🟠 M3 — Web-server TLS unhardened vs. the LB — OPEN
The web `listen 443 ssl` blocks set only `ssl_protocols TLSv1.2 TLSv1.3;` — no `ssl_ciphers`, no
session cache, no `http2`. Low real risk (the only intended client is the LB, which negotiates 1.2/1.3)
but inconsistent.
**Fix:** pin the same `ssl_ciphers` list the LB uses for parity.

### 🟡 L1 — LB redirect double-slash bug — OPEN (LB only)
`load_balancer.conf` `:80` block: `return 301 https://$host/$request_uri;` produces
`https://host//path` (`$request_uri` already has a leading slash). The web-server redirects are
already correct.
**Fix:** `return 301 https://$host$request_uri;`

### 🟡 L2 — HSTS `preload` set on the LB — OPEN
LB sends `Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;` despite the
inline "remove … while testing" note. This is now the **production** hostname
(`testing.languagetechnology.org`); landing on a browser preload list is hard to reverse.
**Fix:** drop `preload` unless you have deliberately decided to submit the domain.

### 🟡 L3 — Stray / world-readable certs on the LB — OPEN (LB); RESOLVED (web boxes)
Web boxes are clean. On the LB, `test_staging.languagetechnology.org.{key,pem}` (mode 644) appear
**unreferenced** as any `ssl_certificate` (only `server_name` is set from `http_return.h`), and the
client-facing key `testing_languagetechnology_org.key` is also **644 (world-readable)**.

> ⚠️ **Do not delete the `test_staging.*` pair on the strength of that "unreferenced" reading.** The
> identically-named pair was assessed as unused on the *staging* LB and deleted at `c55112ba` — and it
> was **not** unused: it is the keypair that LB's `certificates.h` serves. nginx already had it loaded
> in memory, so the site kept returning 200 and nothing looked wrong, but `nginx -t` would then fail on
> two nonexistent files and the box **could not have survived a restart**. Recovered from
> `~bob_beck/dokimion_private/`. Full account in `security_hardening_staging.md`, finding L3.
>
> Production is *probably* genuinely different — its `certificates.h` points at
> `testing_languagetechnology_org.pem/.key` both at HEAD and at `d82e1435`, the commit the LB actually
> runs, whereas staging's points at `test_staging.*`. But note prod's `http_return.h` does serve
> `server_name test_staging.languagetechnology.org;` on `:80`, and the repo is not the authority on what
> a box at an older commit has loaded.

**Fix — in this order:**
1. `chmod 600` the client-facing `testing_languagetechnology_org.key`. Unambiguous win, no risk.
2. Before touching `test_staging.*`, check what the **running** config references, not what a repo file
   references:
   ```bash
   sudo nginx -T | grep -E 'ssl_certificate(_key)?' | sort -u
   ```
3. If it really is absent from that output, prefer `chmod 600` over `rm`. Delete only after
   `sudo nginx -t` passes *and* a real `sudo systemctl restart nginx` succeeds — a reload will not
   catch a missing file that is still open in memory.

### 🟡 L4 — Web-server config drift — RESOLVED
All three deployed `dokimion_common.conf` are byte-identical, and the repo no longer carries per-host
copies to keep in sync: there is exactly one, `config/production/dokimion1/dokimion_common.conf`, used
by all six web servers (`dokimion{1,2,3}` and `s-dokimion{1,2,3}`). Edit only that file — a change
there reaches production *and* staging.

### 🟡 N1 — LB `server_name` mismatch between :443 and :80 — NEW, verify
The `:443` block serves `server_name testing.languagetechnology.org;` while the `:80` redirect block
serves `server_name test_staging.languagetechnology.org;`. A plain-HTTP request to
`testing.languagetechnology.org` may not match the `:80` server and could fall through to nginx's
default server instead of getting the 301.
**Fix:** confirm the HTTP→HTTPS redirect fires for the production hostname; align the two `server_name`s.

---

## Priority

| # | Severity | Item | Status | Effort |
|---|----------|------|--------|--------|
| H1 | High | mTLS + `allow/deny` (+ firewall) so the backend only trusts the LB | Open | Medium |
| H2 | High | `chmod 600` shared key everywhere; delete it from the LB; plan internal-CA per-host certs | Open | Low now / Medium later |
| M1 | Medium | Replace wildcard CORS with an origin allowlist; drop server-level `*` | Open live — **fix written** in the shared conf; needs `https://dokimion.psonet` added to the `map` before it ships here | Low (now a deploy) |
| M2 | Medium | Apply the existing `auth` zone (5r/m) to login/sensitive endpoints | Open | Low |
| M3 | Medium | Pin `ssl_ciphers` on the web servers | Open | Low |
| L1 | Low | Fix LB redirect double-slash (`$host$request_uri`) | Open | Trivial |
| L2 | Low | Drop HSTS `preload` on the LB | Open | Trivial |
| L3 | Low | `chmod 600` the client-facing key; verify `test_staging.*` against the **running** config before deleting anything (see the ⚠️ in the finding) | Open | Low |
| N1 | Low | Align LB `server_name` between :80 and :443; verify redirect | Verify | Low |
| L4 | — | Web-server config drift | ✅ Resolved | — |

**Act first on H1 + H2** — they harden the LB→web channel itself and H2 is a two-minute `chmod`. Then
M1/M2 (both low-effort, real exposure). The L/N items are hygiene.

**2026-07-27 addendum:** the H1 work is built and proven on staging, so production's H1 is now a
deployment task rather than a design one — read the two traps in the Status section first. H2 remains
the cheapest real win here and is the one item production is *worse* at than staging: the LB still
carries an unnecessary copy of the upstream private key, world-readable.
