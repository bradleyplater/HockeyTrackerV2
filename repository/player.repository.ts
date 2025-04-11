import { InsertOneResult } from 'mongodb';
import { collections } from './database';

export interface IPlayer {
    _id: string;
    firstName: string;
    surname: string;
}

export async function InsertPlayerToDatabase(player: IPlayer) {
    const result = (await collections.player?.insertOne(
        player
    )) as InsertOneResult<IPlayer>;

    const storedPlayer = await collections.player?.findOne({
        _id: result.insertedId,
    });

    if (!storedPlayer) {
        throw new Error('Player not created');
    }

    return storedPlayer;
}
