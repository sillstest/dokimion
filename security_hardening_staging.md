# security_hardening_staging — Load Balancer ↔ Web Server communication (STAGING)

**Scope:** the internal hop between the nginx load balancer and the three nginx web servers, as
**live-deployed on the staging boxes**. Based on the actual running configs (not the repo copies), so
it supersedes the repo-based `security_hardening.md` for the staging environment.

**Live configs analyzed (fetched via SSH on port 32, 2026-07-23):**
- Load balancer: `s-dokimion.psonet:/etc/nginx/sites-available/load_balancer.conf`
  (+ includes `rate_limiting.h`, `certificates.h`, `proxy_pass.h`, `server_name.h`, `http_return.h`, `servers.h`)
- Web servers: `s-dokimion{1,2,3}.psonet:/etc/nginx/sites-available/dokimion_common.conf`

---

## Status — re-verified live on 2026-07-27

| # | Item | Status |
|---|------|--------|
| **H1a** | Source restriction (`allow`/`deny`) on the web servers | ✅ **DEPLOYED & VERIFIED** |
| **H1b** | mTLS (`ssl_verify_client` + LB client cert) | 🔑 key material generated, **not installed** |
| H2 | Shared private key `644` on all 3 web boxes | 🔴 Open — unchanged |
| M1 | Wildcard CORS | 🟠 Open — unchanged (2 wildcard headers live) |
| M2 | `rate_limiting.h` empty, `auth` zone unapplied | 🟠 Open — unchanged (`rate_limiting.h` = 1 byte, `zone=auth` used 0×) |
| M3 | No `ssl_ciphers` on the web servers | 🟠 Open — unchanged (0 occurrences) |
| L1 | LB redirect double slash | 🟡 Open — unchanged |
| L2 | HSTS `preload` | 🟡 Open — unchanged |
| L3 | Stray / user-owned keys | 🟡 Open — unchanged (s-dokimion3 still worst) |
| N1 | LB `server_name` :80 vs :443 mismatch | 🟡 Open — unchanged |
| L4 | Web-server config drift | ✅ Resolved |

### H1a is live — measured, not assumed

All three web boxes now carry `lb_access.h` (`allow 10.3.0.171; allow 127.0.0.1; deny all;`),
included from the `listen 443` block of `dokimion_common.conf`. Deployed at commit `d3ddff57`.

| Probe | Result |
|---|---|
| `https://s-dokimion.psonet/` through the LB | **200** |
| direct to `s-dokimion{1,2,3}.psonet` from a non-allowed host | **403** |
| direct to `s-dokimion{1,2,3}.psonet` from the LB (`10.3.0.171`) | **200** |

The LB source address was confirmed empirically rather than taken from this document's earlier
estimate: `ip route get` on `s-dokimion.psonet` reports `dev eth0 src 10.3.0.171` for all three
upstreams, and the web servers bind `0.0.0.0:443` (IPv4 only), so the `fd80:…` AAAA records cannot
appear as `$remote_addr`.

### H1b is staged but inert

`lb_mtls.h` (web boxes) and `lb_client_cert.h` (LB) are deployed with their directives commented out —
enabling `ssl_verify_client` before the CA file exists would stop nginx from starting.

A dedicated client-auth CA and an LB client certificate were generated **on 2026-07-27, on the load
balancer itself**, so no private key has crossed the network. They sit in `~bob_beck/lb-mtls/` on
`s-dokimion.psonet` (dir `700`, keys `600`), awaiting installation:

- CA `Dokimion staging LB Client CA`, RSA 4096, `pathlen:0`, expires 2036-07-25
- Client `CN=s-dokimion.psonet`, RSA 2048, `extendedKeyUsage = critical,clientAuth`,
  serial `75D002BD0D16B786`, expires **2029-07-26**
- Verified: `openssl verify -purpose sslclient` OK; key matches cert; a real
  `openssl s_server -Verify 1` handshake **accepts** the cert and **refuses** its absence
  (`alert certificate required`, alert 116); production's cert does **not** validate against this CA.

Installation and cut-over steps: **`mtls_h1_deploy.md`**. Note that once mTLS is on, an unauthorised
direct request returns **400** (`No required SSL certificate was sent`) rather than the 403 above —
`ssl_verify_client` is evaluated before the access phase. Both controls remain active.

### Known casualty of H1a

`Dokimion_Tests/.runsettings` targets `http://s-dokimion3.psonet` directly. That now 301s to `:443`
and receives **403**; after H1b it will receive **400**. Repoint the suite at the load balancer, or
add the runner's IP to `lb_access.h`.

