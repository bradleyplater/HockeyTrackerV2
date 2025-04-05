import { configDotenv } from 'dotenv';
import { Collection, Db, MongoClient } from 'mongodb';

export interface IHockeyTrackerCollections {
    seasons?: Collection;
    apiKeys?: Collection;
}

export const collections: IHockeyTrackerCollections = {};

let client: MongoClient;

export async function connectToDatabase() {
    configDotenv();

    client = new MongoClient(process.env.DB_CONN_STRING as string);

    await client.connect();

    const db: Db = client.db('HockeyTracker');

    const apiKeyCollection: Collection = db.collection('ApiKeys');
    const seasonsCollection: Collection = db.collection('Seasons');

    collections.seasons = seasonsCollection;
    collections.apiKeys = apiKeyCollection;

    console.log(
        `Successfully connected to database: ${db.databaseName} and collection: ${seasonsCollection.collectionName}`
    );
}

export function closeClientConnection() {
    client.close();
}
