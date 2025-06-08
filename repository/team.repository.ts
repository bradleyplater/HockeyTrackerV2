import { InsertOneResult } from 'mongodb';
import { collections } from './database';
import { TeamErrors } from '../helpers/error-helper';

/**
 * @description This is a type that contains the details of the team.
 * @property _id - The id of the team.
 * @property name - The name of the team.
 * @property players - The players that the team has.
 */
export type ITeam = {
    _id: string;
    name: string;
    players: ITeamPlayerDetails[];
};

/**
 * @description This is a type that contains the details of the players that the team has.
 * @property playerId - The id of the player that the team has.
 * @property number - The number of the player on the team.
 */
export type ITeamPlayerDetails = {
    playerId: string;
    number: number;
};

export async function InsertTeamToDatabase(team: ITeam) {
    const result = (await collections.team?.insertOne(
        team
    )) as InsertOneResult<ITeam>;

    const storedPlayer = await collections.team?.findOne({
        _id: result.insertedId,
    });

    if (!storedPlayer) {
        throw TeamErrors.TEAM_NOT_CREATED;
    }

    return storedPlayer;
}

export async function GetAllTeamsFromDatabase(): Promise<ITeam[]> {
    const teams = await collections.team?.find<ITeam>({}).toArray();

    return teams ?? [];
}

export async function GetTeamByIdFromDatabase(id: string): Promise<ITeam> {
    const team = await collections.team?.findOne<ITeam>({ _id: id });

    if (!team) {
        throw TeamErrors.TEAM_NOT_FOUND;
    }

    return team;
}

/**
 * Will add a player to a team in the database
 * In the event something goes wrong, it will throw an error and get caught.
 * No return because all logic based on this result is done in this method.
 *
 * @param playerToAdd Player to add to the team
 * @param teamId Team to add the player to
 * @returns Promise<void> ()
 */
export async function AddPlayerToTeamInDatabase(
    playerToAdd: ITeamPlayerDetails,
    teamId: string
) {
    const updateResult = await collections.team?.updateOne(
        { _id: teamId },
        { $push: { players: playerToAdd } }
    );

    if (!updateResult || updateResult.modifiedCount === 0) {
        throw TeamErrors.PLAYER_NOT_ADDED;
    }
}

/**
 * Will remove a player from a team in the database
 * In the event something goes wrong, it will throw an error and get caught.
 * No return because all logic based on this result is done in this method.
 *
 * @param playerId ID of the player to remove from the team
 * @param teamId Team to remove the player from
 * @returns Promise<void>
 */
export async function RemovePlayerFromTeamInDatabase(
    playerId: string,
    teamId: string
) {
    const updateResult = await collections.team?.updateOne(
        { _id: teamId },
        { $pull: { players: { playerId: playerId } } }
    );

    if (!updateResult || updateResult.modifiedCount === 0) {
        throw TeamErrors.PLAYER_NOT_REMOVED;
    }
}
