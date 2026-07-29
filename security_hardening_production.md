# security_hardening_production — Load Balancer ↔ Web Server communication (PRODUCTION)

**Scope:** the internal hop between the nginx load balancer and the three nginx web servers, as
deployed in **production**. Supersedes the staging-scoped `security_hardening.md` for the prod boxes.

**Live configs analyzed (fetched via SSH on port 32, 2026-07-23):**
- Load balancer: `dokimion.psonet:/etc/nginx/sites-available/load_balancer.conf`
  (+ includes `rate_limiting.h`, `certificates.h`, `proxy_pass.h`, `server_name.h`, `http_return.h`, `servers.h`)
- Web servers: `dokimion{1,2,3}.psonet:/etc/nginx/sites-available/dokimion_common.conf`

---

## Status — re-verified live on 2026-07-29

**Production is no longer untouched.** On 2026-07-29 the repo configs were installed on all four boxes
(`dokimion`, `dokimion{1,2,3}`) and nginx reloaded on each — verified by an old master PID with fresh
workers, not a restart. Two things changed on the wire: **M1 is closed** (wildcard CORS replaced by the
trusted-origin allowlist) and **H1's include scaffolding is now in place but deliberately inert**.
Everything served correctly afterwards: 200 direct on all three web boxes, `200 200 200 200 200 200`
across `ip_hash` through the LB, and clean per-host `:80` → `:443` 301s.

| # | Item | Status |
|---|------|--------|
| H1a | Source restriction (`allow`/`deny`) on the web servers | ✅ **DEPLOYED & VERIFIED 2026-07-29** — `403` from a non-allowlisted source on all three boxes, on `/` and `/api`, while the LB and on-box checks still get `200`. See the finding |
| H1b | mTLS (`ssl_verify_client` + LB client cert) | 🔴 Open — **not started on production.** No CA installed; `lb_mtls.h` and `lb_client_cert.h` are deployed but fully commented. `mtls_h1_deploy.md` from Phase -1 |
| H2 | Shared key `644` on all 4 boxes; needless copy on the LB | 🔴 Open — **now measured on all four (2026-07-29): `644 root:root`, byte-identical, every box.** The `dokimion2/3` gap is closed. LB confirmed not to reference the `.key` at all. Fix is a `chmod 600` ×3 plus an `rm` on the LB; commands in the finding |
| M1 | Wildcard CORS | ✅ **DEPLOYED & VERIFIED 2026-07-29** — trusted origins reflected, `evil.example.com` gets no `Allow-Origin` at all, on all 3 web boxes. See the finding for the measurement |
| M2 | `auth` zone defined but unapplied | 🟠 Open — `general` + `limit_conn` + `429` live; `zone=auth` used 0× |
| M3 | No `ssl_ciphers` on the web servers | 🟠 Open — unchanged |
| L1 | LB redirect double slash | ✅ **DEPLOYED & VERIFIED 2026-07-29** (`44d35fb8`) — `/`, `/api/project` and `/deep/path?q=1` all redirect with a single slash and the query string intact |
| L2 | HSTS `preload` | 🟡 Open — still sent |
| L3 | Stray / world-readable certs on the LB | 🟡 Open — `test_staging.*` pair and `testing_languagetechnology_org.key` still `644`. **Read the ⚠️ in the L3 finding before deleting either** |
| N1 | LB `server_name` :80 vs :443 mismatch | 🟡 Open, **downgraded — the feared breakage does not occur.** Measured 2026-07-29: the redirect fires for *both* hostnames, because the `:80` block is the LB's only one and is therefore the default server. Latent, not live |
| L4 | Web-server config drift | ✅ Resolved |

### ⚠️ Deploy-day lesson — `server_name.h` is the one file you cannot copy-paste between hosts

During the 2026-07-29 rollout the `dokimion2` install block was reused on `dokimion1` and `dokimion3`,
which left **both** boxes running `server_name dokimion2.psonet;`. It went unnoticed because every
functional check still passed: each box has a single `:443` server block, so nginx treats it as the
default server and serves regardless of the name, and the `:80` redirects use `$host` rather than
`$server_name`. Corrected the same day; all three now match their own host.

This was survivable only because `server_name.h` is the **sole** per-host file — `webserver_cert.h`,
`lb_access.h` and `lb_mtls.h` are byte-identical across `dokimion{1,2,3}`, so reusing another host's
copies of those changed nothing. Substitute the host number in *every* `$R/dokimion<N>/` path, and
confirm afterwards:

