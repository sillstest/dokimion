# security_hardening_staging — Load Balancer ↔ Web Server communication (STAGING)

**Scope:** the internal hop between the nginx load balancer and the three nginx web servers, as
**live-deployed on the staging boxes**. Based on the actual running configs (not the repo copies), so
it supersedes the repo-based `security_hardening.md` for the staging environment.

**Live configs analyzed (fetched via SSH on port 32, 2026-07-23):**
- Load balancer: `s-dokimion.psonet:/etc/nginx/sites-available/load_balancer.conf`
  (+ includes `rate_limiting.h`, `certificates.h`, `proxy_pass.h`, `server_name.h`, `http_return.h`, `servers.h`)
- Web servers: `s-dokimion{1,2,3}.psonet:/etc/nginx/sites-available/dokimion_common.conf`

---

## Status — M1, M3, L2 and L1 all deployed & verified live 2026-08-03; the rest 2026-07-28

> **Staging is now ahead of production.** M3 and L2 are live on staging but **not** on production — the
> production web boxes are still at `dokimion_common.conf` md5 `6b88c34b` and the production LB still
> sends HSTS `preload`. Both use the same shared repo files, so production needs only the install +
> reload. See "Production — no longer untouched, but no longer matching staging either" at the end of
> this file.

| # | Item | Status |
|---|------|--------|
| **H1a** | Source restriction (`allow`/`deny`) on the web servers | ✅ **DEPLOYED & VERIFIED** |
| **H1b** | mTLS (`ssl_verify_client` + LB client cert) | ✅ **LIVE on all 3 nodes & VERIFIED (2026-07-28)** |
| H2 | Shared private key `644` on all 3 web boxes | ✅ **Perms fixed & VERIFIED (2026-07-28)** — `600 root:root` ×3; shared-key/no-revocation deferred |
| M1 | Wildcard CORS | ✅ **RESOLVED & VERIFIED LIVE (2026-08-03)** — all 3 boxes at gold md5 `6b88c34b`, reloaded; no `Access-Control-Allow-Origin` for untrusted origins, trusted origins echoed. See the finding |
| M2 | `rate_limiting.h` empty, `auth` zone unapplied | ⏸️ **Deferred by decision (2026-07-28)** — still 1 byte, `zone=auth` used 0× |
| M3 | No `ssl_ciphers` on the web servers | ✅ **RESOLVED & VERIFIED LIVE (2026-08-03)** — LB's cipher list pinned on all 3 boxes; an unapproved suite is now **refused** (handshake failure, alert 40), an approved one negotiates. Gold md5 `a2e5a750` |
| L1 | LB redirect double slash | ✅ **RESOLVED & VERIFIED LIVE (2026-08-03)** — single slash, query string intact, tested via LB loopback. Came in with the L2 deploy |
| L2 | HSTS `preload` | ✅ **RESOLVED & VERIFIED LIVE (2026-08-03)** — LB now sends `max-age=31536000; includeSubDomains`, no `preload`, confirmed both direct and through Cloudflare. LB md5 `3038a533` |
| L3 | Stray / user-owned keys | ✅ Largely resolved 2026-07-28 — see the ⚠️ lesson in the L3 finding |
| N1 | LB `server_name` :80 vs :443 mismatch | 🟡 Open, **downgraded 2026-08-03 — the feared breakage does not occur.** The `:80` redirect fires for *both* hostnames (it is the LB's only `:80` block, hence the default server). Latent, not live — same conclusion production reached 2026-07-29 |
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

- **Web-server drift resolved** (was L4): all three deployed `dokimion_common.conf` are
  **byte-identical**, each with the websocket `Upgrade`/`Connection` block. The repo now keeps a single
  copy at `config/production/dokimion1/dokimion_common.conf` serving both environments, so drift cannot
  recur.
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

### ✅ M1 — Wildcard CORS on the web servers — RESOLVED & VERIFIED LIVE 2026-08-03

> ### ✅ Closed 2026-08-03 — deployed to all three boxes and measured
>
> All three staging web boxes now run the gold `dokimion_common.conf`, md5 **`6b88c34b`**, with workers
> restarted after the install (`s-dokimion2` 17:21 UTC, `s-dokimion1` 17:25, `s-dokimion3` 17:28).
>
> Behaviour through the LB, at the public hostname:
>
> | Probe | Result |
> |---|---|
> | `/` with `Origin: https://evil.example.com` | **no** `Access-Control-Allow-Origin` header |
> | `/` with a trusted origin | **no** CORS header either — by design, see below |
> | `OPTIONS /api/launcher` with `Origin: https://evil.example.com` | **200**, `Vary: Origin`, **no** ACAO |
> | `OPTIONS /api/launcher` with `Origin: https://test_staging.languagetechnology.org` | **200**, `access-control-allow-origin: https://test_staging.languagetechnology.org` |
> | LB probed from each of `s-dokimion{1,2,3}` (3 source IPs) | no ACAO for an untrusted origin, ×3 |
>
> Two notes for whoever re-verifies this, because the obvious probe reports a false failure:
>
> - **`location /` never emits a CORS header, for any origin.** Its `proxy_hide_header` strips all three
>   unconditionally; the allowlist lives only in `location /api`. Testing the allowlist against `/` looks
>   like the `map` is broken when it is working.
> - **`add_header` does not fire on 4xx without `always`.** Unauthenticated `/api` paths return 401/404,
>   so they carry no ACAO regardless of origin. Only a 2xx/3xx response tests the `map` — hence the
>   `OPTIONS` preflight above, which returns 200.
>
> #### What the deploy actually fixed
>
> The fix had been *partially* deployed since 2026-07-28 and nobody noticed: `s-dokimion2`/`3` carried
> parts 1 + 2 (md5 `474edcbb`, 169 lines) while **`s-dokimion1` had part 1 only** (md5 `3c6cbba8`, 158
> lines — missing the 11-line `proxy_hide_header` block from `28b05893`). All three *were* running their
> on-disk config, so this was a content gap, not a missing reload. `s-dokimion1` was the single source of
> the `*` still being served publicly, for six days.
>
> **The wildcard never came from nginx's own `add_header`** — the server-level blanket `*` was already gone
> from all three boxes. It came from the UI upstream: `curl -H 'Origin: …' http://127.0.0.1:3000/` returns
> `Access-Control-Allow-{Origin,Methods,Headers}: *` on all three boxes, and nginx passes upstream headers
> through untouched. That is why part 2 (`proxy_hide_header`) is the load-bearing half, and why the box
> missing it leaked while its peers did not. The LB's own config contains no `Access-Control` directive at
> all.
>
> `fd9b3f8f` (2026-07-29), which added `"https://dokimion.psonet" $http_origin;` to the `map`, went out
> with this deploy. It changes nothing on staging — it exists so the shared file is safe on a production
> box.
>
> #### 🛑 Two probes that CANNOT verify this, and both read as passes
>
> 1. **"Check through the LB" cannot target a chosen box.** nginx's `ip_hash` buckets IPv4 by the *first
>    three octets*, and the LB (`10.3.0.171`/`.172`) and all three web boxes (`10.3.0.199`, `.72`, `.236`)
>    fall in one bucket — so every vantage point on this network pins to the same upstream. Before the
>    deploy, four probes from four addresses all returned `*`; identifying `s-dokimion1` as the culprit
>    took a config diff, not a probe. To test a *specific* box you need a different `/24` or item 2.
> 2. **The runbook's per-box `--cert` probe needs a password.** `sudo` is not passwordless on the LB or any
>    web box, so `sudo curl --cert …/lb-client.key` produces *no output at all* under a non-interactive
>    shell. Piped into `grep … || echo "(no header)"` that reads as a clean pass. Run it interactively, or
>    check `${PIPESTATUS[0]}`.
>
> #### Lessons recorded elsewhere in this file
>
> - **L4** — one repo copy prevents *repo* drift, not *deploy* drift. Verify the live md5 on all three
>   boxes after every deploy; a single source file is not evidence three servers received it.
> - ⚠️ **This file is shared with production.** It is the single
>   `config/production/dokimion1/dokimion_common.conf`, so the production boxes are now the ones whose
>   live copies may lag the gold file. See `security_hardening_production.md`, M1.
>
> ---
>
> *Original finding, and the state as of 2026-07-28 — both superseded by the box above:*
>
> Each web server sets server-level `add_header Access-Control-Allow-Origin *;` and, in `location /api`,
> `Access-Control-Allow-Origin "*"` with `GET,PUT,OPTIONS,POST,DELETE`.
> **Fix:** reflect a trusted-origin allowlist instead of `*`; narrow methods; drop the blanket
> server-level `*` (note: `location`-level `add_header` replaces the inherited server-level header, so
> `/api` already emits only its own set, but `location /` still inherits `*`).
>
> `dokimion_common.conf` at HEAD carries a `map $http_origin $cors_origin` allowlist (untrusted origins
> get *no* `Access-Control-Allow-Origin` header at all), the server-level blanket `*` deleted, and
> `proxy_hide_header` on `Access-Control-Allow-{Origin,Methods,Headers}` in `location /` — that last part
> was necessary because the UI upstream on `:3000` sets its own wildcards and nginx passes upstream
> headers through untouched, so the nginx-side fix alone left `curl -H 'Origin: https://evil.example.com'`
> still getting `*`. Commits `ed8cc604`, `96cb8910`, `28b05893`, all after `f7070f46`.

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

### ✅ M3 — Web-server TLS unhardened vs. the LB — RESOLVED & VERIFIED LIVE 2026-08-03
> **Deployed to all three staging web boxes** (gold md5 `a2e5a750`), workers reloaded. The shared
> `dokimion_common.conf` now pins the LB's exact `ssl_ciphers` list plus `ssl_prefer_server_ciphers off`
> in the `listen 443` block.
>
> **Verified by refusal, not just by presence** — the load-bearing check, since a cipher line that is
> present but ineffective looks identical to one that works:
>
> | Probe (per box, ×3) | Result |
> |---|---|
> | `openssl s_client -tls1_2 -cipher ECDHE-RSA-AES256-GCM-SHA384` | negotiates — `Cipher is ECDHE-RSA-AES256-GCM-SHA384` |
> | `openssl s_client -tls1_2 -cipher AES128-SHA` (not on the list) | **refused** — `sslv3 alert handshake failure`, alert 40 |
>
> No collateral damage: 12 × `200` through the LB, mTLS still enforcing (`400` direct on all three), and
> the M1 CORS allowlist still behaves (untrusted origin gets no ACAO, trusted origin echoed).
>
> Two notes for anyone revisiting this:
> - **`ssl_ciphers` does not govern TLS 1.3.** TLS 1.3 suites are chosen separately (`ssl_conf_command
>   Ciphersuites`), so this pin constrains TLS 1.2 only. That is the intended scope — TLS 1.3's suites are
>   all acceptable — but do not read the pin as covering both protocols.
> - **`http2` and session caching are still absent** on the web servers, unlike the LB. Left alone
>   deliberately: only the LB connects, over keepalive connections, so neither would buy anything.
>
> ⚠️ **Production not yet deployed** — `dokimion{1,2,3}` are still on md5 `6b88c34b` with no `ssl_ciphers`.
> Same shared file; it needs only install + reload.
>
> The original finding follows.

Web `listen 443 ssl` blocks set only `ssl_protocols TLSv1.2 TLSv1.3;` — no `ssl_ciphers`, no session
cache, no `http2`. Low real risk (only the LB connects) but inconsistent.
**Fix:** pin the LB's `ssl_ciphers` list for parity.

### ✅ L1 — LB redirect double-slash bug — RESOLVED & VERIFIED LIVE 2026-08-03
> **Fixed as a side effect of the L2 deploy.** `load_balancer.conf` is a single shared file, and
> production had already fixed L1 on 2026-07-29 (`44d35fb8`); the staging LB was simply running an older
> copy. Installing the shared file brought the fix along, so one reload closed both L1 and L2.
>
> **Verified via the LB's loopback**, because `ufw` on the staging LB drops inbound `:80` (see the ufw note
> under H1c) and public HTTP terminates at Cloudflare — so the `:80` block is unreachable from off-box and
> cannot be tested the obvious way:
>
> ```
> # on s-dokimion.psonet
> curl -H 'Host: testing.languagetechnology.org' http://127.0.0.1/deep/path?q=1
> -> 301 https://testing.languagetechnology.org/deep/path?q=1     # single slash, query intact
> ```
>
> Both hostnames were tested and both redirect correctly — which is also what downgrades N1 (below).
>
> The original finding: `:80` block had `return 301 https://$host/$request_uri;` → `https://host//path`.
> **Fix applied:** `return 301 https://$host$request_uri;`

