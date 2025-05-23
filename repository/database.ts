import { configDotenv } from 'dotenv';
import { Collection, Db, MongoClient } from 'mongodb';
import { IApiKey } from './apiKey.repository';
import { ISeason } from './seasons.repository';
import { IPlayer } from './player.repository';
import { ITeam } from './team.repository';

export interface IHockeyTrackerCollections {
    seasons?: Collection<ISeason>;
    apiKeys?: Collection<IApiKey>;
    player?: Collection<IPlayer>;
    team?: Collection<ITeam>;
}

export const collections: IHockeyTrackerCollections = {};

let client: MongoClient;

export async function connectToDatabase() {
    configDotenv();

    client = new MongoClient(process.env.DB_CONN_STRING as string);

    await client.connect();

    const db: Db = client.db('HockeyTracker');

    const apiKeyCollection: Collection<IApiKey> =
        db.collection<IApiKey>('ApiKeys');
    const seasonsCollection: Collection<ISeason> =
        db.collection<ISeason>('Seasons');
    const playerCollection: Collection<IPlayer> =
        db.collection<IPlayer>('Player');
    const teamCollection: Collection<ITeam> = db.collection<ITeam>('Team');

    collections.seasons = seasonsCollection;
    collections.apiKeys = apiKeyCollection;
    collections.player = playerCollection;
    collections.team = teamCollection;

    console.log(
        `Successfully connected to database: ${db.databaseName} and collections: `
    );

    Object.keys(collections).forEach((key) => {
        console.log(`${key}`);
    });
}

export function closeClientConnection() {
    client.close();
}
