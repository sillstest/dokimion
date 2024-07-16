#!/bin/bash -x


cd /home/dokimion/dokimion

/usr/bin/java  -Dspring.hazelcast.enable=false -XX:+UseParallelGC -XX:-UseCompressedOops -Xmx1500m -XX:+HeapDumpOnOutOfMemoryError -XX:MetaspaceSize=500m -XX:MaxMetaspaceSize=7000m -Dmail.debug=true -Xbootclasspath/a:/etc/dokimion -jar /home/dokimion/dokimion/jetty-runner.jar /home/dokimion/dokimion/dokimion.war | awk -v SERVER_NO=$1 '{printf "dokimion_server_" SERVER_NO; print $0}' | logger -p user.info