### ✅ L2 — HSTS `preload` set on the LB — RESOLVED & VERIFIED LIVE 2026-08-03
> **Deployed to the staging LB** (md5 `3038a533`), reloaded. The header is now
> `max-age=31536000; includeSubDomains` — confirmed **both** directly at `https://s-dokimion.psonet` and
> through Cloudflare at the public hostname, which matters because a difference between those two would
> have meant Cloudflare was injecting the header and the LB-side fix was cosmetic. It wasn't; the header
> originates at the LB and Cloudflare passes it through.
>
> `max-age` and `includeSubDomains` were deliberately **kept**: they are the parts that actually enforce
> HTTPS and both are reversible by editing one line. `preload` is the part that gets baked into browser
> binaries, and with `includeSubDomains` it would have bound every host under `languagetechnology.org`,
> staging included. Only re-add it as a deliberate decision to submit the domain at hstspreload.org.
>
> ⚠️ **Production not yet deployed** — `testing.languagetechnology.org` still sends `preload` as of
> 2026-08-03. It is the *production* hostname, so per `security_hardening_production.md` L2 this is the
> more consequential of the two. Same shared file; install + reload.
>
> The original finding: LB sent
> `Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;` despite the inline
> "remove while testing" note.

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

### 🟡 N1 — LB `server_name` mismatch between :443 and :80 — OPEN, **downgraded 2026-08-03**
> **The feared breakage does not occur — measured, not assumed.** The `:80` redirect fires for *both*
> hostnames, because the `:80` block is the LB's **only** one and is therefore the default server, so it
> matches any `Host`. Tested via loopback (see L1): both `testing.languagetechnology.org` and
> `test_staging.languagetechnology.org` return a correct single-slash 301. Same conclusion production
> reached on 2026-07-29.
>
> Still real and still worth aligning, but **latent, not live**. It becomes live the moment a second `:80`
> server block is added to the LB, at which point the default-server accident stops covering for it. Note
> also that staging's `:80` is unreachable from off-box today (`ufw` drops it, Cloudflare fronts public
> HTTP), so present exposure is nil.
>
> The original finding follows.

