#!/bin/sh

# $1 - SERVER_NO

cd /home/dokimion/dokimion
/usr/bin/javac RoleCapability.java aes.java
/usr/bin/java RoleCapability
/usr/bin/javac TestcaseSizes.java aes.java AdminPassword.java
/usr/bin/java TestcaseSizes

/usr/bin/java -Dmail.debug=true -Xbootclasspath/a:/etc/dokimion -jar /home/dokimion/dokimion/jetty-runner.jar /home/dokimion/dokimion/dokimion.war | awk -v SERVER_NO=$1 '{printf "dokimion_server_" SERVER_NO; print $0}' | logger -p user.info



