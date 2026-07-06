#!/bin/sh

export NODE_OPTIONS=--openssl-legacy-provider
export PATH=/opt/apache-maven-3.6.3/bin:$PATH
export PATH=/opt/apache-maven/bin:$PATH

# Redirect npm's GLOBAL install prefix to a user-writable dir. The ui build's first step is
# `npm install -g yarn`; against the default /usr/lib/node_modules it fails with EACCES/ENOTEMPTY
# whenever a prior root build left root-owned artifacts (e.g. a stale .yarn-XXXX backup dir), and
# exec-maven-plugin 1.6.0's `exec` goal ignores the pom's failOnError=false, so that non-fatal step
# aborts the whole build. Installing into $HOME instead makes the step exit 0 without touching
# /usr/lib; yarn itself is still resolved from PATH (/usr/local/bin), so this changes nothing else.
export npm_config_prefix="${npm_config_prefix:-$HOME/.npm-global}"
mkdir -p "$npm_config_prefix"

# Java 21 upgrade: build under JDK 21, preferring the SYSTEM-WIDE install. Search order:
#   1. system-wide (/opt/jdk-21 symlink -> shared SDKMAN, /usr/local/sdkman, /usr/lib/jvm)  <-- wins
#   2. an already-set JDK-21 JAVA_HOME (e.g. exported, or SDKMAN's per-user shell init)
#   3. per-user SDKMAN (~/.sdkman)
# This deliberately prefers system-wide over the per-user JAVA_HOME the shell sets. If no JDK 21 is
# found anywhere, warns and proceeds with the default java (the build also works on JDK 8/11).
_j21=""
for h in /opt/jdk-21 \
         /usr/local/sdkman/candidates/java/21*-tem \
         /usr/local/sdkman/candidates/java/21* \
         /usr/lib/jvm/temurin-21-jdk-amd64 \
         /usr/lib/jvm/java-21-openjdk-amd64; do
  if [ -x "$h/bin/java" ]; then _j21="$h"; break; fi
done
if [ -z "$_j21" ]; then
  if [ -n "$JAVA_HOME" ] && "$JAVA_HOME/bin/java" -version 2>&1 | grep -q '"21'; then
    _j21="$JAVA_HOME"
  else
    for h in "$HOME"/.sdkman/candidates/java/21*-tem "$HOME"/.sdkman/candidates/java/21*; do
      if [ -x "$h/bin/java" ]; then _j21="$h"; break; fi
    done
  fi
fi
if [ -n "$_j21" ] && "$_j21/bin/java" -version 2>&1 | grep -q '"21'; then
  JAVA_HOME="$_j21"
  export JAVA_HOME
  export PATH="$JAVA_HOME/bin:$PATH"
  echo "mvn_build: building with JDK 21 at $JAVA_HOME"
else
  echo "mvn_build: WARNING - no JDK 21 found; building with default java ($(java -version 2>&1 | head -1))" >&2
fi

mvn clean install -DskipTests

# add "react-scripts --openssl-legacy-provider build/start to
# package.json in quack/ui/src