`:443` serves `server_name test_staging.languagetechnology.org;` while the `:80` redirect block serves
`server_name testing.languagetechnology.org;` (the reverse of production). A plain-HTTP request to
`test_staging.languagetechnology.org` may not match the `:80` server and skip the 301.
**Fix:** confirm the HTTP→HTTPS redirect fires for the staging hostname; align the two `server_name`s.

### 🟡 L4 — Web-server config drift — repo drift RESOLVED; **deploy drift recurred and was re-closed** 2026-08-03
> ⚠️ **Corrected 2026-08-03.** The claim below that drift "cannot recur" is too strong. One repo copy
> prevents *repo* drift; it does nothing about *deploy* drift. On 2026-08-03 the three live
> `dokimion_common.conf` were **not** byte-identical — `s-dokimion1` was 11 lines and one commit behind
> `s-dokimion2`/`3`, and had been for six days (md5 `3c6cbba8` vs `474edcbb`). That gap was the whole of
> the still-open half of M1, and no alarm surfaced it: each box's nginx was healthy, its own config valid,
> and its workers current. Re-closed the same day — all three now md5 `6b88c34b`.
>
> **Verify the live md5 on all three boxes after every deploy**; a single source file is not evidence that
> three servers received it. The drift is invisible from any single box and, under `ip_hash`, invisible
> from any single client too.

