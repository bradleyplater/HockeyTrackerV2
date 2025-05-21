import { InsertOneResult } from 'mongodb';
import { collections } from './database';

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
        throw new Error('Team not created');
    }

    return storedPlayer;
}

export async function GetAllTeamsFromDatabase() {
    return await collections.team?.find<ITeam>({}).toArray();
}

export async function GetTeamByIdFromDatabase(id: string) {
    return await collections.team?.findOne<ITeam>({ _id: id });
}

export async function AddPlayerToTeamInDatabase(
    playerToAdd: ITeamPlayerDetails,
    teamId: string
) {
    return await collections.team?.updateOne(
        { _id: teamId },
        { $push: { players: playerToAdd } }
    );
}
