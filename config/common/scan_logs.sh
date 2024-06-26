#!/bin/bash
#
SERVERNO=$1
JAVAOUTMEM=`grep -i outofmem /var/log/syslog | grep java`
if [ -z "$JAVAOUTMEM" ]
then
  echo ""
else
  echo $JAVAOUTMEM | /usr/bin/mail -s "Java out of memory error" bob_beck@sil.org
fi
MONGOSOCK=`grep -i mongosocket /var/log/dokimion/dokimion_server_$SERVERNO.log`
if [ -z "$MONGOSOCK" ]
then
  echo ""
else
  echo $MONGOSOCK | /usr/bin/mail -s "Mongo Socket Exception" bob_beck@sil.org
fi


