//
// create and populate TestCaseSizes collection
//
db = db.getSiblingDB('dokimion')

db.DefaultProjectAttributes.updateOne( 
	{ project: "paratext" }, 
	{ $setOnInsert: {project: "paratext", attributes: ["Full Regression", "Manual", "All"]}}, 
	{upsert: true}
)