```bash
cat /etc/nginx/sites-available/server_name.h     # must name THIS host
```

### Why production was behind — resolved 2026-07-29

All four boxes are at `fd9b3f8f` on `https_upgrade` and the installed config now matches the repo. The
repo-ahead/live-behind gap this section described is closed.

**Both traps below were navigated successfully on 2026-07-29 — they are kept as the record of why the
deploy was staged the way it was, and because they still apply to any rebuilt box.**

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

**What the install changed — the delta measured immediately before the 2026-07-29 rollout.** This has
now been applied on all four boxes; it is kept as the record of what landed, and as the expected delta
for a rebuilt box. Everything not listed was already byte-identical to the repo (`servers.h`,
`certificates.h`, `server_name.h`, `rate_limiting.h`, `http_return.h`, and — since `de168077` —
`proxy_pass.h`):

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

🛑 **As of `lb_access.h`'s 2026-07-29 change, this install command ENFORCES the H1 source restriction.**
It is no longer behaviour-neutral. `lb_access.h` now ships `allow 10.3.0.43; allow 127.0.0.1; deny all;`
instead of `allow all;`, so any client reaching a web box directly from another address starts getting
**403** the moment you reload. Run the access-log check in the H1 finding first, and roll one node at a
time. To deploy the other files without enforcing yet, install everything *except* `lb_access.h`.

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

### 🟠 H1 — LB bypass: H1a RESOLVED 2026-07-29, H1b (mTLS) still open
**H1a (source restriction) is LIVE on all three production web boxes as of 2026-07-29**, at `2a0ff258`.
`lb_access.h` allows the LB (`10.3.0.43`), the three web boxes (`10.3.0.139`, `10.3.0.213`, `10.3.0.145`)
and `127.0.0.1`, then `deny all;`.

**Measured from `s-dokimion3` (`10.3.0.236`), an address deliberately *not* in the allowlist:**

| Probe | dokimion1 | dokimion2 | dokimion3 |
|---|---|---|---|
| `https://dokimion<N>.psonet/` from a denied source | **403** | **403** | **403** |
| same, `/api/project` | **403** | **403** | **403** |
| self-check via own hostname (LAN IP) | 200 | 200 | 200 |
| self-check via `https://127.0.0.1/` | 200 | 200 | 200 |

Service unaffected: 9 consecutive requests through the LB returned `200` across `ip_hash`, and the `:80`
redirect still emits a single-slash 301.

⚠️ **A 200 on the self-check proves nothing on its own.** Twice during this rollout both post-deploy
`curl`s returned 200 while `lb_access.h` was still `allow all;` — once because the boxes had not pulled the
enforcing commit, once because the install step was skipped. The only probe that distinguishes enforcement
from a no-op is a request **from an address outside the allowlist**, which must return 403. Verify the
rules before and after, not just the response codes:

```bash
grep -vE '^\s*#|^\s*$' /etc/nginx/sites-available/lb_access.h
```

**LB source IP verified empirically 2026-07-29, not inferred.** With traffic flowing through the LB,
`ss -tnH 'sport = :443'` on each web box showed exactly one peer — `10.3.0.43` — on all three, matching
`dokimion.psonet` eth0 (`10.3.0.43/8`). Staging learned to confirm this rather than trust the documented
estimate; re-run it if the network changes.

**Direct-client audit COMPLETE — 2026-07-29, all three web boxes, corrected command, all rotations.**
Every source is internal and already in the allowlist, so H1a is cleared to deploy:

| Box | Sources found (requests) | All allowed? |
|---|---|---|
| `dokimion1` | `10.3.0.43` LB (11423), `10.3.0.139` self (22) | ✅ |
| `dokimion2` | `10.3.0.43` LB (13879), `10.3.0.213` self (7), `10.3.0.145` (2), `10.3.0.139` (2) | ✅ |
| `dokimion3` | `10.3.0.43` LB (11314), `10.3.0.145` self (4) | ✅ |

Reverse DNS: `10.3.0.43` = `dokimion.psonet`, `10.3.0.139` = `dokimion1`, `10.3.0.145` = `dokimion3`,
`10.3.0.213` = `dokimion2`. **Four distinct addresses across all three logs, no external client,
monitoring agent or test runner anywhere.** Production has no equivalent of staging's Selenium breakage.

