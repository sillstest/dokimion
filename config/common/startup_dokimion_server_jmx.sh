#!/bin/bash -x


cd /home/dokimion/dokimion

/usr/bin/java -Dcom.sun.management.jmxremote=true -Dcom.sun.management.jmxremote.port=1234 -Dcom.sun.management.jmxremote.rmi.port=1234 -Dcom.sun.management.jmxremote.authenticate=false -Dcom.sun.management.jmxremote.ssl=false -Dspring.hazelcast.enable=false -XX:+UseParallelGC -XX:-UseCompressedOops -Xmx2000m -XX:+HeapDumpOnOutOfMemoryError -XX:MetaspaceSize=2000m -XX:MaxMetaspaceSize=7000m -Dmail.debug=true -Xbootclasspath/a:/etc/dokimion -jar /home/dokimion/dokimion/jetty-runner.jar /home/dokimion/dokimion/dokimion.war | awk -v SERVER_NO=$1 '{printf "dokimion_server_" SERVER_NO; print $0}' | logger -p user.info



