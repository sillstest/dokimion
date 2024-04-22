//
// create and populate RoleCapability collection
//
db = db.getSiblingDB('dokimion')

db.RoleCapability.drop()
db.RoleCapability.insertOne({"role": "TESTER", "capability": "READ"})
db.RoleCapability.insertOne({"role": "TESTDEVELOPER", "capability": "READWRITE"})
db.RoleCapability.insertOne({"role": "ADMIN", "capability": "ADMIN"})
db.RoleCapability.insertOne({"role": "OBSERVERONLY", "capability": "READ"})
