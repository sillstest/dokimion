# Dokimion on AWS EKS

Dokimion as a single all-in-one container, MongoDB as a stock-image StatefulSet on an EBS
volume, both behind an **ALB that terminates TLS (ACM) and requires Cognito login** (Option A:
Cognito gates at the edge; Dokimion keeps its own login). Turnstile is dropped (Cognito is the
gate). The Selenium/API suite is intentionally out of scope for now.

```
Internet ──HTTPS──▶ ALB (ACM TLS + Cognito authN) ──▶ Service ──▶ dokimion pod (nginx :80 → jetty :8080)
                                                                         └──▶ mongo StatefulSet :27017 (EBS PVC)
```

## Files

| File | What |
|---|---|
| `../Dockerfile` (+ `Dockerfile.dockerignore`) | builds the image (node UI → maven war → JRE+nginx) |
| `../container/*` | entrypoint (renders `/etc/dokimion/quack.properties`), nginx.conf, template |
| `00-namespace.yaml` | namespace `dokimion` |
| `10-mongo.yaml` | gp3 StorageClass, standalone Mongo StatefulSet + headless Service + PVC + NetworkPolicy |
| `20-dokimion-config.yaml` | ConfigMap (non-secret) + Secret stub (admin ciphertext) |
| `30-dokimion.yaml` | Deployment (1 replica) + Service |
| `40-ingress.yaml` | ALB Ingress (TLS + Cognito) |
| `aes-encrypt.java` | produces the AES ciphertext for `auth.admin.password` |

## Prerequisites