---

## Current posture (verified good — do not regress)

- **Web-server drift resolved** (was L4): all three `dokimion_common.conf` are **byte-identical**, each
  with the websocket `Upgrade`/`Connection` block.
- **LB TLS is strong**: `TLSv1.2/1.3`, explicit `ssl_ciphers`, `http2 on`, `ssl_session_cache`,
  `ssl_session_tickets off`, `ssl_buffer_size 4k`, `X-Frame-Options DENY`, `X-Content-Type-Options nosniff`.
- **Web-server redirect is clean**: the `:80` blocks use `https://$host$request_uri` (no double slash).
- **LB→upstream is verified**: `proxy_ssl_verify on`, `proxy_ssl_verify_depth 1`,
  `proxy_ssl_name s-dokimion1.psonet`, `proxy_ssl_trusted_certificate s-dokimion-staging.crt`.
  Upstream `stage_servers` uses `ip_hash` across `s-dokimion{1,2,3}.psonet:443`, `keepalive 64`.
- **The LB does not carry the shared upstream private key** — it holds only `s-dokimion-staging.crt`
  (better than production, where the key is needlessly present on the LB).

---

## Findings, by severity (staging)

### 🔴 H1 — The LB can be bypassed; web servers don't authenticate the LB — **H1a RESOLVED, H1b PENDING**
> **2026-07-27:** the source-restriction half is deployed and verified (see Status above); the mTLS
> half is staged and inert, with key material generated and awaiting install per `mtls_h1_deploy.md`.
> The original finding text follows.

Each web server does `listen 443 ssl;` on **all interfaces**, with **no `ssl_verify_client`** (no mTLS)
and **no `allow`/`deny`**. The LB's `proxy_pass.h` verifies the upstream but presents **no client
certificate** (`proxy_ssl_certificate`/`_key` absent). Trust is one-way — any host that can route to
`s-dokimionN.psonet:443` reaches the app directly, bypassing the LB's headers and (intended) rate
limiting. Firewall state could not be confirmed (`ufw status` needs interactive sudo).

**LB source IP** (for `allow`): staging LB `eth0` = **`10.3.0.171`**; upstreams sit on the same
`10.3.0.0/8`. Verify with a live capture before adding `deny all`:
`ss -tnH 'sport = :443'` on a web box while curling it through the LB (the prod check confirmed the LB
sources from its `eth0` IPv4).

**Fix (do both):**
- **Source restriction** — in each web `listen 443` block:
  ```nginx
  allow 10.3.0.171;   # s-dokimion.psonet (LB eth0) — verify first
  deny  all;
  ```
  plus a host firewall limiting `:443` to the LB (set `ufw allow 32/tcp` **first** so SSH survives).
- **mTLS** — issue an LB client cert; web servers `ssl_verify_client on; ssl_client_certificate …;`,
  LB adds `proxy_ssl_certificate`/`_key` in `proxy_pass.h`. Roll one node at a time.

### 🔴 H2 — Shared private key on all 3 web boxes, world-readable (`644`) — OPEN (confirmed)
`s-dokimion-staging.key` is **byte-identical** across all three web servers (md5 `931ef2…`, 1704 bytes)
and mode **`-rw-r--r--` (644)**. Any local account on any web box can read the key that authenticates
the whole pool; self-signed with `verify_depth 1` = **no revocation**. (The LB does not hold this key —
good.)

**Fix now (each web box):**
```bash
sudo chown root:root /etc/nginx/sites-available/s-dokimion-staging.key
sudo chmod 600       /etc/nginx/sites-available/s-dokimion-staging.key
```
**Fix structurally:** per-host certs from a small internal CA (LB trusts the CA; each box holds only its
own key; gain revocation).

### 🟠 M1 — Wildcard CORS on the web servers — OPEN
Each web server sets server-level `add_header Access-Control-Allow-Origin *;` and, in `location /api`,
`Access-Control-Allow-Origin "*"` with `GET,PUT,OPTIONS,POST,DELETE`.
**Fix:** reflect a trusted-origin allowlist instead of `*`; narrow methods; drop the blanket
server-level `*` (note: `location`-level `add_header` replaces the inherited server-level header, so
`/api` already emits only its own set, but `location /` still inherits `*`).