All three deployed `dokimion_common.conf` are byte-identical, and the repo no longer carries per-host
copies to keep in sync: there is exactly one, `config/production/dokimion1/dokimion_common.conf`, used
by all six web servers (`s-dokimion{1,2,3}` and `dokimion{1,2,3}`). Edit only that file — a change
there reaches staging *and* production.

---

## Priority

| # | Severity | Item | Status | Effort |
|---|----------|------|--------|--------|
| H1a | High | `allow/deny` so the backend only trusts the LB | ✅ Deployed 2026-07-27 | — |
| H1b | High | mTLS — CA/client cert installed, `ssl_verify_client` on across all 3 nodes | ✅ **Live 2026-07-28** (`f7070f46`) | — |
| H1c | High | Host firewall limiting `:443` to the LB (defence in depth) | ⏸️ Deferred 2026-07-28, but **cheaper now** — `ufw` state is no longer unconfirmed: **enabled on the staging LB**, `ENABLED=no` on all 3 web boxes. See the ufw note below | Low |
| H2 | High | `chmod 600` + `chown root:root` the shared key on all 3 web boxes | ✅ Done & verified 2026-07-28 | — |
| H2b | Medium | Replace the one shared self-signed key with per-host internal-CA certs (gains revocation) | Open — structural half of H2 | Medium |
| M1 | Medium | Replace wildcard CORS with an origin allowlist; drop server-level `*` | ✅ **Done & verified live 2026-08-03** — all 3 boxes at gold md5 `6b88c34b` | — |
| M2 | Medium | Populate `rate_limiting.h`; apply the `auth` zone to login endpoints | ⏸️ Deferred by decision 2026-07-28 | Low |
| M3 | Medium | Pin `ssl_ciphers` on the web servers | ✅ **Done & verified live 2026-08-03** — md5 `a2e5a750` ×3; unapproved suite refused | — |
| L1 | Low | Fix LB redirect double-slash (`$host$request_uri`) | ✅ **Done & verified live 2026-08-03** — arrived with the L2 deploy (shared file) | — |
| L2 | Low | Drop HSTS `preload` on the LB | ✅ **Done & verified live 2026-08-03** — LB md5 `3038a533` | — |
| L3 | Low | Remove unused per-host + client-facing keys; fix ownership/perms | ✅ Largely resolved 2026-07-28 | — |
| N1 | Low | Align LB `server_name` between :80 and :443 | Open — **downgraded**, redirect verified working for both hostnames 2026-08-03; latent not live | Low |
| L4 | — | Web-server config drift | ✅ Repo drift resolved; deploy drift recurred and was re-closed 2026-08-03 | — |

