#!/bin/bash -x


cd /home/dokimion/dokimion

/usr/bin/java -Dcom.management.jmx.remote.host=0.0.0.0 -Dcom.sun.management.jmxremote.registry.ssl=false -Djava.rmi.server.hostname=10.3.0.199 -Dcom.sun.management.jmxremote -Dcom.sun.management.jmxremote.port=12345 -Dcom.sun.management.jmxremote.rmi.port=12345 -Dcom.sun.management.jmxremote.authenticate=false -Dcom.sun.management.jmxremote.ssl=false -Dspring.hazelcast.enable=false -Xms1g -Xmx2g -XX:+UseG1GC -verbose:gc -XX:+PrintGCDetails -XX:+HeapDumpOnOutOfMemoryError -XX:MaxMetaspaceSize=512m -Xbootclasspath/a:/etc/dokimion -jar /home/dokimion/dokimion/jetty-runner.jar /home/dokimion/dokimion/dokimion.war | awk -v SERVER_NO=$1 '{printf "dokimion_server_" SERVER_NO; print $0}' | logger -p user.info



