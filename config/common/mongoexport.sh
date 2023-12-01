#!/bin/bash
collection_prefix=$1
mongoexport --collection=$1_Event --db=dokimion --username=admin --authenticationDatabase=admin --out=$1_Event.json
mongoexport --collection=$1_Comment --db=dokimion --username=admin --authenticationDatabase=admin --out=$1_Comment.json
mongoexport --collection=$1_Attribute --db=dokimion --username=admin --authenticationDatabase=admin --out=$1_Attribute.json
mongoexport --collection=$1_Launch --db=dokimion --username=admin --authenticationDatabase=admin --out=$1_Launch.json
mongoexport --collection=$1_TestCase --db=dokimion --username=admin --authenticationDatabase=admin --out=$1_TestCase.json
mongoexport --collection=$1_TestSuite --db=dokimion --username=admin --authenticationDatabase=admin --out=$1_TestSuite.json
