import { InsertOneResult } from 'mongodb';
import { collections } from './database';

export type ITeam = {
    _id: string;
    name: string;
    players: string[];
};

export async function InsertTeamToDatabase(team: ITeam) {
    const result = (await collections.team?.insertOne(
        team
    )) as InsertOneResult<ITeam>;

    const storedPlayer = await collections.team?.findOne({
        _id: result.insertedId,
    });

    if (!storedPlayer) {
        throw new Error('Player not created');
    }

    return storedPlayer;
}
