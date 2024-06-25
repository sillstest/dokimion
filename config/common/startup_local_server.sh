#!/bin/bash

# $1 - SERVER_NO

cd /home/bob/dokimion

#/usr/bin/java -Xmx256m -XX:MetaspaceSize=128m -Dmail.debug=true -Xbootclasspath/a:/etc/dokimion -jar /home/bob/dokimion/assembly/target/lib/jetty-runner.jar /home/bob/dokimion/assembly/target/quack.war 

/usr/bin/java -Xmx256m -XX:MetaspaceSize=128m -Dmail.debug=true -Xbootclasspath/a:/etc/dokimion -jar /home/bob/dokimion/assembly/target/lib/jetty-runner.jar /home/bob/dokimion/assembly/target/quack.war | awk -v SERVER_NO=$1 '{printf "dokimion_server_" SERVER_NO; print $0}' | logger -p user.info