**Next up (2026-08-03): every non-deferred hardening item on staging is now closed.** H1, H2 (perms), M1,
M3, L1, L2 and L3 are all deployed and verified live; N1 is downgraded to latent. What remains on staging
is only what was deliberately deferred (M2, H1c) plus the structural H2b — and **production, which now
lags staging on M3 and L2.**

**Deferred by owner decision — not oversights:**
- **M2** (rate limiting) — staging has **no request throttling at all**. Accepted gap, re-confirmed
  2026-08-03. With everything else closed, this is now **the largest remaining exposure on staging.**
- **H1c** (host firewall limiting `:443` to the LB) — see the ufw note directly below; the cost has
  dropped since this was deferred.

### `ufw` state — measured 2026-08-03, and it changes H1c's price

`ufw` is **enabled and active on the staging LB** (`ENABLED=yes`), from the `ufw_lb.sh` work committed
2026-07-30 (`0102733f`) — SSH/32 and 443 only, default-deny inbound, with a dead-man's-switch
auto-rollback after an earlier attempt locked SSH out. Neither this file nor the production doc recorded
it. Two consequences already visible: the LB's `:80` is unreachable from off-box (which is why L1 and N1
had to be verified over loopback), and **staging and production now differ** — the production LB is
`ENABLED=no`.

