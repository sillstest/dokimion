# syntax=docker/dockerfile:1
#
# Dokimion — single all-in-one image for EKS: nginx serves the React build and proxies /api to
# jetty-runner + quack.war (:8080). JDK 21. quack.properties is rendered at startup from env
# (docker-entrypoint.sh) — nothing sensitive is baked in.
#
# Build from the repo root (BuildKit):
#   DOCKER_BUILDKIT=1 docker build -f deploy/Dockerfile -t <ecr>/dokimion:latest .
#
# UI_ENV selects the Turnstile profile compiled into the UI. Since an AWS ALB + Cognito is the
# real login gate, the default "test" profile (always-pass invisible sitekey) is correct here.

# ---- Stage 1: React UI -> /src/ui/src/build ---------------------------------
FROM node:20-bookworm AS ui
WORKDIR /src/ui/src
COPY ui/src/package.json ui/src/yarn.lock ./
# node:20 already ships yarn 1.x; use it (reinstalling collides with /usr/local/bin/yarn)
RUN yarn install --frozen-lockfile --network-timeout 300000
COPY ui/src/ ./
ARG UI_ENV=test
COPY config/common/.env_${UI_ENV} ./.env
# tinymce core is committed under ui/src/public/tinymce; CRA copies public/ -> build/, so
# /tinymce/tinymce.min.js is served without any node_modules copy.
RUN NODE_OPTIONS=--openssl-legacy-provider npm run build

# ---- Stage 2: quack.war + jetty-runner (JDK 21, whole reactor except ui) -----
FROM maven:3.9-eclipse-temurin-21 AS war
WORKDIR /src
COPY . .
RUN --mount=type=cache,target=/root/.m2 \
    mvn -B -q -DskipTests -pl '!ui' clean package

# ---- Stage 3: runtime — JRE 21 + nginx --------------------------------------
FROM eclipse-temurin:21-jre-jammy AS runtime
RUN apt-get update \
 && apt-get install -y --no-install-recommends nginx gettext-base tini curl \
 && rm -rf /var/lib/apt/lists/* \
 && rm -f /etc/nginx/sites-enabled/default
RUN mkdir -p /opt/dokimion/lib /etc/dokimion /usr/share/nginx/dokimion

COPY --from=war /src/assembly/target/quack.war /opt/dokimion/quack.war
COPY --from=war /src/assembly/target/lib/      /opt/dokimion/lib/
COPY --from=ui  /src/ui/src/build/             /usr/share/nginx/dokimion/

COPY deploy/container/nginx.conf            /etc/nginx/conf.d/dokimion.conf
COPY deploy/container/quack.properties.tmpl /opt/dokimion/quack.properties.tmpl
COPY deploy/container/docker-entrypoint.sh  /usr/local/bin/docker-entrypoint.sh
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

EXPOSE 80
ENTRYPOINT ["/usr/bin/tini","--","/usr/local/bin/docker-entrypoint.sh"]