Scale of what `deny all;` will actually reject: 36,616 requests arrived via the LB versus **37** direct,
a ratio between 519:1 and 2829:1 depending on the box. LB traffic is also spread evenly across the three
(11.4k / 13.9k / 11.3k), as `ip_hash` should. `127.0.0.1` never appears in any log — the loopback entry is
kept only for manual `curl 127.0.0.1` on the box.

Counts span the current log *and* all rotations (`access.log`, `.1`, `.2.gz`…`.4.gz`), which is why they
do not track the current file sizes.

**`allow 127.0.0.1;` is not sufficient, and this is easy to get wrong.** A request to
`https://dokimion1.psonet` *from* `dokimion1` resolves to that box's LAN address, and Linux then picks the
same address as the source:

```bash
ip route get 10.3.0.139        # -> local 10.3.0.139 dev lo src 10.3.0.139
```

So on-box checks arrive as `10.3.0.139`, never as loopback. `lb_access.h` therefore lists all three web
boxes as well as the LB; without them, every self-check and peer-check would 403 while the site itself
kept working — a failure that only shows up in monitoring, not in a browser.

**How the audit had to be corrected** — worth reading before running it again on a rebuilt box. `/var/log/nginx/access.log`
holds **two log formats**: `upstreamlog` from `nginx.conf:23` (`[$time_local] $remote_addr …`) for most
requests, and the built-in `combined` (`$remote_addr …`) for `location /api` only
(`dokimion_common.conf:154`). So `awk '{print $1}'` reads a *timestamp* for the majority of lines and
silently under-reports clients — the first attempt on `dokimion1` returned mostly timestamp rows, and
raised its apparent LB traffic from 656 to 11423 once fixed. Note `$time_local` contains a space, so in
`upstreamlog` the address is **`$3`**, not `$2`. Use:

```bash
sudo zcat -f /var/log/nginx/access.log* \
  | awk '{print ($1 ~ /^\[/) ? $3 : $1}' | sort | uniq -c | sort -rn | head -20
```

Any address outside the five in `lb_access.h` will start receiving **403**. On staging this rollout broke
the Selenium suite, whose `Dokimion_Tests/.runsettings` targets a web box directly. Add legitimate clients
to `lb_access.h` first, or repoint them at the LB.

Sanity-check the output per box: if two boxes report *identical* counts, one is a duplicate paste rather
than a real result — the three logs differ substantially in volume.

**Then roll one node at a time**, checking the site through the LB between each:

```bash
# on dokimion<N>, after the access-log check
sudo install -m 644 ~/dokimion/config/production/dokimion<N>/lb_access.h /etc/nginx/sites-available/lb_access.h
sudo nginx -t && sudo systemctl reload nginx
curl -sko /dev/null -w 'via LB: %{http_code}\n' https://testing.languagetechnology.org/
curl -sko /dev/null -w 'direct: %{http_code}\n' https://dokimion<N>.psonet/
```

Expect `200` via the LB and `403` direct. **403, not 400** — `lb_mtls.h` is still inert on production, so
`ssl_verify_client` is never evaluated. Once mTLS is enabled the failure mode becomes 400 and an IP
exemption in this file stops helping, because the certificate check fires before the access phase.

**H1b (mTLS) is unchanged and still not started on production** — no CA is installed. Follow
`mtls_h1_deploy.md` from Phase -1 with production's own key material.

The original finding text follows.
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

**All four boxes measured 2026-07-29 — the gap in the 07-27 re-check is closed, and the finding holds
on every box:**

| Box | Mode | Owner | md5 (first 12) |
|---|---|---|---|
| `dokimion` (LB) | **644** | `root:root` | `c20ec60c0c5a` |
| `dokimion1` | **644** | `root:root` | `c20ec60c0c5a` |
| `dokimion2` | **644** | `root:root` | `c20ec60c0c5a` |
| `dokimion3` | **644** | `root:root` | `c20ec60c0c5a` |

One identical key, world-readable, on all four. Ownership is already `root:root`, so only the mode needs
changing. Re-measure at any time with:

```bash
for h in dokimion dokimion1 dokimion2 dokimion3; do
  echo -n "$h: "
  ssh -p 32 "$h.psonet" 'stat -c "%a %U:%G %n" /etc/nginx/sites-available/dokimion-production.key 2>&1'
done
```

