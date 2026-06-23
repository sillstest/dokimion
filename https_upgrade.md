# https_upgrade — Convert Load Balancer ↔ Web Server hop from HTTP to HTTPS

**Goal:** Encrypt the internal hop between the nginx load balancer and the nginx web servers.
Leave external HTTPS (Cloudflare ↔ LB) and the web server's loopback proxies (`:3000`/`:8080`) unchanged.

- Load balancer config: `config/production/dokimion/load_balancer.conf`
- Web server config:   `config/production/dokimion1/dokimion1.conf` (and the dokimion2/dokimion3 peers)

---

## Current setup (the one hop to change)
```
External ──HTTPS:443──▶ Load Balancer (testing.languagetechnology.org)
                          upstream prod_servers = dokimion1/2/3.psonet  (no port ⇒ :80)
                          proxy_pass http://prod_servers           ◀── THIS hop is HTTP
                              │
                              ▼  HTTP:80
                        Web Server (dokimion1.psonet, listen 80)
                          location /     → proxy_pass http://127.0.0.1:3000   (loopback — leave HTTP)
                          location /api  → proxy_pass http://127.0.0.1:8080   (loopback — leave HTTP)
```
Only the **LB → web-server hop** changes (HTTP:80 → HTTPS:443). External HTTPS and the loopback
proxies to `:3000`/`:8080` stay exactly as they are.

**Key fact:** the web servers are internal `*.psonet` names, so no public CA will issue a cert for
them — use a **self-signed cert** (or internal CA). nginx `proxy_pass https://…` does **not** verify
the upstream cert by default (`proxy_ssl_verify off`), so a self-signed cert gives **encryption
immediately** with zero trust plumbing; verification is optional hardening (Step 3).

---

## Prep (no behavior change) — generate a cert on each web server
On **each** web server box (dokimion1, dokimion2, dokimion3), using the matching hostname:
```bash
sudo openssl req -x509 -nodes -newkey rsa:2048 -days 825 \
  -keyout /etc/nginx/sites-available/dokimion1.psonet.key \
  -out    /etc/nginx/sites-available/dokimion1.psonet.pem \
  -subj   "/CN=dokimion1.psonet" \
  -addext "subjectAltName=DNS:dokimion1.psonet"
```
**Test:** `sudo openssl x509 -in /etc/nginx/sites-available/dokimion1.psonet.pem -noout -subject -dates`
No nginx change yet.

---

## Step 1 — Web server: add an HTTPS listener *alongside* HTTP (additive, non-breaking)
In `dokimion1.conf`, add 4 lines to the existing `server {}` (keep `listen 80;` for now):
```nginx
server {
    server_name dokimion1.psonet;
    listen 80;
    listen 443 ssl;                                                       # NEW
    ssl_certificate     /etc/nginx/sites-available/dokimion1.psonet.pem;  # NEW
    ssl_certificate_key /etc/nginx/sites-available/dokimion1.psonet.key;  # NEW
    ssl_protocols TLSv1.2 TLSv1.3;                                        # NEW
    # ... everything else unchanged (the :3000/:8080 loopback proxies stay http) ...
}
```
**Test (in isolation — the LB still uses HTTP, so the live app is unaffected):**
```bash
sudo nginx -t && sudo systemctl reload nginx
curl -k https://dokimion1.psonet/        # from the LB box → app HTML
curl -k https://dokimion1.psonet/api/... # an API path → JSON
```
**Rollback:** delete the 4 added lines, reload.
Apply + test on **all three** web servers before Step 2.

---

## Step 2 — Load balancer: proxy to the upstreams over HTTPS
a. Point the upstream at 443:
```nginx
upstream prod_servers {
    ip_hash;
    server dokimion1.psonet:443 max_fails=5 fail_timeout=60s;   # add :443
    server dokimion2.psonet:443 max_fails=5 fail_timeout=60s;
    server dokimion3.psonet:443 max_fails=5 fail_timeout=60s;
    keepalive 64;
}
```
b. In `location /`, change the scheme and add minimal proxy-SSL settings:
```nginx
proxy_ssl_server_name on;            # send SNI so the web server selects its cert
proxy_ssl_protocols   TLSv1.2 TLSv1.3;
# proxy_ssl_verify off;  ← default; encryption without verification (hardened in Step 3)
proxy_pass https://prod_servers$empty;   # was: http://prod_servers$empty
```
**Test (the cutover):**
```bash
sudo nginx -t && sudo systemctl reload nginx
curl -I https://testing.languagetechnology.org/   # external → 200, app loads
# log in via the UI / exercise an API call; tail the web-server access log to confirm TLS hits
```
**Rollback:** revert `https`→`http` and drop `:443`, reload. (Keep this command ready as the instant fallback.)

> **Rehearse on staging first:** do Step 1 + Step 2 on `s-dokimion` LB → single `s-dokimion1` upstream.
> One upstream server is a clean, low-risk dry run of the exact production change.

---

## Step 3 — (Optional) Harden: verify the upstream cert
Adds authentication (LB trusts only your servers). Requires an internal CA signing each web-server
cert, then on the LB:
```nginx
proxy_ssl_verify on;
proxy_ssl_verify_depth 2;
proxy_ssl_trusted_certificate /etc/nginx/sites-available/internal-ca.pem;
proxy_ssl_name dokimion1.psonet;   # must match the cert
```
Catch: with three differently-named upstreams behind one `proxy_pass`, `proxy_ssl_name`/verification is
fiddly — easiest is one SAN cert covering all three names, or skip verification (Step 2 is sufficient
for an internal segment). Treat as optional.

---

## Step 4 — (Optional) Make the hop HTTPS-only
Once Step 2 is stable, remove `listen 80;` from the web servers (or replace with a redirect / `return 444`)
so plaintext is no longer accepted.
**Test:** `curl http://dokimion1.psonet/` now fails/redirects; `https` still works; app still works.
**Rollback:** restore `listen 80;`.

---

## Minimal change set
| File | Change | Testable alone? |
|---|---|---|
| web server `dokimion1.conf` (×3) | +`listen 443 ssl` + cert (Step 1) | ✅ `curl -k https://dokimionN.psonet/` |
| LB `load_balancer.conf` | upstream `:443` + `proxy_pass https` + 2 `proxy_ssl_*` (Step 2) | ✅ `curl -I https://testing…/` (cutover) |
| (optional) verify / HTTPS-only | Steps 3–4 | ✅ each |

Net required diff: ~4 lines per web server + ~5 lines on the LB.