**H1c is untouched, and the script does not cover it.** `ufw` is `ENABLED=no` on all three staging web
boxes, and `ufw_lb.sh` is scope-guarded to `s-dokimion` — it refuses to run anywhere else. H1c is a
firewall on the *web* boxes limiting `:443` to the LB, which is a different thing from the LB's own
firewall. But the risky part is now solved: the rollback pattern that survived a real lockout exists and
is proven, so adapting it to the web boxes is materially cheaper than when H1c was deferred on
marginal-gain grounds. Worth reconsidering ahead of H2b.

**Actually next, in order:**

1. **Production M3 + L2** — the only place where a *closed* staging finding is still open in production.
   Both are the same shared repo files, already correct at HEAD, so this is install + reload on
   `dokimion{1,2,3}` (web, md5 `a2e5a750`) and `dokimion.psonet` (LB, md5 `3038a533`). L2 matters more
   here than it did on staging: `testing.languagetechnology.org` is the production hostname, and it is
   still advertising HSTS `preload`.
2. **The Selenium suite** — broken by the H1b rollout (see "Known casualty" above). Not a hardening item,
   but it blocks test feedback, and the intuitive fix (an `lb_access.h` IP exemption) does **not** work,
   because `ssl_verify_client` is evaluated first. The only item causing active breakage.
3. **H1c** — reconsider, per the ufw note above.
4. **N1** — align the two `server_name`s. Downgraded to latent (the redirect works for both hostnames),
   so this is tidiness. H1b's replacement cert covers both `*.languagetechnology.org` and the apex, so
   the certificate side is already a non-issue.
5. **H2b** (structural) — still one shared self-signed key across three hosts with **no revocation path**.
   Root on any one web box still compromises the pool's identity. Deferred, not fixed.

## Production — no longer "untouched", but no longer matching staging either

> 🛑 **This section previously read "Production is untouched … it has neither the part 1 includes nor a
> CA, all findings remain open there." That is long out of date and was wrong to leave standing.**
> Production completed H1a and H1b on 2026-07-29 (`mtls_h1_deploy.md`): the part 1 includes are installed,
> the production CA is in place, and mTLS is enforced on `dokimion{1,2,3}`. M1 is closed there too —
> verified 2026-08-03, all three web boxes at md5 `6b88c34b` with the CORS allowlist behaving correctly.

The direction of the gap has now **reversed**: staging is ahead. As of 2026-08-03 production is missing

| Item | Production state | Fix |
|---|---|---|
| **M3** | `dokimion{1,2,3}` still at md5 `6b88c34b`, no `ssl_ciphers` | install the shared web file (md5 `a2e5a750`) + reload |
| **L2** | `dokimion.psonet` still sends HSTS `preload` on the production hostname | install the shared LB file (md5 `3038a533`) + reload |

Both are the same shared repo files staging already runs, correct at HEAD — no new authoring, only
install + reload. L1 is already fixed on production (`44d35fb8`, 2026-07-29), which is *why* installing
the shared LB file on staging closed L1 there for free.

Still open on production and **not** mirrored from staging: its own L3 (world-readable client-facing key
on the LB), N1, and `ufw` (`ENABLED=no` on the production LB, where staging's is enabled). See
`security_hardening_production.md` for those.
