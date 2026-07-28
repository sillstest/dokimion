# security_hardening_staging — Load Balancer ↔ Web Server communication (STAGING)

**Scope:** the internal hop between the nginx load balancer and the three nginx web servers, as
**live-deployed on the staging boxes**. Based on the actual running configs (not the repo copies), so
it supersedes the repo-based `security_hardening.md` for the staging environment.

**Live configs analyzed (fetched via SSH on port 32, 2026-07-23):**
- Load balancer: `s-dokimion.psonet:/etc/nginx/sites-available/load_balancer.conf`
  (+ includes `rate_limiting.h`, `certificates.h`, `proxy_pass.h`, `server_name.h`, `http_return.h`, `servers.h`)
- Web servers: `s-dokimion{1,2,3}.psonet:/etc/nginx/sites-available/dokimion_common.conf`

---

## Status — re-verified live on 2026-07-28

| # | Item | Status |
|---|------|--------|
| **H1a** | Source restriction (`allow`/`deny`) on the web servers | ✅ **DEPLOYED & VERIFIED** |
| **H1b** | mTLS (`ssl_verify_client` + LB client cert) | ✅ **LIVE on all 3 nodes & VERIFIED (2026-07-28)** |
| H2 | Shared private key `644` on all 3 web boxes | ✅ **Perms fixed & VERIFIED (2026-07-28)** — `600 root:root` ×3; shared-key/no-revocation deferred |
| M1 | Wildcard CORS | 🟠 Open — unchanged (2 wildcard headers live) |
| M2 | `rate_limiting.h` empty, `auth` zone unapplied | ⏸️ **Deferred by decision (2026-07-28)** — still 1 byte, `zone=auth` used 0× |
| M3 | No `ssl_ciphers` on the web servers | 🟠 Open — unchanged (0 occurrences) |
| L1 | LB redirect double slash | 🟡 Open — unchanged |
| L2 | HSTS `preload` | 🟡 Open — unchanged |
| L3 | Stray / user-owned keys | ✅ Largely resolved 2026-07-28 — see the ⚠️ lesson in the L3 finding |
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

### H1b is LIVE — measured on 2026-07-28

mTLS is enforced on all three staging web servers. The LB presents `lb-client.crt`; each web box
verifies it against `lb-client-ca.crt`. Deployed at commit `f7070f46`.

| Probe | Result |
|---|---|
| through the LB, from 5 vantage points incl. the public hostname | **200** |
| direct to `s-dokimion{1,2,3}` with **no** client cert | **400** `No required SSL certificate was sent` |
| from the LB, presenting `lb-client.crt`, to each of the 3 nodes | **200** |
| CA name each node advertises in the handshake (`openssl s_client`) | `CN = Dokimion staging LB Client CA, O = SIL` |
| `lb-client-ca.crt` on all 3 boxes | identical, sha256 `e23f8012…` |

That fourth row matters: it proves Phase 3 installed *the right* CA rather than merely some CA, which
a 400/200 response code alone cannot distinguish.

Note the change in failure mode: unauthorised direct requests now return **400**, not the **403** that
`lb_access.h` produced on its own, because `ssl_verify_client` is evaluated before the access phase.
Both controls remain active — the certificate check simply fires first. A `403` from any node would now
indicate mTLS had silently stopped enforcing there.

**Production remains deliberately inert** — those boxes have no CA installed, and enabling
`ssl_verify_client` there would stop nginx from starting. Do not enable until production's own Phase 3.

The client-auth CA and LB client certificate were generated **on 2026-07-27, on the load balancer
itself**, so no private key crossed the network. The CA key now lives root-only in
`/etc/nginx/internal-ca` on the LB (`~bob_beck/lb-mtls/ca.key` was shredded after install):

- CA `Dokimion staging LB Client CA`, RSA 4096, `pathlen:0`, expires 2036-07-25
- Client `CN=s-dokimion.psonet`, RSA 2048, `extendedKeyUsage = critical,clientAuth`,
  serial `75D002BD0D16B786`, expires **2029-07-26**
- Verified: `openssl verify -purpose sslclient` OK; key matches cert; a real
  `openssl s_server -Verify 1` handshake **accepts** the cert and **refuses** its absence
  (`alert certificate required`, alert 116); production's cert does **not** validate against this CA.

Installation and cut-over steps, now all complete for staging: **`mtls_h1_deploy.md`**.

### 🔴 Known casualty — the Selenium suite is BROKEN as of 2026-07-28

`Dokimion_Tests/.runsettings` line 16 sets `Url = http://s-dokimion3.psonet`, targeting a web box
directly. That 301s to `:443` and now receives **400**.

