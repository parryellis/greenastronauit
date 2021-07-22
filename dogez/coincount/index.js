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
	try {
		await main(context, req);
	}
	catch(err){
		log(context,'root', `error: ${err}`);
	}
}

// uncomment to execute locally
// main(null, null);

async function main(context, req){
	log(context,'main', `'req': ${req}`);

	if(!table){
        log(context, 'main', "'table' not initialized");
		if(context != null){
			context.res = {
				status: 500,
				body: {
					error: 'table not initialized'
				}
			};
		}
    }
	const id = '1';
	log(context,'main', `'table': ${tableName}, 'id': ${id}`);
	try {
		let visitorCount = await retrieveVisitorCount(context, id);
		if (visitorCount){
			visitorCount = await updateVisitorCount(context, id, visitorCount);
		} else {
			visitorCount = await createVisitorCount(context, id);
		}

		const result = {
			status: 200,
			body: {
				visitors: visitorCount
			}
		};
		
		if(context != null){
			context.res = result;
		} else {
			log(context,'main', `'result': ${JSON.stringify(result)}`)
		}
	}
	catch(err){
		log(context, 'main', `'error': ${err}`);
	}
}

async function createVisitorCount(context, id){
    const { resource: createResponse } = await table.items.create({
        id, visitorCount: 1
    });
	const visitorCount = createResponse.visitorCount;
	log(context, 'createVisitorCount', `'visitorCount': ${visitorCount}`);
	return visitorCount;
}

async function retrieveVisitorCount(context, id){
    const { resources: retrieveResponse } = await table.items
        .query({query: `select * from c where c.id = "${id}"`})
        .fetchAll();

    const visitorCount = retrieveResponse?.length > 0 ? retrieveResponse[0].visitorCount : null;
	log(context, 'retrieveVisitorCount',`'visitorCount': ${visitorCount}`);
    return visitorCount;
}

async function updateVisitorCount(context, id, currentVisitorCount){
    const { resource: updateResponse } = await table.item(id).replace({
        id, visitorCount: currentVisitorCount + 1
    });

    const visitorCount = updateResponse.visitorCount;
    log(context, 'updateVisitorCount', `'visitorCount': ${visitorCount}`);
    return visitorCount;
}

function log(context, method, message){
	const spaces = 20 - method.length;
	(context != null ? context : console).log(`${method}${" ".repeat(spaces)} -- ${message}`);
}


