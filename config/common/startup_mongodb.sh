#!/bin/bash -x

cd ~/dokimion/tools

/usr/bin/javac RoleCapability.java aes.java AdminPassword.java
/usr/bin/java RoleCapability
/usr/bin/javac TestcaseSizes.java aes.java AdminPassword.java
/usr/bin/java TestcaseSizes
/usr/bin/javac DefaultProjectAttributes.java aes.java AdminPassword.java
/usr/bin/java DefaultProjectAttributes
/usr/bin/javac User.java aes.java AdminPassword.java
/usr/bin/java User



