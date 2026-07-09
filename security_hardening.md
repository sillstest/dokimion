# security_hardening — Load Balancer ↔ Web Server communication

**Scope:** the internal hop between the nginx load balancer and the three nginx web servers.
Analyzed configs:
- Load balancer: `config/staging/s-dokimion/load_balancer.conf`
- Web servers:   `config/staging/s-dokimion1/dokimion1.conf`, `.../s-dokimion2/dokimion2.conf`, `.../s-dokimion3/dokimion3.conf`

This picks up where `https_upgrade.md` left off: the hop is now encrypted (TLS 1.2/1.3) and the LB
authenticates the upstreams (`proxy_ssl_verify on`). The items below harden that channel further.

---

## Current posture (already solid — do not regress)

- TLS 1.2/1.3 enforced in both directions; older protocols refused.
- LB **authenticates** the upstream: `proxy_ssl_verify on`, `proxy_ssl_verify_depth 1` against the
  shared SAN anchor `s-dokimion-staging.crt` (correct for a self-signed leaf).
- Web servers are HTTPS-only with a clean HTTP→HTTPS 301 (path + query preserved, single slash).
- The previously-plaintext LB→web hop is encrypted and verified end-to-end.

---

## Findings, by severity

### 🔴 H1 — The LB can be bypassed; web servers don't authenticate the LB
The web servers `listen 443 ssl` on `0.0.0.0` with **no `allow/deny`** and **no `ssl_verify_client`**
(mTLS). TLS trust is **one-way**: the LB verifies the web server, but the web server accepts any
client. Any host that can route to `s-dokimionN.psonet:443` reaches the app **directly**, bypassing
the LB's rate limiting, security headers, and the Cloudflare/WAF layer in front of the LB.

Compounding: with no source restriction, a direct attacker can forge `X-Forwarded-For` / `X-Real-IP`
(the web servers pass these straight to `127.0.0.1:3000/8080` without resetting them), poisoning app
logs or any IP-based logic.

**Fix (ideally both):**
- **mTLS** — on each web server:
  ```nginx
  ssl_verify_client on;
  ssl_client_certificate /etc/nginx/sites-available/lb-client-ca.crt;  # cert/CA the LB presents
  ```
  on the LB (in `location /`):
  ```nginx
  proxy_ssl_certificate     /etc/nginx/sites-available/lb-client.crt;
  proxy_ssl_certificate_key /etc/nginx/sites-available/lb-client.key;
  ```
  Makes "only the LB may connect" cryptographic and completes the symmetric trust.
- **Source restriction** — in each web `server {}` block:
  ```nginx
  allow <LB_IP>;
  deny  all;
  ```
  plus a host firewall (ufw) limiting `:443` to the LB. Cheap defense-in-depth even with mTLS.

### 🔴 H2 — Shared private key across all 4 boxes: wide blast radius + world-readable
One SAN cert+key lives on the LB **and** all three web servers. Compromise of *any one* box leaks the
key that authenticates the *entire* pool, and being self-signed with `verify_depth 1` there is **no
revocation** — remediation is re-issuing on all 4 boxes. The key file is currently mode **`644`
(world-readable)**; any local account can read it.

**Fix now (all four boxes):**
```bash
sudo chown root:root /etc/nginx/sites-available/s-dokimion-staging.key
sudo chmod 600       /etc/nginx/sites-available/s-dokimion-staging.key
```
**Fix structurally:** move to **per-host certs signed by a small internal CA** (the plan's Step 3
"catch"). The LB then trusts the CA, each web server holds only its own key (single-box compromise ≠
pool-wide), and you gain revocation. Trade-off: `proxy_ssl_name` must vary per upstream, or keep one
SAN cert and accept the shared-key risk.

### 🟠 M1 — Wildcard CORS on the API
`location /api` sends `Access-Control-Allow-Origin "*"` with `GET,PUT,OPTIONS,POST,DELETE`, and the
server-level `add_header Access-Control-Allow-Origin *` covers `location /`. Any web origin can invoke
the API from a victim's browser; if auth uses bearer tokens (not cookies) this is real cross-origin
data exposure.
**Fix:** reflect an allowlist of trusted origins instead of `*`; narrow methods to those actually used.

### 🟠 M2 — Rate limiting entirely disabled at the LB
All `limit_req`/`limit_conn` are commented out (documented Selenium workaround) and the web servers
have none, so **nothing** on the path throttles abuse or floods reaching the backend.
**Fix:** re-enable with a verified runner exemption, or at minimum apply the stricter `auth` zone
(already defined, 5r/m) to login/sensitive endpoints.

### 🟠 M3 — Web-server TLS unhardened vs. the LB
The `listen 443 ssl` blocks set only `ssl_protocols`; no `ssl_ciphers`, no session cache, no `http2`.
They rely on nginx defaults. Low risk (the only client is the LB) but inconsistent.
**Fix:** pin the same strong `ssl_ciphers` list the LB uses for parity.

### 🟡 L1 — LB redirect double-slash bug
`load_balancer.conf` `return 301 https://$host/$request_uri;` produces `https://host//path`.
**Fix:** use `https://$host$request_uri` (the web-server redirects already do).

### 🟡 L2 — HSTS `preload` still set on staging
`load_balancer.conf` sends `Strict-Transport-Security "...; preload"` despite the inline "remove while
testing" note. Client-facing (outside the LB↔web scope) but risky if this host ever lands on a
browser preload list. **Fix:** drop `preload` (and lower `max-age`) on staging.

### 🟡 L3 — Unused per-host certs left on the boxes
`s-dokimion3.psonet.{crt,key}` (and s-dokimion1's per-host cert/key/pem) are no longer referenced and
also `644`. **Fix:** remove to shrink attack surface and prevent wiring up the wrong cert.

### 🟡 L4 — Config drift across the three web servers
dokimion3's `location /` lacks the websocket `proxy_set_header Upgrade/Connection` + buffering block
the others have; resolver TTLs differ. Not a vulnerability, but divergence makes it easy to harden two
nodes and miss the third. **Fix:** normalize the three configs.

---

## Priority

| # | Severity | Item | Effort |
|---|---|---|---|
| H1 | High | mTLS or `allow/deny` so the backend only trusts the LB | Medium |
| H2 | High | `chmod 600` the shared key now; plan per-host/internal-CA certs | Low now / Medium later |
| M1 | Medium | Replace wildcard CORS with an origin allowlist | Low |
| M2 | Medium | Re-enable rate limiting (at least the `auth` zone) | Low |
| M3 | Medium | Pin `ssl_ciphers` on the web servers | Low |
| L1–L4 | Low | Redirect slash, HSTS preload, unused certs, config drift | Low |

**Act first on H1 + H2** — they harden the LB→web channel itself. The rest is exposure/hygiene around it.
