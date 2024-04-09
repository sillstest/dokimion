//
// create and populate TestCaseSizes collection
//
db = db.getSiblingDB('dokimion')

db.DefaultProjectAttributes.update( 
	{ project: "paratext" }, 
	{ $setOnInsert: {project: "paratext", attributes: ["Full Regression", "Manual", "All"]}}, 
	{upsert: true}
)


