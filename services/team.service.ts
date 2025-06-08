import { PlayerErrors, TeamErrors } from '../helpers/error-helper';
import { generateIdWithPrefix } from '../helpers/id-helper';
import {
    AddTeamToPlayerByIdFromDatabase,
    GetPlayerByIdFromDatabase,
    RemoveTeamFromPlayerInDatabase,
} from '../repository/player.repository';
import {
    AddPlayerToTeamInDatabase,
    GetTeamByIdFromDatabase,
    InsertTeamToDatabase,
    ITeam,
    RemovePlayerFromTeamInDatabase,
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
    const team = await GetTeamByIdFromDatabase(teamId);

    const player = await GetPlayerByIdFromDatabase(playerId);

    if (playerExistsOnTeam(team, player._id)) {
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

    await AddPlayerToTeamInDatabase(newPlayer, teamId);
    await AddTeamToPlayerByIdFromDatabase(
        { teamId, number: playerNumber },
        playerId
    );

    team.players.push(newPlayer);

    return team;
};

export const removePlayerFromTeam = async (
    teamId: string,
    playerId: string
) => {
    const team = await GetTeamByIdFromDatabase(teamId);

    const player = await GetPlayerByIdFromDatabase(playerId);

    if (!playerExistsOnTeam(team, player._id)) {
        throw PlayerErrors.PLAYER_NOT_ON_TEAM;
    }

    await RemovePlayerFromTeamInDatabase(playerId, teamId);
    await RemoveTeamFromPlayerInDatabase(teamId, playerId);
};

const playerExistsOnTeam = (team: ITeam, playerId: string) => {
    return team.players.some((player) => player.playerId === playerId);
};
