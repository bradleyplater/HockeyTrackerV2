import { InsertOneResult } from 'mongodb';
import { collections } from './database';
import { PlayerErrors } from '../helpers/error-helper';

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
        throw PlayerErrors.PLAYER_NOT_CREATED;
    }

    return storedPlayer;
}

export async function GetAllPlayersFromDatabase() {
    const players = await collections.player?.find<IPlayer>({}).toArray();

    return players ?? [];
}

export async function GetPlayerByIdFromDatabase(id: string) {
    const player = await collections.player?.findOne<IPlayer>({ _id: id });

    if (!player) {
        throw PlayerErrors.PLAYER_NOT_FOUND;
    }

    return player;
}

export async function RemovePlayerByIdFromDatabase(id: string) {
    const deleteResult = await collections.player?.deleteOne({ _id: id });

    if (!deleteResult || deleteResult.deletedCount === 0) {
        throw PlayerErrors.PLAYER_NOT_FOUND;
    }
}

export async function UpdatePlayerDetailsByIdFromDatabase(
    id: string,
    updatedDetails: IPlayer
) {
    const updateResult = await collections.player?.updateOne(
        { _id: id },
        {
            $set: {
                firstName: updatedDetails.firstName,
                surname: updatedDetails.surname,
            },
        }
    );

    if (!updateResult || updateResult.modifiedCount === 0) {
        throw PlayerErrors.PLAYER_NOT_FOUND;
    }
}

export async function AddTeamToPlayerByIdFromDatabase(
    team: IPlayerTeamDetails,
    playerId: string
) {
    const updateResult = await collections.player?.updateOne(
        { _id: playerId },
        {
            $push: {
                teams: team,
            },
        }
    );

    if (!updateResult || updateResult.modifiedCount === 0) {
        throw PlayerErrors.TEAM_NOT_ADDED;
    }
}

/**
 * Will remove a team from a player in the database
 * In the event something goes wrong, it will throw an error and get caught.
 * No return because all logic based on this result is done in this method.
 *
 * @param teamId ID of the team to remove from the player
 * @param playerId Player to remove the team from
 * @returns Promise<void>
 */
export async function RemoveTeamFromPlayerInDatabase(
    teamId: string,
    playerId: string
) {
    const updateResult = await collections.player?.updateOne(
        { _id: playerId },
        { $pull: { teams: { teamId: teamId } } }
    );

    if (!updateResult || updateResult.modifiedCount === 0) {
        throw PlayerErrors.TEAM_NOT_REMOVED;
    }
}
