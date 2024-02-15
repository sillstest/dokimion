#!/bin/sh
# set -x
# Shell script to monitor or watch the disk space
# It will send an email to $ADMIN, if the (free available) percentage of space is >= 90%.
# --------------------------------------------------------------------------------------------------------
# Set admin email so that you can get email.

num1=1
num2=2

if [ $num2 > $num1 ]
then
  echo "num2 > num1"
fi

ADMIN="bob_beck@sil.org"
# set alert level 90% is default
ALERT=40
# Exclude list of unwanted monitoring, if several partions then use "|" to separate the partitions.
# An example: EXCLUDE_LIST="/dev/hdd1|/dev/hdc5"
EXCLUDE_LIST="/auto/ripper|loop"
#
#::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
#
main_prog() {
  while read -r output;
  do
    #echo "Working on $output ..."
    usep=$(echo "$output" | awk '{ print $1}' | cut -d'%' -f1)
    partition=$(echo "$output" | awk '{print $2}')

    echo "usep: $usep"
    echo "partition: $partition"
    echo "ALERT: $ALERT"

    if [ $usep -ge $ALERT ]
    then
echo "usep >= alert"
      echo "Running out of space \"$partition ($usep%)\" on server $(hostname), $(date)" 

      HOST=`hostname`
      sed "s/hostname/$HOST/" < testmessage > _hostname_testmessage
      /usr/sbin/sendmail $ADMIN < _hostname_testmessage
      rm _hostname_testmessage

    fi
  done
 }
	        
if [ "$EXCLUDE_LIST" != "" ] ; then
  df -H | grep -vE "^Filesystem|tmpfs|cdrom|${EXCLUDE_LIST}" | awk '{print $5 " " $6}' | main_prog
else
  df -H | grep -vE "^Filesystem|tmpfs|cdrom" | awk '{print $5 " " $6}' | main_prog
fi
