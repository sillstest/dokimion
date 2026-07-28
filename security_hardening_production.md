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
| H2 | Shared key `644` on all 4 boxes; needless copy on the LB | 🔴 Open — `dokimion-production.key` still `-rw-r--r--` on the LB *and* `dokimion1` |
| M1 | Wildcard CORS | 🟠 Open — unchanged |
| M2 | `auth` zone defined but unapplied | 🟠 Open — `general` + `limit_conn` + `429` live; `zone=auth` used 0× |
| M3 | No `ssl_ciphers` on the web servers | 🟠 Open — unchanged |
| L1 | LB redirect double slash | 🟡 Open — `return 301 https://$host/$request_uri;` still live |
| L2 | HSTS `preload` | 🟡 Open — still sent |
| L3 | Stray / world-readable certs on the LB | 🟡 Open — `test_staging.*` pair and `testing_languagetechnology_org.key` still `644` |
| N1 | LB `server_name` :80 vs :443 mismatch | 🟡 Open — `:443` = `testing…`, `:80` = `test_staging…` |
| L4 | Web-server config drift | ✅ Resolved |

### Why production is behind, and why that is currently safe

The production checkouts sit at older commits — LB `dokimion.psonet` at `d82e1435`, web boxes
`dokimion{1,2,3}` at `210031a8` — none of which contain the H1 include lines. Their live
`load_balancer.conf` / `dokimion_common.conf` therefore predate the new `include` directives, so the
configuration is self-consistent and nginx is healthy.

**Do not pull `d3ddff57` onto production and deploy without preparation.** Two traps:

1. The shared `dokimion_common.conf` and `load_balancer.conf` now contain `include` lines for
   `lb_access.h`, `lb_mtls.h` and `lb_client_cert.h`. nginx treats a missing `include` as **fatal**, so
   all three files must be present before a reload. Production copies exist in the repo and ship inert
   (`lb_access.h` is `allow all;`), preserving current behaviour.
2. `config/production/dokimion1/webserver_cert.h` as committed contains **staging** certificate paths
   (`s-dokimion-staging.crt`). Deployed to a production web box it references a nonexistent file and
   nginx will not start. Fix per `mtls_h1_deploy.md`, Phase -1(b).

Also note `dokimion1/2/3` have dirty working trees — check `git status` before pulling.

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
- **Web-server TLS parity / drift resolved** (was L4). All three `dokimion_common.conf` files are now
  **byte-identical**, and each includes the websocket `Upgrade`/`Connection` block.
- **LB TLS is strong**: `TLSv1.2/1.3`, explicit strong `ssl_ciphers`, `http2 on`,
  `ssl_session_cache`, `ssl_session_tickets off`, `ssl_buffer_size 4k`,
  `X-Frame-Options DENY`, `X-Content-Type-Options nosniff`.
- **Web-server redirect is clean**: the `:80` blocks use `https://$host$request_uri` (no double slash).
- **Per-host cert leftovers removed from the web boxes** (was L3): each web box now carries only
  `dokimion-production.crt/key`.
- LB→upstream is verified: `proxy_ssl_verify on`, `proxy_ssl_verify_depth 1`,
  `proxy_ssl_name dokimion1.psonet`, `proxy_ssl_trusted_certificate dokimion-production.crt`.
  Upstream `prod_servers` uses `ip_hash` across `dokimion{1,2,3}.psonet:443` with `keepalive 64`.

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
on the LB and all three web servers. Any local account on any box can read the key that authenticates
the *entire* pool; self-signed with `verify_depth 1` means **no revocation** — remediation is
re-issuing on every box.

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
**Fix:** remove the unused `test_staging.*` pair; `chmod 600` the client-facing
`testing_languagetechnology_org.key`.

### 🟡 L4 — Web-server config drift — RESOLVED
All three `dokimion_common.conf` are byte-identical. No action; keep them in sync going forward.

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
| M1 | Medium | Replace wildcard CORS with an origin allowlist; drop server-level `*` | Open | Low |
| M2 | Medium | Apply the existing `auth` zone (5r/m) to login/sensitive endpoints | Open | Low |
| M3 | Medium | Pin `ssl_ciphers` on the web servers | Open | Low |
| L1 | Low | Fix LB redirect double-slash (`$host$request_uri`) | Open | Trivial |
| L2 | Low | Drop HSTS `preload` on the LB | Open | Trivial |
| L3 | Low | Remove unused `test_staging.*` certs; `chmod 600` client-facing key | Open | Low |
| N1 | Low | Align LB `server_name` between :80 and :443; verify redirect | Verify | Low |
| L4 | — | Web-server config drift | ✅ Resolved | — |

**Act first on H1 + H2** — they harden the LB→web channel itself and H2 is a two-minute `chmod`. Then
M1/M2 (both low-effort, real exposure). The L/N items are hygiene.

**2026-07-27 addendum:** the H1 work is built and proven on staging, so production's H1 is now a
deployment task rather than a design one — read the two traps in the Status section first. H2 remains
the cheapest real win here and is the one item production is *worse* at than staging: the LB still
carries an unnecessary copy of the upstream private key, world-readable.
