#!/bin/sh

# $1 - SERVER_NO

cd /home/dokimion/dokimion
/usr/bin/javac RoleCapability.java aes.java AdminPassword.java
/usr/bin/java RoleCapability
/usr/bin/javac TestcaseSizes.java aes.java AdminPassword.java
/usr/bin/java TestcaseSizes
/usr/bin/javac DefaultProjectAttributes.java aes.java AdminPassword.java
/usr/bin/java DefaultProjectAttributes
/usr/bin/javac User.java aes.java AdminPassword.java
/usr/bin/java User

/usr/bin/java -XX:MetaspaceSize32m -XX:MaxMetaspaceSize64m -Xms512m -Xmx1024m -Xss512k -Dmail.debug=true -Xbootclasspath/a:/etc/dokimion -jar /home/dokimion/dokimion/jetty-runner.jar /home/dokimion/dokimion/dokimion.war | awk -v SERVER_NO=$1 '{printf "dokimion_server_" SERVER_NO; print $0}' | logger -p user.info



