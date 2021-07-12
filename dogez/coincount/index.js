const { CosmosClient } = require("@azure/cosmos");


// initialization
const cosmosEndpoint = process.env.COSMOS_ENDPOINT;
const cosmosKey = process.env.COSMOS_KEY;
const client = cosmosEndpoint != null && cosmosKey != null
    ? new CosmosClient({endpoint: cosmosEndpoint, key: cosmosKey})
    : null;

const database = client != null ? client.database('Shiptasks') : null;

const tableName = 'visitors';
const table = database != null ? database.container(tableName) : null;


// execute with Azure Functions
module.exports = async function (context, req) {
    main(context);
}


// execute locally
console.log(main(null));


async function main(context){
	
	if(!table){
        console.log("'table' not initialized");
		if(context != null){
			context.res = {
				status: 500,
				body: {
					error: 'table not initialized'
				}
			};
		}
    }
	try {
		const id = '1';
		//await deleteVisitorCount(context, id);
		
		let visitorCount = await retrieveVisitorCount(context, id);
		if (visitorCount){
			visitorCount = await updateVisitorCount(context, id, visitorCount);
		} else {
			visitorCount = await createVisitorCount(context, id);
		}
		
		if(context != null){
			context.res = {
				status: 200,
				body: {
					visitors: visitorCount
				}
			};
		}
	}
	catch(err){
		console.log(`error: ${err}`);
	}
}

async function createVisitorCount(context, id){
    console.log(`create: table: ${tableName}, id: ${id}`);
    const { resource: createResponse } = await table.items.create({
        id, visitorCount: 1
    });
    console.log(`'createResponse': ${JSON.stringify(createResponse)}`);
    return createResponse;
}

async function retrieveVisitorCount(context, id){
    console.log(`retrieve: table: ${tableName}, id: ${id}`);
    const { resources: retrieveResponse } = await table.items
        .query({query: `select c.visitorCount from c where c.id = ${id}`})
        .fetchAll();
		
	console.log(`'retrieveResponse': ${JSON.stringify(retrieveResponse)}`);
    return retrieveResponse != null ? retrieveResponse[0].visitorCount : null;
}

async function updateVisitorCount(context, id, currentVisitorCount){
    console.log(`update: table: ${tableName}, id: ${id}`);
    const { resource: updateResponse } = await table.item(id).replace({
        id, visitorCount: currentVisitorCount + 1
    });
    console.log(`'updateResponse': ${JSON.stringify(updateResponse)}`);
    return updateResponse;
}

async function deleteVisitorCount(context, id){
    console.log(`delete: table: ${tableName}, id: ${id}`);
    const { resource: deleteResponse } = await table.item(id).delete();
    console.log(`'deleteResponse': ${JSON.stringify(deleteResponse)}`);
}


