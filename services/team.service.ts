import { PlayerErrors, TeamErrors } from '../helpers/error-helper';
import { generateIdWithPrefix } from '../helpers/id-helper';
import { GetPlayerByIdFromDatabase } from '../repository/player.repository';
import {
    GetTeamByIdFromDatabase,
    InsertTeamToDatabase,
    ITeam,
} from '../repository/team.repository';

export const addTeamToDatabase = async (name: string) => {
    const newTeam = {
        _id: generateIdWithPrefix('TM'),
        name,
        players: [],
    };

    try {
        return await InsertTeamToDatabase(newTeam);
    } catch (error) {
        throw error;
    }
};

/**
 * Adds a given player to a given team
 * @param teamId The id of the team to add the player to
 * @param playerId The id of the player to add to the team
 * @param playerNumber The number of the player to add to the team (Must be unique for each team)
 * @returns The updated team

 */
export const addPlayerToTeam = async (
    teamId: string,
    playerId: string,
    playerNumber: number
): Promise<ITeam> => {
    // TODO: Find team and player, validate they exist else return an error
    const team = await GetTeamByIdFromDatabase(teamId);

    if (!team) {
        throw TeamErrors.TEAM_NOT_FOUND;
    }

    const player = await GetPlayerByIdFromDatabase(playerId);

    if (!player) {
        throw PlayerErrors.PLAYER_NOT_FOUND;
    }

    const playersAlreadyOnTeam = team.players.some(
        (teamPlayer) => teamPlayer.playerId === playerId
    );

    if (playersAlreadyOnTeam) {
        throw TeamErrors.PLAYER_ALREADY_ON_TEAM;
    }

    // TODO: Validate the player number is unique for the team
    const numberAlreadyInUse = team.players.some(
        (player) => player.number === playerNumber
    );

    if (numberAlreadyInUse) {
        throw TeamErrors.PLAYER_NUMBER_IN_USE;
    }

    // TODO: Update the team with the new player and their number
    // TODO: Update the polayer with the team id and number
    // TODO: Return the updated team

    return {} as ITeam;
};
