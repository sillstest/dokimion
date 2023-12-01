#!/bin/bash
collection_prefix=$1
mongoimport --collection=paratextlite_Event --db=dokimion --username=admin --authenticationDatabase=admin --out=paratextlite_Event.json