**Adding the runner's IP to `lb_access.h` will NOT fix this.** `ssl_verify_client` is evaluated before
the access phase, so the certificate check rejects the runner before any `allow` rule is consulted. The
options are:

- **repoint the suite at the load balancer** (`https://s-dokimion.psonet`, or the public
  `test_staging.languagetechnology.org`) — the only fix that needs no new key material. Note it crosses
  `ip_hash`, so the suite no longer pins to a single node; or
- **issue the test runner its own client certificate** from the LB client CA, and configure the suite to
  present it — preserves direct single-node targeting, at the cost of another certificate to manage.

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

### ✅ H1 — The LB can be bypassed; web servers don't authenticate the LB — **BOTH HALVES RESOLVED**
> **2026-07-28:** fully closed on staging. H1a (source restriction) deployed 2026-07-27; H1b (mTLS)
> live on all three nodes 2026-07-28 at commit `f7070f46`. Both are verified live under Status above.
> The internal hop is now authenticated in both directions: the LB verifies the upstream cert, and each
> web server verifies the LB's client cert. **H1c** (host firewall, defence in depth) is deferred by
> decision. The original finding text follows, for history.

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

### ✅ H2 — Shared private key was world-readable (`644`) — PERMISSIONS FIXED 2026-07-28
> **Resolved:** `chown root:root` + `chmod 600` applied on all three web boxes. Verified live —
> `mode=600 owner=root:root` on `s-dokimion{1,2,3}`, and reading the file as `bob_beck` now returns
> **Permission denied** on all three (tested, not inferred). nginx is unaffected: it reads the key as
> root at startup. All three still `active`, still enforcing mTLS (`400` direct), site `200` via the LB.

The original finding: `s-dokimion-staging.key` was **byte-identical** across all three web servers
(md5 `931ef2…`, 1704 bytes) at mode **`-rw-r--r--` (644)**, so any local account on any web box could
read the key that authenticates the whole pool.

**Still open — the structural half (deliberately deferred):** it remains **one shared key across three
hosts**, self-signed, used with `proxy_ssl_verify_depth 1`, so there is **no revocation path**. Root on
any one web box still means the whole pool's identity. The fix is per-host certs from a small internal
CA — the LB trusts the CA, each box holds only its own key. Lower priority now that the key is no
longer readable by unprivileged local accounts, and that the LB→web hop is separately authenticated by
H1b's mTLS, but the blast radius of a single-box root compromise is unchanged.

### 🟠 M1 — Wildcard CORS on the web servers — OPEN
Each web server sets server-level `add_header Access-Control-Allow-Origin *;` and, in `location /api`,
`Access-Control-Allow-Origin "*"` with `GET,PUT,OPTIONS,POST,DELETE`.
**Fix:** reflect a trusted-origin allowlist instead of `*`; narrow methods; drop the blanket
server-level `*` (note: `location`-level `add_header` replaces the inherited server-level header, so
`/api` already emits only its own set, but `location /` still inherits `*`).

### ⏸️ M2 — Rate limiting defined but NOT applied — DEFERRED BY DECISION (2026-07-28)
> **Deferred, not resolved.** Owner's call on 2026-07-28: leave as-is for now. Re-verified still open at
> that date (`rate_limiting.h` = 1 byte, `zone=auth` used 0×). Recorded here so a later reader does not
> mistake the state for an oversight. The staging environment currently has **no request throttling at
> all** — this is a known, accepted gap, not a finished item.

Zones are declared in `load_balancer.conf` (`general` 10r/s, `auth` 5r/m, `conn_limit`) **but
`rate_limiting.h` is empty**, so `location /` applies none of them. Nothing on the path throttles
abuse. (This is the documented Selenium workaround; production has since re-enabled the `general` zone,
staging has not.)
**Fix when picked up:** populate `rate_limiting.h`
(`limit_req zone=general burst=20 nodelay; limit_conn conn_limit 20;`) with a verified runner exemption,
and apply the `auth` zone (5r/m) to login/sensitive endpoints.

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

