# H1 part 2 — mTLS deployment runbook

Companion to `security_hardening_staging.md` / `security_hardening_production.md` (finding **H1**).
The nginx config scaffolding is already committed and inert; this runbook installs the key material
and switches it on.

> ## ✅ STAGING IS COMPLETE (2026-07-28, commit `f7070f46`)
> All phases have been run on staging and verified live: mTLS is enforced on
> `s-dokimion{1,2,3}` and the LB presents `lb-client.crt`. Verification results are in
> `security_hardening_staging.md` under "H1b is LIVE".
>
> **Production has not started and must not skip ahead.** Its boxes still lack the part 1
> includes *and* the CA, so enabling `ssl_verify_client` there would stop nginx from starting.
> Run production's Phase -1 → 5 in order, on its own key material (each environment has its
> own CA — a staging cert cannot authenticate to production).
>
> The phase instructions below are unchanged and remain the procedure for production.

**Key material was generated on 2026-07-27, on each load balancer itself**, so no private key has
crossed the network. It currently sits in `~bob_beck/lb-mtls/` (dir `700`, keys `600`) on:

| Environment | Load balancer | CA cert SHA256 | Client cert SHA256 |
|---|---|---|---|
| staging | `s-dokimion.psonet` | `8D:F0:75:07:…:B7:43` | `B4:AB:54:17:…:B1:F7` |
| production | `dokimion.psonet` | `D0:2E:CB:D9:…:9F:E7` | `BA:1C:C2:23:…:E8:BD` |

Each environment has its **own** CA, so a staging cert cannot authenticate to production
(verified: cross-environment `openssl verify` fails with "unable to get local issuer certificate").

Client certs: RSA 2048, `extendedKeyUsage = critical,clientAuth`, expire **2029-07-26**.
CAs: RSA 4096, `pathlen:0`, expire **2036-07-25**.

Verified before writing this runbook, using `openssl s_server -Verify 1`:
presenting the client cert → handshake **accepted**; omitting it → **refused**
(`alert certificate required`, SSL alert 116).

---

## Where things stand (verified 2026-07-27)

**H1 part 1 is already live on staging** and healthy — measured, not assumed:

| Check | Result |
|---|---|
| `https://s-dokimion.psonet/` (through the LB) | **200** |
| direct to `s-dokimion{1,2,3}` from a non-allowed host | **403** |
| direct to `s-dokimion{1,2,3}` from the LB (`10.3.0.171`) | **200** |

| | staging LB | staging web ×3 | production LB | production web ×3 |
|---|---|---|---|---|
| `lb_access.h` active (`deny all`) | n/a | **yes — live** | n/a | no |
| `lb_mtls.h` **ACTIVE** (`ssl_verify_client on`) | n/a | **yes — live ×3** | n/a | no (inert) |
| `lb_client_cert.h` **ACTIVE** | **yes — live** | n/a | no (inert) | n/a |
| `lb-client.{crt,key}` installed | **yes** | n/a | **no** | n/a |
| `lb-client-ca.crt` installed | n/a | **yes ×3** | n/a | no |
| repo commit | `f7070f46` | `f7070f46` | `d82e1435` | `210031a8` |

Staging has now run every phase (see the banner at the top). Production is several commits behind and
does not yet have the part 1 includes at all — **do not run any production phase until part 1 is
deployed there**, or nginx will fail on a missing `include`.

## Phase -1 — prerequisites — ✅ (a)(b)(c) DONE 2026-07-28, (d) still open

Three corrections had to land before Phase 4. All three are now committed and pushed as
**`dfc6ccb8`**; only decision **(d)** remains.

**(a) `sed` hazard in `lb_client_cert.h` — ✅ resolved (already fixed in `de9073c7`).**
The hazard was that a prose line began `# proxy_ssl_verify directives…`, so Phase 4's `sed` would
uncomment prose into the config and `nginx -t` would fail. Both LB copies now carry the
`#--BEGIN-DIRECTIVES--` marker and no comment line other than the two real directives starts with
`# proxy_ssl_`. Re-confirm on the box you are about to work on:
```bash
grep -c '^#--BEGIN-DIRECTIVES--' config/staging/s-dokimion/lb_client_cert.h   # must print 1
sed 's/^# proxy_ssl_/proxy_ssl_/' config/staging/s-dokimion/lb_client_cert.h | grep -v '^#'
# must print exactly the two proxy_ssl_certificate* lines and nothing else
```
Verified by dry-run on `s-dokimion.psonet` itself on 2026-07-28: output was exactly those two lines.