**New sub-finding — confirmed 2026-07-29.** The LB carries `dokimion-production.key` even though it only
needs the `.crt`. Verified by grepping the LB's whole live config: the single reference is
`proxy_pass.h:2 → proxy_ssl_trusted_certificate .../dokimion-production.crt`, and **the `.key` is
referenced nowhere**. It is an unnecessary copy of the upstream private key on the internet-facing box —
delete it.

**Fix — on the three web boxes** (they legitimately serve with this key):
```bash
sudo chmod 600 /etc/nginx/sites-available/dokimion-production.key
stat -c '%a %U:%G' /etc/nginx/sites-available/dokimion-production.key   # expect 600 root:root
sudo nginx -t && sudo systemctl reload nginx                            # proves root can still read it
curl -sko /dev/null -w 'direct: %{http_code}\n' https://$(hostname).psonet/   # expect 200
```

**Fix — on the LB** (delete rather than chmod; nothing references it):
```bash
sudo cp /etc/nginx/sites-available/dokimion-production.key ~/dokimion-production.key.bak && chmod 600 ~/dokimion-production.key.bak
sudo nginx -T 2>/dev/null | grep -c dokimion-production.key    # expect 0 before deleting
sudo rm /etc/nginx/sites-available/dokimion-production.key
sudo nginx -t && sudo systemctl reload nginx
curl -sko /dev/null -w 'via LB: %{http_code}\n' https://testing.languagetechnology.org/   # expect 200
```

`chmod 600` is safe for nginx: the master process reads certificates as root at startup and on reload,
before dropping to the worker user. Staging did exactly this on 2026-07-28 and verified both that nginx
was unaffected and that reading the file as `bob_beck` then returned **Permission denied**. Keep the LB
backup only until the reload proves clean, then shred it — the point of this finding is fewer copies.
**Fix structurally:** move to **per-host certs signed by a small internal CA**. LB trusts the CA
(`proxy_ssl_trusted_certificate` = CA); each web server holds only its own key (single-box compromise ≠
pool-wide) and you gain revocation. Trade-off: `proxy_ssl_name` must match each upstream's cert, or
keep one SAN cert and accept the shared-key risk.

### ✅ M1 — Wildcard CORS on the web servers — RESOLVED 2026-07-29
> **Closed on production.** Deployed at `fd9b3f8f` and measured on all three web boxes with an `OPTIONS`
> preflight against `/api/project`:
>
> | Origin | `Access-Control-Allow-Origin` |
> |---|---|
> | `https://dokimion.psonet` (production LB) | reflected |
> | `https://testing.languagetechnology.org` (public) | reflected |
> | `https://evil.example.com` | **absent** — no wildcard, no reflection |
>
> Two measurement traps cost time here; use the preflight above rather than either:
> - `curl -sI https://dokimion1.psonet/api/` returns **404**, and `add_header` *without* `always` only
>   fires on 200/201/204/206/301/302/303/304/307/308. A 404 carries no CORS header for *any* origin, so
>   that test reads as "working" and "broken" identically. `/api/project` returns 401 unauthenticated —
>   also not in the list. The `OPTIONS` preflight returns 200, which is why it works.
> - `curl -s` against an internal hostname (`dokimion1.psonet`) fails certificate verification, sends the
>   error to stderr, and prints nothing on stdout. Use `-k` on internal names.
>
> Consequence worth knowing, unchanged from before: error responses (401/404/500) carry **no** CORS
> headers, because `add_header` lacks `always`. A browser making a cross-origin call that 404s sees a CORS
> error rather than the 404. The old wildcard config had the same omission, so this is not a regression —
> but it is the knob if you ever want error responses readable cross-origin.
>
> The original finding text follows.
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

### ✅ L1 — LB redirect double-slash bug — RESOLVED 2026-07-29
> **Deployed and verified on `dokimion.psonet`** at `44d35fb8`. Live measurement after the reload:
> `/` → `https://testing.languagetechnology.org/` (single slash), `/api/project` and `/deep/path?q=1`
> both preserved intact. All 8 LB files in sync with the repo; site still `200` across `ip_hash`.
>
> The original finding text follows.
`load_balancer.conf` `:80` block: `return 301 https://$host/$request_uri;` produces
`https://host//path` (`$request_uri` already has a leading slash). The web-server redirects are
already correct.

