import { InsertOneResult } from 'mongodb';
import { collections } from './database';

/**
 * @description
 * This is a type that contains the details of a player.
 * @property _id - The id of the player.
 * @property firstName - The first name of the player.
 * @property surname - The surname of the player.
 * @property team - The teams that the player has been added to.
 */
export interface IPlayer {
    _id: string;
    firstName: string;
    surname: string;
    teams: IPlayerTeamDetails[];
}

/**
 * @description
 * This is a type that contains the details of the team that the player has been added to.
 * @property teamId - The id of the team that the player has been added to.
 * @property number - The number of the player on the team.
 */
export type IPlayerTeamDetails = {
    teamId: string;
    number: number;
};

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

export async function AddTeamToPlayerByIdFromDatabase(
    team: IPlayerTeamDetails,
    playerId: string
) {
    return await collections.player?.updateOne(
        { _id: playerId },
        {
            $push: {
                teams: team,
            },
        }
    );
}
