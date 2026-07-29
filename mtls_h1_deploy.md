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

**Updated 2026-07-29 — production part 1 is now deployed, so the phases below are unblocked:**

| | staging LB | staging web ×3 | production LB | production web ×3 |
|---|---|---|---|---|
| part 1 includes present | n/a | **yes** | **yes** (2026-07-29) | **yes** (2026-07-29) |
| `lb_access.h` active (`deny all`) | n/a | **yes — live** | n/a | **yes — live ×3** (2026-07-29) |
| `lb_mtls.h` **ACTIVE** (`ssl_verify_client on`) | n/a | **yes — live ×3** | n/a | no (inert) ← **this is what H1b turns on** |
| `lb_client_cert.h` **ACTIVE** | **yes — live** | n/a | no (inert) ← **Phase 4** | n/a |
| `lb-client.{crt,key}` installed | **yes** | n/a | **no** ← **Phase 2** | n/a |
| `lb-client-ca.crt` installed | n/a | **yes ×3** | n/a | **no** ← **Phase 3** |
| repo commit | `f7070f46` | `f7070f46` | `c2192e3f` | `2a0ff258` |

Production's blocker is cleared: the part 1 `include` lines are installed on all four boxes and
`lb_access.h` is enforcing (verified 403 from a non-allowlisted source). What is missing is purely the
**key material** — Phases 1–3 — and then the two switch-on phases, 4 and 5.

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

## Production progress — Phases 1–3 ✅ DONE 2026-07-29

| Phase | State on production |
|---|---|
| 1 — secure the CA key | ✅ `/etc/nginx/internal-ca` `700 root:root`; `~/lb-mtls/ca.key` shredded |
| 2 — client credentials on the LB | ✅ `lb-client.crt` `644`, `lb-client.key` `600`, both `root:root` |
| 3 — CA cert to the web boxes | ✅ all three: `644 root:root`, sha256 `d3eb2e8b…` = production CA, home copies removed |
| 4 — LB presents its cert | ⬜ next — safe, no-op on its own |
| 5 — `ssl_verify_client` per web box | ⬜ order: `dokimion3` → `dokimion1` → `dokimion2` |

Verified after Phase 3 that nothing changed on the wire: `lb_mtls.h` still has **0** active directives on
all three boxes, the site returns `200` through the LB, and direct access from a non-allowlisted source
still returns **403** — i.e. H1a is the control in force and mTLS has not engaged.

Two implementation notes from doing it, both of which cost time:

- **`install` on the web boxes is `coreutils-from-uutils` 0.8.0, not GNU** (`dokimion` the LB has GNU
  9.4). All the options this runbook uses — `-m -o -g -t -d` — are supported, but its error messages are
  terser: a missing *source* file reports only `install: No such file or directory`, where GNU names the
  path. If you see that, check the source exists before suspecting anything else.
- Do **not** "fix" that by installing GNU `coreutils` — on those boxes it would replace
  `coreutils-from-uutils`, a package swap on three production web servers for a non-problem.

---

## Production preflight — ✅ ALL CHECKS PASS, verified 2026-07-29

Run before production's Phase 1. Every item below was measured, not assumed.