### 🟠 M2 — Rate limiting defined but NOT applied — OPEN (worse than prod)
Zones are declared in `load_balancer.conf` (`general` 10r/s, `auth` 5r/m, `conn_limit`) **but
`rate_limiting.h` is empty**, so `location /` applies none of them. Nothing on the path throttles
abuse. (This is the documented Selenium workaround; production has since re-enabled the `general` zone,
staging has not.)
**Fix:** populate `rate_limiting.h` (`limit_req zone=general burst=20 nodelay; limit_conn conn_limit 20;`)
with a verified runner exemption, and apply the `auth` zone (5r/m) to login/sensitive endpoints.

### 🟠 M3 — Web-server TLS unhardened vs. the LB — OPEN
Web `listen 443 ssl` blocks set only `ssl_protocols TLSv1.2 TLSv1.3;` — no `ssl_ciphers`, no session
cache, no `http2`. Low real risk (only the LB connects) but inconsistent.
**Fix:** pin the LB's `ssl_ciphers` list for parity.

### 🟡 L1 — LB redirect double-slash bug — OPEN
`load_balancer.conf` `:80` block: `return 301 https://$host/$request_uri;` → `https://host//path`.
**Fix:** `return 301 https://$host$request_uri;`

### 🟡 L2 — HSTS `preload` set on the LB — OPEN
LB sends `Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;` despite the
inline "remove while testing" note. **Fix:** drop `preload` (and consider lowering `max-age`) on staging.

### 🟡 L3 — Stray / world-readable / user-owned keys on the boxes — OPEN (worse than prod)
- Every web box has **unused per-host certs** left over: `s-dokimionN.psonet.{crt,key,pem}` (mode 644),
  no longer referenced (config uses `s-dokimion-staging.*`).
- **`s-dokimion3` is the worst:** it carries client-facing private keys that have no business on a web
  server — `testing_languagetechnology_org.key` and `test_staging.languagetechnology.org.key` —
  **world-readable (644) and owned by `bob_beck`, not root** (also `nginx_signing.key`, same owner).
- The **LB**'s client-facing `test_staging.languagetechnology.org.key` is also **644 (world-readable)**.
**Fix:** remove the unused per-host and client-facing keys from the web boxes (especially s-dokimion3);
`chown root:root` + `chmod 600` any private key that must stay.

### 🟡 N1 — LB `server_name` mismatch between :443 and :80 — verify
`:443` serves `server_name test_staging.languagetechnology.org;` while the `:80` redirect block serves
`server_name testing.languagetechnology.org;` (the reverse of production). A plain-HTTP request to
`test_staging.languagetechnology.org` may not match the `:80` server and skip the 301.
**Fix:** confirm the HTTP→HTTPS redirect fires for the staging hostname; align the two `server_name`s.

### 🟡 L4 — Web-server config drift — RESOLVED
All three `dokimion_common.conf` are byte-identical. Keep them in sync going forward.

---

## Priority

| # | Severity | Item | Status | Effort |
|---|----------|------|--------|--------|
| H1a | High | `allow/deny` so the backend only trusts the LB | ✅ Deployed 2026-07-27 | — |
| H1b | High | mTLS — install the generated CA/client cert and switch on `ssl_verify_client` | Ready to install (`mtls_h1_deploy.md`) | Low |
| H1c | High | Host firewall limiting `:443` to the LB (defence in depth; `ufw` state still unconfirmed) | Open | Low |
| H2 | High | `chmod 600` + `chown root:root` the shared key on all 3 web boxes; plan internal-CA certs | Open | Low now / Medium later |
| M1 | Medium | Replace wildcard CORS with an origin allowlist; drop server-level `*` | Open | Low |
| M2 | Medium | Populate `rate_limiting.h`; apply the `auth` zone to login endpoints | Open | Low |
| M3 | Medium | Pin `ssl_ciphers` on the web servers | Open | Low |
| L1 | Low | Fix LB redirect double-slash (`$host$request_uri`) | Open | Trivial |
| L2 | Low | Drop HSTS `preload` on the LB | Open | Trivial |
| L3 | Low | Remove unused per-host + client-facing keys; fix ownership/perms (esp. s-dokimion3) | Open | Low |
| N1 | Low | Align LB `server_name` between :80 and :443; verify redirect | Verify | Low |
| L4 | — | Web-server config drift | ✅ Resolved | — |

**Next up (2026-07-27):** H1a is done, so the highest-value remaining items are **H2** (a two-minute
`chmod`/`chown` on three boxes, still untouched) and **H1b** (key material already generated and
verified — just needs the install in `mtls_h1_deploy.md`). Then **M2**: rate limiting is still
entirely off on staging, unlike production. **L3** remains the largest hygiene debt — notably the
client-facing private keys still sitting `644` and owned by `bob_beck` on s-dokimion3.