**(b) `config/production/dokimion1/webserver_cert.h` contained staging cert paths — ✅ fixed.**
It now matches `dokimion2`/`dokimion3` byte-for-byte (all three md5 `5ff32e70…`), and
`grep -rn s-dokimion-staging config/production/` is clean. **No sudo was required:** the file was
root-owned but `config/production/dokimion1/` is `bob_beck`-writable, so replacing the file in place
also restored `bob_beck:bob_beck` ownership. (The old `sudo tee` + `sudo chown` recipe is no longer
needed; nothing under `config/` is root-owned any more.)

⚠️ **That verification grep was too narrow — a second wrong-environment path survived it.**
`config/production/dokimion/proxy_pass.h` pointed at `dokimion-staging.crt`, which `s-dokimion-staging`
does not match. Found and fixed 2026-07-29 (see `security_hardening_production.md`, the install section).
Use a looser pattern when re-auditing:

```bash
grep -rniE 'staging|s-dokimion' config/production/ | grep -vi 'shared with staging'
grep -rn 'proxy_pass http://' config/ | grep -v 127.0.0.1
```

**(c) Commit and distribute — ✅ done.** Committed as `dfc6ccb8` and pushed to `origin/https_upgrade`
(rebased over the unrelated `c2e04a64` "TC22 fix"). The **staging LB has been pulled** and is at
`dfc6ccb8`, so it holds the corrected `lb_client_cert.h` that Phase 4 needs. At the time Phase -1
finished nothing live had changed — the deployed `lb_client_cert.h` was still the inert copy and
`lb-client.*` was not yet installed. *(Both have since been deployed in Phases 2 and 4; see the banner
at the top of this file for current staging state.)*

Still on the older `de9073c7`: `s-dokimion1`, `s-dokimion2` — harmless, they need no file until
Phase 3, which copies the CA cert directly rather than via git. Correction to the earlier warning
about `dokimion1/2/3.psonet`: their working trees are dirty only with **untracked build artifacts**
(`ui/ui.tgz`, `ui/src/package-lock.json`), so a future `git pull` there will not conflict.

Phase 1/2 key material is intact on the staging LB: `~bob_beck/lb-mtls/` is `700`, `ca.key` and
`lb-client.key` are `600`, certs `644`.

**(d) Decide about the Selenium suite — ⬜ STILL OPEN (your call).**
`Dokimion_Tests/.runsettings` line 16 sets `Url = http://s-dokimion3.psonet`, which already returns
**403** under part 1 and will return **400** once mTLS is on. Either:
- repoint it at the load balancer (`https://s-dokimion.psonet`, or the public
  `test_staging.languagetechnology.org`) — note this crosses `ip_hash` load balancing, so the suite no
  longer pins to one node; or
- add the runner's IP to `lb_access.h` on the web boxes — keeps direct single-node targeting, but that
  exemption survives mTLS only because `lb_access.h` and `ssl_verify_client` are separate controls, and
  `ssl_verify_client` fires **first** — so an IP allowance alone will **not** save the suite after
  Phase 5. Under mTLS the runner would also need a client cert.

Because `ssl_verify_client` is evaluated before the access phase, repointing at the LB is the only
option that survives Phase 5 without issuing the test runner its own certificate.

---

## Phase 1 — secure the CA key (on each LB)

Run on **`s-dokimion.psonet`**, then on **`dokimion.psonet`**.

The CA key must not live in `sites-available`: the production LB deploy step is
`sudo cp ~/dokimion/config/production/dokimion/* .`, and anything sitting in that directory risks
being copied back into the repo. Keep it in a root-only directory.

```bash
sudo install -d -m 700 -o root -g root /etc/nginx/internal-ca
sudo install -m 600 -o root -g root ~/lb-mtls/ca.key           /etc/nginx/internal-ca/lb-client-ca.key
sudo install -m 644 -o root -g root ~/lb-mtls/lb-client-ca.crt /etc/nginx/internal-ca/lb-client-ca.crt

# confirm the copy landed, then remove the user-owned original
sudo openssl rsa -in /etc/nginx/internal-ca/lb-client-ca.key -noout -check
shred -u ~/lb-mtls/ca.key
```

Never commit `ca.key` or `lb-client.key` to git.

---

## Phase 2 — install the client credentials on the LB

Run on **`s-dokimion.psonet`**, then on **`dokimion.psonet`**.

```bash
sudo install -m 600 -o root -g root ~/lb-mtls/lb-client.key /etc/nginx/sites-available/lb-client.key
sudo install -m 644 -o root -g root ~/lb-mtls/lb-client.crt /etc/nginx/sites-available/lb-client.crt
ls -l /etc/nginx/sites-available/lb-client.*
```

