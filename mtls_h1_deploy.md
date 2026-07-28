# H1 part 2 — mTLS deployment runbook

Companion to `security_hardening_staging.md` / `security_hardening_production.md` (finding **H1**).
The nginx config scaffolding is already committed and inert; this runbook installs the key material
and switches it on.

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
| `lb_mtls.h` deployed, inert | n/a | yes | no | no |
| `lb_client_cert.h` deployed, inert | yes | n/a | no | n/a |
| `lb-client.{crt,key}` installed | **no** | n/a | **no** | n/a |
| `lb-client-ca.crt` installed | n/a | **no** | n/a | no |
| repo commit | `d3ddff57` | `d3ddff57` | `d82e1435` | `210031a8` |

So staging picks up at **Phase 1**. Production is several commits behind and does not yet have the
part 1 includes at all — **do not run any production phase until part 1 is deployed there**, or nginx
will fail on a missing `include`.

## Phase -1 — prerequisites (do this first)

Three corrections are not yet committed, and one of them will break Phase 4 if you skip it.

**(a) The pushed `lb_client_cert.h` has a `sed` hazard.** In commit `d3ddff57`, line 4 begins
`# proxy_ssl_verify directives…`, so Phase 4's `sed` would uncomment prose into the config and
`nginx -t` would fail. The fix is in the working tree on `s-dokimion3` but not committed. Confirm you
have the fixed copy before Phase 4:
```bash
grep -c '^#--BEGIN-DIRECTIVES--' config/staging/s-dokimion/lb_client_cert.h   # must print 1
```

**(b) `config/production/dokimion1/webserver_cert.h` contains staging cert paths** — harmless on
staging, fatal on a production web box. It is root-owned, so it needs sudo:
```bash
sudo tee /home/bob_beck/dokimion/config/production/dokimion1/webserver_cert.h >/dev/null <<'EOF'
ssl_certificate     /etc/nginx/sites-available/dokimion-production.crt;
ssl_certificate_key /etc/nginx/sites-available/dokimion-production.key;
EOF
sudo chown bob_beck:bob_beck /home/bob_beck/dokimion/config/production/dokimion1/webserver_cert.h
```

**(c) Commit and distribute.** On `s-dokimion3`:
```bash
cd ~/dokimion
git add config/*/*/webserver_cert.h config/*/*/lb_client_cert.h mtls_h1_deploy.md
git commit -m "H1 mTLS: per-host webserver_cert.h, fix lb_client_cert.h enable marker, add runbook"
git push origin https_upgrade
```
Then pull on the box you are about to work on — at minimum the **staging LB**, which needs the
corrected `lb_client_cert.h`:
```bash
ssh -p 32 s-dokimion.psonet 'cd ~/dokimion && git pull --ff-only origin https_upgrade'
```
`dokimion1/2/3.psonet` have dirty working trees; check `git status` there before pulling.

**(d) Decide about the Selenium suite.** `Dokimion_Tests/.runsettings` targets
`http://s-dokimion3.psonet` directly, which already returns **403** under part 1 and will return
**400** once mTLS is on. Repoint it at the load balancer, or allow the runner's IP in `lb_access.h`.

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