| Check | Result |
|---|---|
| Key material still present in `~bob_beck/lb-mtls/` on `dokimion.psonet` | ✅ dir `700`, `ca.key`/`lb-client.key` `600`, certs `644` |
| CA identity | `CN = Dokimion production LB Client CA`, `CA:TRUE, pathlen:0`, expires **2036-07-24** |
| Client cert | `CN = dokimion.psonet`, EKU `critical, TLS Web Client Authentication`, expires **2029-07-26** |
| `openssl verify -purpose sslclient -CAfile lb-client-ca.crt lb-client.crt` | ✅ **OK** |
| Client key matches client cert (pubkey md5) | ✅ **MATCH** |
| Production CA is *distinct* from staging's | ✅ `d3eb2e8b…` vs `e23f8012…` — separate CA per environment |
| Phase 3 requires LB → web-box SSH on port 32 | ✅ `dokimion.psonet` reaches `dokimion{1,2,3}` |
| Phase 4 `sed` hazard (`#--BEGIN-DIRECTIVES--` count must be 1) | ✅ 1; the `sed` yields exactly the two `proxy_ssl_certificate*` lines |
| Phase 5 `sed` on `lb_mtls.h`, all three boxes | ✅ yields exactly `ssl_verify_client on;` + `ssl_client_certificate …;` |
| Anything automated that would break when direct access becomes 400 | ✅ **nothing** — no user crontab, no `cron.d`/`cron.daily` `curl`/`wget`, no Zabbix web scenario; only stock OS timers (sysstat, apt-daily, logrotate, man-db) |
| External clients hitting the web boxes directly | ✅ **none** — the H1a audit found only the LB and the three web boxes themselves |

**Production has no Selenium problem.** Phase -1(d), which is still open for staging, does not apply
here: nothing outside the four internal addresses reaches the production web boxes.

**Two production-specific cautions.**

1. **After Phase 5, on-box self-checks return 400.** `curl https://dokimion1.psonet/` *from* `dokimion1`
   presents no client certificate, so it will be rejected — the same behaviour staging has. That is
   expected, and per the table above nothing automated depends on it. `lb_access.h`'s LAN-IP entries stay
   useful for the pre-mTLS state and for a rollback, but under mTLS they no longer decide the outcome.
2. **`ip_hash` makes "check through the LB" a weak per-box test.** A single client is hashed to one
   upstream, so after enabling box N your `curl https://testing.languagetechnology.org/` may never touch
   box N. Verify that box directly *from the LB, presenting the client cert* — that is the only probe that
   proves box N accepts this LB:

```bash
# on dokimion.psonet, after enabling mTLS on dokimion<N>
sudo curl -sk --cert /etc/nginx/sites-available/lb-client.crt \
               --key  /etc/nginx/sites-available/lb-client.key \
     -o /dev/null -w 'dokimion<N> with client cert: %{http_code}\n' https://dokimion<N>.psonet/
```

Expect `200`. A `400` there means that box is not accepting this LB's certificate — roll it back before
touching the next one.

**Suggested order for production Phase 5:** `dokimion3` (lowest direct traffic, 4 self-requests), then
`dokimion1` (22), then `dokimion2` last (highest volume at 13.9k LB requests, and the only box that saw
traffic from both peers).

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

> 🛑 **Corrected 2026-07-29 — the original instruction could not work.** It said to `scp` from
> `/etc/nginx/internal-ca/lb-client-ca.crt`, but Phase 1 creates that directory `700 root:root`, and
> `scp` runs as `bob_beck` — so the copy fails with a permission error on the *source*. Copy the
> still-present home copy instead: Phase 1 shreds only `ca.key`, and `~/lb-mtls/lb-client-ca.crt`
> remains, mode `644`, user-owned. It is the same file that was installed into `internal-ca`.

Staging:
```bash
for h in s-dokimion1 s-dokimion2 s-dokimion3; do
  scp -P 32 ~/lb-mtls/lb-client-ca.crt "$h.psonet:~/lb-client-ca.crt"
done
```
Production:
```bash
for h in dokimion1 dokimion2 dokimion3; do
  scp -P 32 ~/lb-mtls/lb-client-ca.crt "$h.psonet:~/lb-client-ca.crt"
done
```

If the home copy is ever gone (a rebuilt LB), stage a readable copy first rather than changing the mode
of `internal-ca`:
```bash
sudo install -m 644 -o "$USER" -g "$USER" /etc/nginx/internal-ca/lb-client-ca.crt ~/lb-client-ca.crt
```

