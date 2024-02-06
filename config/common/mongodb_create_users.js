db = db.getSiblingDB('admin')

db.createUser(
{
   user: "admin",
   pwd: passwordPrompt(),
   roles: [
      { role: "userAdminAnyDatabase", db: "admin" },
      { role: "readWriteAnyDatabase", db: "admin" }
   ]
})

db = db.getSiblingDB('admin')

db.createUser(
{
   user: "dokimion",
   pwd: passwordPrompt(),
   roles: [
      { role: "userAdmin", db: "dokimion" },
      { role: "readWrite", db: "dokimion" }
   ]
})
