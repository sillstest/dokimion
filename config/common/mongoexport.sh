#!/bin/bash
collection_prefix=$1
mongoexport --collection=paratextlite_Event --db=dokimion --username=admin --authenticationDa
tabase=admin --out=paratextlite_Event.json
