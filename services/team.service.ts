import { PlayerErrors, TeamErrors } from '../helpers/error-helper';
import { generateIdWithPrefix } from '../helpers/id-helper';
import {
    AddTeamToPlayerByIdFromDatabase,
    GetPlayerByIdFromDatabase,
} from '../repository/player.repository';
import {
    AddPlayerToTeamInDatabase,
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
// TODO: Refactor this code so that errors are thrown in the correct place
export const addPlayerToTeam = async (
    teamId: string,
    playerId: string,
    playerNumber: number
): Promise<ITeam> => {
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

    const numberAlreadyInUse = team.players.some(
        (player) => player.number === playerNumber
    );

    if (numberAlreadyInUse) {
        throw TeamErrors.PLAYER_NUMBER_IN_USE;
    }

    const newPlayer = {
        playerId,
        number: playerNumber,
    };

    const updatedTeamResult = await AddPlayerToTeamInDatabase(
        newPlayer,
        teamId
    );

    if (!updatedTeamResult || updatedTeamResult.modifiedCount === 0) {
        throw TeamErrors.PLAYER_NOT_ADDED;
    }

    const updatedPlayerResult = await AddTeamToPlayerByIdFromDatabase(
        { teamId, number: playerNumber },
        playerId
    );

    if (!updatedPlayerResult || updatedPlayerResult.modifiedCount === 0) {
        throw PlayerErrors.TEAM_NOT_ADDED;
    }
    // TODO: Return the updated team
    team.players.push(newPlayer);

    return team;
};
