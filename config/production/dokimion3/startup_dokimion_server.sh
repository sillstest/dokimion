#!/bin/bash -x


cd /home/dokimion/dokimion

# Java 21 upgrade: select a JDK-21 java for the runtime. Prefers a system-wide JDK 21 (install
# Temurin 21 to one of the paths below, readable by the 'dokimion' service user), or override by
# exporting JAVA_BIN. Falls back to /usr/bin/java (JDK 11) so a deploy never leaves no JVM.
# The '#!/bin/bash -x' trace logs which binary was chosen.
if [ -z "$JAVA_BIN" ]; then
  for c in /usr/lib/jvm/temurin-21-jdk-amd64/bin/java \
           /usr/lib/jvm/java-21-openjdk-amd64/bin/java \
           /opt/jdk-21/bin/java; do
    [ -x "$c" ] && JAVA_BIN="$c" && break
  done
fi
JAVA_BIN="${JAVA_BIN:-/usr/bin/java}"

"$JAVA_BIN" -Dcom.management.jmx.remote.host=0.0.0.0 -Dcom.sun.management.jmxremote.registry.ssl=false -Djava.rmi.server.hostname=10.3.0.145 -Dcom.sun.management.jmxremote -Dcom.sun.management.jmxremote.port=12345 -Dcom.sun.management.jmxremote.rmi.port=12345 -Dcom.sun.management.jmxremote.authenticate=false -Dcom.sun.management.jmxremote.ssl=false -Dspring.hazelcast.enable=false -Xms2g -Xmx4g -XX:+UseG1GC -verbose:gc -XX:+PrintGCDetails -XX:+HeapDumpOnOutOfMemoryError -XX:MaxMetaspaceSize=512m -Xbootclasspath/a:/etc/dokimion -jar /home/dokimion/dokimion/jetty-runner.jar /home/dokimion/dokimion/dokimion.war | awk -v SERVER_NO=$1 '{printf "dokimion_server_" SERVER_NO; print $0}' | logger -p user.info



