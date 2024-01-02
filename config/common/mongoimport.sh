#!/bin/bash
collection_prefix=$1
if test -f $1_Event.json; then
   mongoimport --collection=$1_Event --db=dokimion --username=admin --authenticationDatabase=admin --file=$1_Event.json
fi
if test -f $1_Comment.json; then
   mongoimport --collection=$1_Comment --db=dokimion --username=admin --authenticationDatabase=admin --file=$1_Comment.json
fi
if test -f $1_Attribute.json; then
   mongoimport --collection=$1_Attribute --db=dokimion --username=admin --authenticationDatabase=admin --file=$1_Attribute.json
fi
if test -f $1_Launch.json; then
   mongoimport --collection=$1_Launch --db=dokimion --username=admin --authenticationDatabase=admin --file=$1_Launch.json
fi
if test -f $1_TestCase.json; then
   mongoimport --collection=$1_TestCase --db=dokimion --username=admin --authenticationDatabase=admin --file=$1_TestCase.json
fi
if test -f $1_TestSuite.json; then
   mongoimport --collection=$1_TestSuite --db=dokimion --username=admin --authenticationDatabase=admin --file=$1_TestSuite.json
fi