Then on **each web box** — and verify the checksum, so a truncated or wrong-environment file cannot pass
silently:
```bash
sudo install -m 644 -o root -g root ~/lb-client-ca.crt /etc/nginx/sites-available/lb-client-ca.crt
rm ~/lb-client-ca.crt
sha256sum /etc/nginx/sites-available/lb-client-ca.crt
openssl x509 -in /etc/nginx/sites-available/lb-client-ca.crt -noout -subject
```

Expected on **production** (verified 2026-07-29):
```
d3eb2e8b54f569849afcd83706dbace465e69462258587464472dbf2e0f68dea
subject=CN = Dokimion production LB Client CA, O = SIL, OU = Dokimion production
```
Staging's CA is `e23f8012…` with `CN = Dokimion staging LB Client CA`. If a box shows the staging
checksum, stop — that box would reject the production LB, and `nginx -t` would **not** catch it.

---

> 🛑 **Two ways Phases 4 and 5 silently do nothing — both hit on production 2026-07-29.**
>
> 1. **Relative paths.** The original text was `cd <dir>` then `sudo install … lb_mtls.h …`. Run the
>    `install` in a different shell, or after moving directory, and the file does not resolve. On the web
>    boxes `install` is `coreutils-from-uutils`, which reports only `install: No such file or directory`
>    without naming the path — it reads like a missing program. The commands below use absolute paths.
> 2. **`nginx -t` and `reload` succeed regardless.** If the `install` failed, the live config is still the
>    previous valid one, so the test passes, the reload succeeds, and nothing warns you. The `sed` also
>    leaves the repo copy looking correct, so inspecting *that* file confirms nothing.
>
> **Therefore: always `grep` the file in `/etc/nginx/sites-available/` after installing and before
> reloading.** That is the only step that distinguishes "deployed" from "no-op". On production, Phase 5's
> `sed` ran on `dokimion3` while the live file stayed untouched for 3.5 hours, and every other signal
> looked healthy.

## Phase 4 — enable the LB side first

Presenting a client certificate to a server that never asks for one is a no-op, so this phase is
safe on its own and can sit in place for as long as you like before Phase 5.

Use **absolute paths throughout** — see the warning at the end of this phase.

```bash
D=~/dokimion/config/staging/s-dokimion          # production: ~/dokimion/config/production/dokimion
sed -i 's/^# proxy_ssl_/proxy_ssl_/' $D/lb_client_cert.h
grep -vE '^\s*#|^\s*$' $D/lb_client_cert.h    # expect the two proxy_ssl_certificate* lines
```

Deploy, **verify it landed**, then reload:
```bash
sudo install -m 644 $D/lb_client_cert.h /etc/nginx/sites-available/lb_client_cert.h
grep -vE '^\s*#|^\s*$' /etc/nginx/sites-available/lb_client_cert.h   # <-- must show the 2 directives
sudo nginx -t && sudo systemctl reload nginx
curl -sk -o /dev/null -w "site through LB: HTTP %{http_code}\n" https://s-dokimion.psonet/
```
Expect `HTTP 200`. If not, revert: `sed -i 's/^proxy_ssl_/# proxy_ssl_/' $D/lb_client_cert.h`, re-install, reload.

---

## Phase 5 — turn on verification, ONE web box at a time

Start with **`s-dokimion3.psonet`** (it is the node the Selenium suite targets, so problems surface
fastest there).

```bash
D=~/dokimion/config/staging/s-dokimion3        # production: ~/dokimion/config/production/dokimion3
sed -i -e 's/^# ssl_verify_client/ssl_verify_client/' \
       -e 's/^# ssl_client_certificate/ssl_client_certificate/' $D/lb_mtls.h
grep -vE '^\s*#|^\s*$' $D/lb_mtls.h    # expect ssl_verify_client on; + ssl_client_certificate ...;

sudo install -m 644 $D/lb_mtls.h /etc/nginx/sites-available/lb_mtls.h
grep -vE '^\s*#|^\s*$' /etc/nginx/sites-available/lb_mtls.h   # <-- MUST show the 2 directives
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