**Confirmed still live 2026-07-29**, immediately after that day's deploy:

```
http://testing.languagetechnology.org/  ->  301 https://testing.languagetechnology.org//
```

**Fix — `return 301 https://$host$request_uri;`, deployed 2026-07-29.**
Verified against a standalone nginx reproducing the `:80` block, including paths and query strings:

| Request | Redirect emitted |
|---|---|
| `/` | `https://testing.languagetechnology.org/` |
| `/api/project` | `https://testing.languagetechnology.org/api/project` |
| `/deep/path?q=1` | `https://testing.languagetechnology.org/deep/path?q=1` |

Re-check at any time with
`curl -sko /dev/null -w '%{http_code} -> %{redirect_url}\n' http://testing.languagetechnology.org/`.

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

### 🟡 N1 — LB `server_name` mismatch between :443 and :80 — OPEN, but DOWNGRADED (verified 2026-07-29)
The `:443` block serves `server_name testing.languagetechnology.org;` while the `:80` redirect block
serves `server_name test_staging.languagetechnology.org;`.

> **The feared symptom does not occur — measured, not assumed.** The `:80` redirect fires correctly for
> *both* hostnames:
>
> | `Host:` header | Result |
> |---|---|
> | `testing.languagetechnology.org` | `301 → https://testing.languagetechnology.org/` |
> | `test_staging.languagetechnology.org` | `301 → https://test_staging.languagetechnology.org/` |
>
> The reason: `load_balancer.conf` contains exactly **one** `listen 80` block and it is the only enabled
> site, so it is nginx's default server for `:80` and matches every `Host`. The `return` uses `$host`
> rather than `$server_name`, so the redirect target is correct regardless of the declared name.
>
> This is the same mechanism that hid the `server_name.h` mix-up on the web boxes — see the deploy-day
> lesson in the Status section. It is **latent, not live**: add a second `:80` vhost to the LB and the
> mismatch starts routing real traffic to the wrong place.

**Fix:** align the two `server_name`s — set `http_return.h` to the production hostname. Low urgency given
the above, but it removes a trap for whoever next adds a vhost.

---

## Priority

| # | Severity | Item | Status | Effort |
|---|----------|------|--------|--------|
| H1a | High | `allow/deny` so the backend only trusts the LB | ✅ **Deployed & verified 2026-07-29** (`2a0ff258`) — 403 from denied sources on all 3 | — |
| H1b | High | mTLS — issue a production CA + LB client cert, then `ssl_verify_client` | Open — not started; `mtls_h1_deploy.md` from Phase -1 | Medium |
| H2 | High | `chmod 600` shared key on the 3 web boxes; `rm` the needless LB copy | Open — measured on all 4; commands ready | Low |
| H2b | Medium | Replace the shared self-signed key with per-host internal-CA certs (gains revocation) | Open — structural half | Medium |
| M1 | Medium | Replace wildcard CORS with an origin allowlist; drop server-level `*` | ✅ **Deployed & verified 2026-07-29** (`fd9b3f8f`) | — |
| M2 | Medium | Apply the existing `auth` zone (5r/m) to login/sensitive endpoints | Open | Low |
| M3 | Medium | Pin `ssl_ciphers` on the web servers | Open | Low |
| L1 | Low | Fix LB redirect double-slash (`$host$request_uri`) | ✅ **Deployed & verified 2026-07-29** (`44d35fb8`) | — |
| L2 | Low | Drop HSTS `preload` on the LB | Open | Trivial |
| L3 | Low | `chmod 600` the client-facing key; verify `test_staging.*` against the **running** config before deleting anything (see the ⚠️ in the finding) | Open | Low |
| N1 | Low | Align LB `server_name` between :80 and :443 | Open — **downgraded**, redirect verified working for both hostnames 2026-07-29; latent not live | Low |
| L4 | — | Web-server config drift | ✅ Resolved | — |

**Act first on H1 + H2** — they harden the LB→web channel itself and H2 is a two-minute `chmod`. Then
M1/M2 (both low-effort, real exposure). The L/N items are hygiene.

**2026-07-27 addendum:** the H1 work is built and proven on staging, so production's H1 is now a
deployment task rather than a design one — read the two traps in the Status section first. H2 remains
the cheapest real win here and is the one item production is *worse* at than staging: the LB still
carries an unnecessary copy of the upstream private key, world-readable.
