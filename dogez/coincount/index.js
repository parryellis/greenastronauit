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

module.exports = async function (context, req) {
    let visitorCount = queryVisitors(context);
    if(!visitorCount){
        visitorCount = createVisitors(context);
    }
    context.res = {
        status: !visitorCount ? 500 : 200,
        body: {
         visitors: visitorCount
        }
    };
}

console.log(main());

async function main(){
    return queryVisitors(null)
        .then(qRes => createVisitors(null, qRes)
            .then(cRes => createResponse(null, cRes))
            .catch(cErr => {
                console.log(`cErr: ${JSON.stringify(cErr)}`);
                return createResponse(null, cErr, cErr.status);
            })
        )
        .catch(qErr => {
            console.log(`qErr: ${JSON.stringify(qErr)}`);
            return createResponse(null, qErr, qErr.status);
        });
}

async function createResponse(context, data, status){
    let body;
    if(200 === status){
        body = {
            visitors: data
        }
    } else {
        body = {
            error: data
        }
    }
    return {status, body};
}


async function createVisitors(context, visitorCount){
    if(visitorCount){
        return visitorCount;
    }
    if(!table){
        console.log("'table' not initialized");
        return null;
    }
    console.log(`creating ${tableName}.visitorCount`);
    const { resource: createResponse } = await table.items.create({
        id: '1',
        visitorCount: 1
    });
    console.log(`'createResponse': ${JSON.stringify(createResponse)}`);
    return createResponse;
}

async function queryVisitors(context){
    if(!table){
        console.log("'table' not initialized");
        return null;
    }
    console.log(`querying ${tableName}.visitorCount`);
    const { resources: queryResponse } = await table.items
        .query({query: "select c.visitorCount from c where c.id = '1'"})
        .fetchAll();

    const visitorCount = queryResponse != null ? queryResponse.item : null;
    console.log(`'visitorCount': ${visitorCount}`);
    return visitorCount;
}
