import { PlayerErrors, TeamErrors } from '../helpers/error-helper';
import { generateIdWithPrefix } from '../helpers/id-helper';
import {
    AddTeamToPlayerByIdFromDatabase,
    GetAllPlayersFromDatabase,
    GetPlayerByIdFromDatabase,
    RemoveTeamFromPlayerInDatabase,
    UpdatePlayerNumberForTeamInDatabase,
} from '../repository/player.repository';
import {
    AddPlayerToTeamByIdFromDatabase,
    AddStatsObjectToTeamInDatabase,
    AddStatsObjectToPlayersInTeamInDatabase,
    GetTeamByIdFromDatabase,
    IncrementGamesPlayedForTeamInDatabase,
    IncrementGamesPlayedForTeamPlayerInDatabase,
    IncrementGoalsForTeamInDatabase,
    InsertTeamToDatabase,
    ITeam,
    RemovePlayerFromTeamInDatabase,
    UpdatePlayerNumberInTeamInDatabase,
} from '../repository/team.repository';

export const addTeamToDatabase = async (name: string) => {
    const newTeam = {
        _id: generateIdWithPrefix('TM'),
        name,
        players: [],
        stats: []
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
        stats: [],
    };

    await AddPlayerToTeamByIdFromDatabase(newPlayer, teamId);
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

/**
 * Updates a player's number for a specific team
 * @param teamId The id of the team to update the player's number for
 * @param playerId The id of the player to update the number for
 * @param newNumber The new number for the player
 * @returns The updated team
 */
export const updatePlayerNumber = async (
    teamId: string,
    playerId: string,
    newNumber: number
): Promise<ITeam> => {
    const team = await GetTeamByIdFromDatabase(teamId);

    const player = await GetPlayerByIdFromDatabase(playerId);

    if (!playerExistsOnTeam(team, player._id)) {
        throw PlayerErrors.PLAYER_NOT_ON_TEAM;
    }

    const numberAlreadyInUse = team.players.some(
        (p) => p.number === newNumber && p.playerId !== playerId
    );

    if (numberAlreadyInUse) {
        throw TeamErrors.PLAYER_NUMBER_IN_USE;
    }

    await UpdatePlayerNumberInTeamInDatabase(teamId, playerId, newNumber);
    await UpdatePlayerNumberForTeamInDatabase(playerId, teamId, newNumber);

    // Refresh team object to return updated version
    return await GetTeamByIdFromDatabase(teamId);
};

export const addGameToTeam = async (teamId: string, roster: string[], seasonId: string) => {
    const team = await GetTeamByIdFromDatabase(teamId);

    const playerIds = team.players
    .filter(player => roster.includes(player.playerId)) // Only players in the roster
    .filter(player => !player.stats.some(stat => stat.seasonId === seasonId)) // Who don't have stats for this season
    .map(player => player.playerId);

    await AddStatsObjectToPlayersInTeamInDatabase(teamId, seasonId);

    const hasTeamStats = team.stats.some(stat => stat.seasonId === seasonId);

    if (!hasTeamStats) {
        await AddStatsObjectToTeamInDatabase(teamId, seasonId)
    }

    await IncrementGamesPlayedForTeamPlayerInDatabase(roster, seasonId);
    await IncrementGamesPlayedForTeamInDatabase(teamId, seasonId);
}

const playerExistsOnTeam = (team: ITeam, playerId: string) => {
    return team.players.some((player) => player.playerId === playerId);
};