### ✅ L3 — Stray / world-readable / user-owned keys on the boxes — LARGELY RESOLVED 2026-07-28
> **Resolved:** the unused per-host certs and the stray client-facing keys were removed from the web
> boxes on 2026-07-28, and the shared key is now `600 root:root` everywhere (see H2). Verified: no
> `*.psonet.{crt,key,pem}` per-host leftovers and no `languagetechnology` keys remain in
> `sites-available` on any web box.
>
> **⚠️ Lesson from this cleanup — read before deleting key material again.** The LB's
> `test_staging.languagetechnology.org.{pem,key}` was swept up as "unused". It was **not** unused: it is
> the live client-facing keypair the LB serves. nginx had it loaded in memory, so nothing broke visibly
> and the site kept returning 200 — but `certificates.h` then referenced two nonexistent files, so
> `nginx -t` would fail and the box **could not have survived a restart or reboot**. It was recovered
> from `~bob_beck/dokimion_private/` on the LB (a private git repo, the de facto backup of record) and
> is now `600 root:root`. Before deleting a key, check what the *running* config references, not only
> what a file you happen to be reading references — and prefer `chmod 600` over `rm` for anything
> client-facing.
>
> Still present and harmless: `nginx_signing.key` on s-dokimion3 (an apt repo **public** signing key,
> not a private key, though `bob_beck`-owned in `/etc/nginx` is untidy), and a second copy of the
> `testing.languagetechnology.org` keypair at `/etc/nginx/snippets/` on s-dokimion1, referenced only by
> the dead `snippets/self-signed.conf`.
>
> The original finding text follows.
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
| H1b | High | mTLS — CA/client cert installed, `ssl_verify_client` on across all 3 nodes | ✅ **Live 2026-07-28** (`f7070f46`) | — |
| H1c | High | Host firewall limiting `:443` to the LB (defence in depth; `ufw` state still unconfirmed) | ⏸️ Deferred by decision 2026-07-28 | Low |
| H2 | High | `chmod 600` + `chown root:root` the shared key on all 3 web boxes | ✅ Done & verified 2026-07-28 | — |
| H2b | Medium | Replace the one shared self-signed key with per-host internal-CA certs (gains revocation) | Open — structural half of H2 | Medium |
| M1 | Medium | Replace wildcard CORS with an origin allowlist; drop server-level `*` | Open | Low |
| M2 | Medium | Populate `rate_limiting.h`; apply the `auth` zone to login endpoints | ⏸️ Deferred by decision 2026-07-28 | Low |
| M3 | Medium | Pin `ssl_ciphers` on the web servers | Open | Low |
| L1 | Low | Fix LB redirect double-slash (`$host$request_uri`) | Open | Trivial |
| L2 | Low | Drop HSTS `preload` on the LB | Open | Trivial |
| L3 | Low | Remove unused per-host + client-facing keys; fix ownership/perms | ✅ Largely resolved 2026-07-28 | — |
| N1 | Low | Align LB `server_name` between :80 and :443; verify redirect | Verify | Low |
| L4 | — | Web-server config drift | ✅ Resolved | — |

**Next up (2026-07-28):** **H1 and H2 are both closed on staging.** The internal hop is authenticated in
both directions, and the shared upstream key is no longer readable by unprivileged local accounts.

**Deferred by owner decision on 2026-07-28 — not oversights:**
- **M2** (rate limiting) — staging has **no request throttling at all**. Accepted gap.
- **H1c** (host firewall limiting `:443` to the LB) — defence in depth behind two controls that are both
  now verified working, so the marginal gain is smaller than it was.

**Actually next, in order:**

1. **The Selenium suite** — broken by the H1b rollout (see "Known casualty" above). Not a hardening
   item, but it blocks test feedback, and the intuitive fix (an `lb_access.h` IP exemption) does **not**
   work, because `ssl_verify_client` is evaluated first. This is the only item causing active breakage.
2. **M1** (wildcard CORS) — `Access-Control-Allow-Origin *` still live at server level and in
   `location /api`. The largest remaining item with real exposure, and low effort.
3. **M3** (pin `ssl_ciphers` on the web servers), **L1** (LB redirect double slash), **L2** (drop HSTS
   `preload` on staging) — all trivial, and L1/L2 are one-line changes.
4. **N1** — confirm the HTTP→HTTPS redirect fires for the staging hostname and align the two
   `server_name`s. Note H1b's replacement cert now covers both `*.languagetechnology.org` and the apex,
   so the certificate side of this mismatch is no longer a problem — only the redirect logic is.
5. **H2b** (structural) — still one shared self-signed key across three hosts with **no revocation
   path**. Root on any one web box still compromises the pool's identity. Deferred, not fixed.

**Production is untouched and must not be assumed to match staging.** It has neither the part 1
includes nor a CA, all findings remain open there, and its `certificates.h` still points at
`testing_languagetechnology_org.{pem,key}`. See `security_hardening_production.md` and run
`mtls_h1_deploy.md` from Phase -1 with production's own key material.
