//
// create and populate RoleCapability collection
//
db = db.getSiblingDB('dokimion')

db.RoleCapability.drop()
db.RoleCapability.insert({"role": "TESTER", "capability": "READ"})
db.RoleCapability.insert({"role": "TESTDEVELOPER", "capability": "READWRITE"})
db.RoleCapability.insert({"role": "ADMIN", "capability": "ADMIN"})