- An **EKS cluster** with a managed node group (Mongo's EBS PVC rules out Fargate for the DB).
- Cluster add-ons: **AWS Load Balancer Controller**, **EBS CSI driver**. (For NetworkPolicy
  enforcement, enable VPC CNI network policy or install Calico — otherwise `10-mongo.yaml`'s
  NetworkPolicy is inert, not harmful.)
- An **ECR** repo, an **ACM certificate** for your hostname (ALB region), and **Route 53** (or
  your DNS) to point the hostname at the ALB.
- A **Cognito** User Pool + hosted **domain** + **app client** whose allowed callback URL
  includes `https://<host>/oauth2/idpresponse` and sign-out URL `https://<host>`.
- A machine with **Docker + network** to build/push, and **JDK 21** to run `aes-encrypt.java`.

## Placeholders to fill in

| Where | Replace |
|---|---|
| `30-dokimion.yaml` | image `ACCOUNT.dkr.ecr.REGION.amazonaws.com/dokimion:latest` |
| `20-dokimion-config.yaml` | `AUTH_DOMAIN`, `QUACK_UI_URL` (your host); `AUTH_ADMIN_PASSWORD` (ciphertext) |
| `40-ingress.yaml` | `<ACM_CERT_ARN>`, Cognito `userPoolARN`/`userPoolClientID`/`userPoolDomain`, `host:` |

## Steps

**1. Build & push the image**
```bash
aws ecr get-login-password --region REGION | docker login --username AWS --password-stdin ACCOUNT.dkr.ecr.REGION.amazonaws.com
DOCKER_BUILDKIT=1 docker build -f deploy/Dockerfile -t ACCOUNT.dkr.ecr.REGION.amazonaws.com/dokimion:latest .
docker push ACCOUNT.dkr.ecr.REGION.amazonaws.com/dokimion:latest
```

**2. Encrypt the admin password** and paste it into the Secret in `20-dokimion-config.yaml`:
```bash
java deploy/eks/aes-encrypt.java 'YourAdminPassword'
```

**3. Apply (in order)**
```bash
kubectl apply -f deploy/eks/00-namespace.yaml
kubectl apply -f deploy/eks/10-mongo.yaml          # wait: kubectl -n dokimion rollout status statefulset/mongo
kubectl apply -f deploy/eks/20-dokimion-config.yaml
kubectl apply -f deploy/eks/30-dokimion.yaml
kubectl apply -f deploy/eks/40-ingress.yaml        # LB controller provisions the ALB
```

**4. Wire DNS + Cognito**
- `kubectl -n dokimion get ingress dokimion` → point your hostname (Route 53 ALIAS) at the ALB.
- Confirm the Cognito app client callback = `https://<host>/oauth2/idpresponse`.

**5. Verify**
```bash
# in-cluster (bypasses Cognito) — app health
kubectl -n dokimion port-forward deploy/dokimion 8080:80
curl -s localhost:8080/healthz                     # ok
curl -si localhost:8080/api/user/session | head -1 # 401 (app up, no session)
# external — browser to https://<host> should hit the Cognito hosted UI, then Dokimion's login.
```

## Migrating existing data (from `dokimion5.psonet`)

The in-cluster Mongo starts **empty**. Your current data is on `dokimion5.psonet:27017` (standalone,
**auth enabled** per `/etc/mongod5.conf`). After `10-mongo.yaml` is up:

```bash
# dump from the current DB (auth required; use the dokimion DB user's PLAINTEXT password)
mongodump --host dokimion5.psonet:27017 \
  --username dokimion --password 'PLAINTEXT_PW' --authenticationDatabase admin \
  --db dokimion --archive=dokimion.archive --gzip

# restore into the in-cluster Mongo via a port-forward (no auth there)
kubectl -n dokimion port-forward svc/mongo 27017:27017 &
mongorestore --host localhost:27017 --archive=dokimion.archive --gzip --nsInclude 'dokimion.*'
```
Do the cutover during a quiet window so no writes are lost between dump and restore.

**Alternative — use the existing Mongo instead of in-cluster:** if EKS can reach `dokimion5.psonet`
(VPC peering/VPN), skip `10-mongo.yaml` and point the app at it — set `MONGO_URI` in
`20-dokimion-config.yaml` to
`mongodb://dokimion:PLAINTEXT_PW@dokimion5.psonet:27017/?authSource=admin` (auth is on; no
`replicaSet`, it's standalone). Keeps one DB, no migration, but ties EKS to that host's network and
lifecycle. The task as specified uses in-cluster Mongo, so that's the default above.

## Notes & follow-ups

- **Mongo runs standalone**, matching production dokimion5 (replication disabled there; the app
  uses no multi-document transactions, so no replica set is needed). Durability = the EBS volume
  (single-AZ, `Retain`). Add **scheduled `mongodump`/EBS snapshots**; HA would mean moving to a
  replica set.
- The in-cluster Mongo runs **without auth**, isolated by the NetworkPolicy. Production dokimion5
  has auth on — to match it, start mongod with `--auth`, create the `dokimion` user, and put
  `dokimion:PW@` + `?authSource=admin` in `MONGO_URI`.
- **Scaling the app > 1 replica** needs Hazelcast **Kubernetes discovery** (currently single
  member). Simpler alternative: `WHORU_SESSION_PROVIDER=ru.greatbit.whoru.auth.providers.InmemSessionProvider`
  + sticky sessions. Start at 1.
- **`quack.api.endpoint` stays `http://localhost/api`** (the app calling itself via the in-pod
  nginx). Do NOT set it to the public URL — that would loop out through the ALB/Cognito.
- **Secrets:** the Secret here is a stub. For production, replace it with an **ExternalSecret**
  (External Secrets Operator, IRSA-scoped) syncing **AWS Secrets Manager** → `dokimion-secrets`.
  Mongo runs without in-DB auth, isolated by the NetworkPolicy; to enable SCRAM instead, add a
  keyFile + users and put creds in the `MONGO_URI`.
- **Double login** is expected under Option A (Cognito, then Dokimion). SSO (no second prompt)
  is a later option via a custom auth provider that trusts the ALB's `x-amzn-oidc-*` headers.
- **Two config files:** the app's `TurnstileProperties` loads `/etc/dokimion/cloudflareTurnstile.properties`
  in a static initializer and 500s on every `/api/user/*` call if it is missing. The entrypoint
  renders it (key `app.secret` = `QUACK_TURNSTILE_SECRET`) alongside `quack.properties`.
- **Pod egress to Cloudflare is required for login:** Dokimion verifies the Turnstile token
  server-side by POSTing to `https://challenges.cloudflare.com/turnstile/v0/siteverify` on every
  login (even with the always-pass test key). Ensure the pod has internet egress (NAT gateway).
  (Cognito already gates at the ALB, so a later option is to disable the app's Turnstile check —
  a code change — and drop this dependency.)
- **`AUTH_DOMAIN` must equal the public hostname** (the ALB/Cognito host) or the Dokimion session
  cookie won't stick — verified: a cookie scoped to one host is not sent to another.
- Minor hardening note (pre-existing, not introduced here): `DbAuthProvider` `System.out.println`s
  the login password and the AES key is hard-coded — worth cleaning up separately.