The LB does **not** need `lb-client-ca.crt` — it presents a cert, it doesn't verify one.

---

## Phase 3 — distribute the CA certificate to the web boxes

The CA *certificate* is public; only it gets copied. Run from the relevant LB.

Staging:
```bash
for h in s-dokimion1 s-dokimion2 s-dokimion3; do
  scp -P 32 /etc/nginx/internal-ca/lb-client-ca.crt "$h.psonet:~/lb-client-ca.crt"
done
```
Production:
```bash
for h in dokimion1 dokimion2 dokimion3; do
  scp -P 32 /etc/nginx/internal-ca/lb-client-ca.crt "$h.psonet:~/lb-client-ca.crt"
done
```

Then on **each web box**:
```bash
sudo install -m 644 -o root -g root ~/lb-client-ca.crt /etc/nginx/sites-available/lb-client-ca.crt
rm ~/lb-client-ca.crt
```

---

## Phase 4 — enable the LB side first

Presenting a client certificate to a server that never asks for one is a no-op, so this phase is
safe on its own and can sit in place for as long as you like before Phase 5.

```bash
cd ~/dokimion/config/staging/s-dokimion          # production: config/production/dokimion
sed -i 's/^# proxy_ssl_/proxy_ssl_/' lb_client_cert.h
grep -v '^#' lb_client_cert.h                    # expect the two proxy_ssl_certificate* lines
```

Deploy and reload:
```bash
sudo cp ~/dokimion/config/staging/s-dokimion/lb_client_cert.h /etc/nginx/sites-available/
sudo nginx -t && sudo systemctl reload nginx
curl -sk -o /dev/null -w "site through LB: HTTP %{http_code}\n" https://s-dokimion.psonet/
```
Expect `HTTP 200`. If not, revert: `sed -i 's/^proxy_ssl_/# proxy_ssl_/' lb_client_cert.h`, re-copy, reload.

---

## Phase 5 — turn on verification, ONE web box at a time

Start with **`s-dokimion3.psonet`** (it is the node the Selenium suite targets, so problems surface
fastest there).

```bash
cd ~/dokimion/config/staging/s-dokimion3
sed -i -e 's/^# ssl_verify_client/ssl_verify_client/' \
       -e 's/^# ssl_client_certificate/ssl_client_certificate/' lb_mtls.h
grep -v '^#' lb_mtls.h        # expect ssl_verify_client on; + ssl_client_certificate ...;

sudo cp lb_mtls.h /etc/nginx/sites-available/
sudo nginx -t && sudo systemctl reload nginx
```

Verify — through the LB it must still work, and a direct client with no certificate must be rejected.

Note what rejection looks like: nginx **completes** the TLS handshake and then answers
**`HTTP 400 — No required SSL certificate was sent`**. It does not send a handshake alert, so do not
look for one. (Measured on 2026-07-27 against this exact config.)

```bash
# through the LB: expect 200
curl -sk -o /dev/null -w "via LB: HTTP %{http_code}\n" https://s-dokimion.psonet/

# direct, no client cert: expect 400
curl -sk -o /dev/null -w "direct, no cert: HTTP %{http_code}  (400 = rejected)\n" \
     https://s-dokimion3.psonet/

# and the reason, in nginx's own words:
curl -sk https://s-dokimion3.psonet/ | grep -i 'certificate'
```

Because `ssl_verify_client` is evaluated before the access phase, once mTLS is on, unauthorized direct
requests return **400** rather than the **403** that `lb_access.h` produces on its own. Both controls
are active; the certificate check simply fires first.

**Rollback for this box** (single file, one reload):
```bash
sed -i -e 's/^ssl_verify_client/# ssl_verify_client/' \
       -e 's/^ssl_client_certificate/# ssl_client_certificate/' lb_mtls.h
sudo cp lb_mtls.h /etc/nginx/sites-available/ && sudo nginx -t && sudo systemctl reload nginx
```

Once `s-dokimion3` is healthy, repeat for `s-dokimion1` and `s-dokimion2`, then the production trio.

---

## Rotation and revocation

There is exactly one client certificate per CA, so a CRL buys nothing: **to revoke, reissue both**.
Re-run the generator on the LB, reinstall (Phases 2–3), reload the LB and the three web boxes.
That is the revocation capability H2 asks for on the server-cert side, in miniature.

Diary the client-cert expiry: **2029-07-26**.
