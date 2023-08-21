#!/bin/sh

rs.initiate()
rs.add(( { _id: 1, host: "mongod1.replset.member:27018" } )
rs.add(( { _id: 2, host: "mongod2.replset.member:27017" } )
rs.conf()


