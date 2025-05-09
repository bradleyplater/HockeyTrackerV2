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

export async function GetAllPlayersFromDatabase() {
    return await collections.player?.find<IPlayer>({}).toArray();
}

export async function GetPlayerByIdFromDatabase(id: string) {
    return await collections.player?.findOne<IPlayer>({ _id: id });
}

export async function RemovePlayerByIdFromDatabase(id: string) {
    return await collections.player?.deleteOne({ _id: id });
}

export async function UpdatePlayerDetailsByIdFromDatabase(
    id: string,
    updatedDetails: IPlayer
) {
    return await collections.player?.updateOne(
        { _id: id },
        {
            $set: {
                firstName: updatedDetails.firstName,
                surname: updatedDetails.surname,
            },
        }
    );
}
