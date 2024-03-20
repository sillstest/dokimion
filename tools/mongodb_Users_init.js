//
// create and populate TestCaseSizes collection
//
db = db.getSiblingDB('dokimion')

db.users.updateMany(
   {}, 
   { $set: { "locked": false } }
)



