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
   pwd: "AZY5gV305EZQxDYp4l4ob4cLiKK7QEnLtP9Hcui5GYg=",
   roles: [
      { role: "userAdmin", db: "dokimion" },
      { role: "readWrite", db: "dokimion" }
   ]
})
