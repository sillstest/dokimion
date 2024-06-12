//
// create and populate ConfigurationAttributes collection
//
db = db.getSiblingDB('dokimion')

db.ConfigurationAttributes.update( 
	{ project: "dokimionls" }, 
	{ $setOnInsert: {project: "dokimionls", names: ["OS", "display", "keyboard"]}}, 
	{upsert: true}
)



