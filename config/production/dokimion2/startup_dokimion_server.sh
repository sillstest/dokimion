#!/bin/bash -x


cd /home/dokimion/dokimion

/usr/bin/java -Dcom.management.jmx.remote.host=0.0.0.0 -Dcom.sun.management.jmxremote.registry.ssl=false -Djava.rmi.server.hostname=10.3.0.213 -Dcom.sun.management.jmxremote -Dcom.sun.management.jmxremote.port=12345 -Dcom.sun.management.jmxremote.rmi.port=12345 -Dcom.sun.management.jmxremote.authenticate=false -Dcom.sun.management.jmxremote.ssl=false -Dspring.hazelcast.enable=false -Xss512k -XX:+UseG1GC -XX:MaxGCPauseMillis=200 -XX:NewRatio=2 -verbose:gc -XX:+PrintGCDetails -Xloggc:gc.log -Xms1g -Xmx2g -verbose:gc -XX:+HeapDumpOnOutOfMemoryError -XX:MetaspaceSize=128m -XX:MaxMetaspaceSize=512m -Dmail.debug=true -Xbootclasspath/a:/etc/dokimion -jar /home/dokimion/dokimion/jetty-runner.jar /home/dokimion/dokimion/dokimion.war | awk -v SERVER_NO=$1 '{printf "dokimion_server_" SERVER_NO; print $0}' | logger -p user.info



