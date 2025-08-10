import { InsertOneResult } from 'mongodb';
import { collections } from './database';
import { TeamErrors } from '../helpers/error-helper';
import { IPlayerStats } from './player.repository';

export interface ITeamStats {
    seasonId: string;
    gamesPlayed: number;
    goals: number;
    assists: number;
    pims: number;
}

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
    stats: ITeamStats[];
};

/**
 * @description This is a type that contains the details of the players that the team has.
 * @property playerId - The id of the player that the team has.
 * @property number - The number of the player on the team.
 */
export type ITeamPlayerDetails = {
    playerId: string;
    number: number;
    stats: IPlayerStats[];
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

export async function GetAllTeamsFromDatabase() {
    const teams = await collections.team?.find<ITeam>({}).toArray();

    return teams ?? [];
}

export async function GetTeamByIdFromDatabase(id: string) {
    const team = await collections.team?.findOne<ITeam>({ _id: id });

    if (!team) {
        throw TeamErrors.TEAM_NOT_FOUND;
    }

    return team;
}

export async function RemoveTeamByIdFromDatabase(id: string) {
    const deleteResult = await collections.team?.deleteOne({ _id: id });

    if (!deleteResult || deleteResult.deletedCount === 0) {
        throw TeamErrors.TEAM_NOT_FOUND;
    }
}

export async function UpdateTeamDetailsByIdFromDatabase(
    id: string,
    updatedDetails: ITeam
) {
    const updateResult = await collections.team?.updateOne(
        { _id: id },
        {
            $set: {
                name: updatedDetails.name,
            },
        }
    );

    if (!updateResult || updateResult.modifiedCount === 0) {
        throw TeamErrors.TEAM_NOT_FOUND;
    }
}

export async function AddPlayerToTeamByIdFromDatabase(
    player: ITeamPlayerDetails,
    teamId: string
) {
    const updateResult = await collections.team?.updateOne(
        { _id: teamId },
        {
            $push: {
                players: player,
            },
        }
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

/**
 * This method will add a stats object to a team in the database
 * It assumes that the team does NOT have a stats object. If they do this will fail.
 * In the event something goes wrong, it will throw an error and get caught.
 * No return because all logic based on this result is done in this method.
 *
 * @param teamId The teamId to add stats to
 * @param seasonId  The seasonId to add stats for
 */
export async function AddStatsObjectToTeamInDatabase(
    teamId: string,
    seasonId: string
) {
    await collections.team?.updateOne(
        { _id: teamId, 'stats.seasonId': { $ne: seasonId } },
        {
            $push: {
                stats: {
                    seasonId: seasonId,
                    gamesPlayed: 0,
                    goals: 0,
                    assists: 0,
                    pims: 0
                }
            }
        }
    );

    // Verify the update worked
    const updatedTeam = await collections.team?.findOne({
        _id: teamId,
        'stats.seasonId': seasonId
    });

    if (!updatedTeam) {
        console.warn('Failed to add stats to team');
        throw TeamErrors.STATS_NOT_ADDED;
    }
}

/**
 * This method will add a stats object to players in a team in the database
 * It assumes that the players do NOT have a stats object. If they do this will fail.
 * In the event something goes wrong, it will throw an error and get caught.
 * No return because all logic based on this result is done in this method.
 *
 * @param teamId The teamId to add stats to
 * @param seasonId  The seasonId to add stats for
 */
export async function AddStatsObjectToPlayersInTeamInDatabase(
    teamId: string,
    seasonId: string
) {
    // Only add stats to players who don't already have stats for this season
    await collections.team?.updateOne(
        { 
            _id: teamId
        },
        {
            $push: {
                'players.$[player].stats': {
                    seasonId: seasonId,
                    gamesPlayed: 0,
                    goals: 0,
                    assists: 0,
                    pims: 0
                }
            }
        },
        {
            arrayFilters: [
                { 'player.stats.seasonId': { $ne: seasonId } }
            ]
        }
    );
            

    // Verify the update worked
    const updatedTeam = await collections.team?.findOne({
        _id: teamId,
        'players.stats.seasonId': seasonId
    });

    if (!updatedTeam) {
        console.warn('Failed to add stats to team');
        throw TeamErrors.STATS_NOT_ADDED;
    }
}

export async function IncrementGamesPlayedForTeamPlayerInDatabase(playerIds: string[], seasonId: string ) {
    const updateResult = await collections.team?.updateMany(
        { 
            'players.playerId': { $in: playerIds }, 
            'players.stats.seasonId': seasonId 
        },
        {
            $inc: {
                'players.$[player].stats.$[stat].gamesPlayed': 1
            }
        },
        {
            arrayFilters: [
                { 'player.playerId': { $in: playerIds } },
                { 'stat.seasonId': seasonId }
            ]
        }
    );
    
    if (!updateResult || updateResult.acknowledged === false) {
        throw TeamErrors.STATS_NOT_UPDATED;
    }
    
    // Verify all players exist with the given season stats
    const verificationResult = await collections.team?.aggregate([
        { $unwind: '$players' },
        { $unwind: '$players.stats' },
        {
            $match: {
                'players.playerId': { $in: playerIds },
                'players.stats.seasonId': seasonId
            }
        },
        {
            $group: {
                _id: null,
                count: { $sum: 1 }
            }
        }
    ]).toArray();
    
    const actualCount = verificationResult?.[0]?.count || 0;
    if (actualCount !== playerIds.length) {
        throw TeamErrors.STATS_NOT_UPDATED;
    }
}

export async function IncrementGamesPlayedForTeamInDatabase(teamId: string, seasonId: string ) {
    const updateResult = await collections.team?.updateOne(
        { _id: teamId, 'stats.seasonId': seasonId },
        {
            $inc: {
                'stats.$.gamesPlayed': 1
            }
        }
    );
    
    // Verify all players were updated
    if (!updateResult || updateResult.modifiedCount !== 1) {
        throw TeamErrors.STATS_NOT_UPDATED;
    }
}

/**
 * This method will increment the goals for a team and a specific player in the database
 * It updates both the team's overall goal stats and the individual player's goal stats
 * It assumes that both the team and player have stats objects for the given season.
 * 
 * @param teamId - The ID of the team to increment goals for
 * @param playerId - The ID of the player who scored the goal
 * @param seasonId - The season ID to increment goals for
 */
export async function IncrementGoalsForTeamInDatabase(teamId: string, playerId: string, seasonId: string) {
    // Update team's overall goal stats
    const teamUpdateResult = await collections.team?.updateOne(
        { _id: teamId, 'stats.seasonId': seasonId },
        {
            $inc: {
                'stats.$.goals': 1
            }
        }
    );
    
    if (!teamUpdateResult || teamUpdateResult.modifiedCount !== 1) {
        throw TeamErrors.STATS_NOT_UPDATED;
    }

    // Update individual player's goal stats within the team
    const playerUpdateResult = await collections.team?.updateOne(
        { 
            _id: teamId,
            'players.playerId': playerId, 
            'players.stats.seasonId': seasonId 
        },
        {
            $inc: {
                'players.$[player].stats.$[stat].goals': 1
            }
        },
        {
            arrayFilters: [
                { 'player.playerId': playerId },
                { 'stat.seasonId': seasonId }
            ]
        }
    );
    
    if (!playerUpdateResult || playerUpdateResult.modifiedCount !== 1) {
        throw TeamErrors.STATS_NOT_UPDATED;
    }
}

/**
 * This method will increment the assists for a team and a specific player in the database
 * It updates both the team's overall assist stats and the individual player's assist stats
 * It assumes that both the team and player have stats objects for the given season.
 * 
 * @param teamId - The ID of the team to increment assists for
 * @param playerId - The ID of the player who got the assist
 * @param seasonId - The season ID to increment assists for
 */
export async function IncrementAssistsForTeamInDatabase(teamId: string, playerId: string, seasonId: string) {
    // Update team's overall assist stats
    const teamUpdateResult = await collections.team?.updateOne(
        { _id: teamId, 'stats.seasonId': seasonId },
        {
            $inc: {
                'stats.$.assists': 1
            }
        }
    );
    
    if (!teamUpdateResult || teamUpdateResult.modifiedCount !== 1) {
        throw TeamErrors.STATS_NOT_UPDATED;
    }

    // Update individual player's assist stats within the team
    const playerUpdateResult = await collections.team?.updateOne(
        { 
            _id: teamId,
            'players.playerId': playerId, 
            'players.stats.seasonId': seasonId 
        },
        {
            $inc: {
                'players.$[player].stats.$[stat].assists': 1
            }
        },
        {
            arrayFilters: [
                { 'player.playerId': playerId },
                { 'stat.seasonId': seasonId }
            ]
        }
    );
    
    if (!playerUpdateResult || playerUpdateResult.modifiedCount !== 1) {
        throw TeamErrors.STATS_NOT_UPDATED;
    }
}

/**
 * This method will increment the penalty minutes (PIMS) for a team and a specific player in the database
 * It updates both the team's overall PIMS stats and the individual player's PIMS stats
 * It assumes that both the team and player have stats objects for the given season.
 * 
 * @param teamId - The ID of the team to increment PIMS for
 * @param playerId - The ID of the player who got the penalty
 * @param seasonId - The season ID to increment PIMS for
 * @param penaltyMinutes - The number of penalty minutes to add (default: 2)
 */
export async function IncrementPimsForTeamInDatabase(teamId: string, playerId: string, seasonId: string, penaltyMinutes: number = 2) {
    // Update team's overall PIMS stats
    const teamUpdateResult = await collections.team?.updateOne(
        { _id: teamId, 'stats.seasonId': seasonId },
        {
            $inc: {
                'stats.$.pims': penaltyMinutes
            }
        }
    );
    
    if (!teamUpdateResult || teamUpdateResult.modifiedCount !== 1) {
        throw TeamErrors.STATS_NOT_UPDATED;
    }

    // Update individual player's PIMS stats within the team
    const playerUpdateResult = await collections.team?.updateOne(
        { 
            _id: teamId,
            'players.playerId': playerId, 
            'players.stats.seasonId': seasonId 
        },
        {
            $inc: {
                'players.$[player].stats.$[stat].pims': penaltyMinutes
            }
        },
        {
            arrayFilters: [
                { 'player.playerId': playerId },
                { 'stat.seasonId': seasonId }
            ]
        }
    );
    
    if (!playerUpdateResult || playerUpdateResult.modifiedCount !== 1) {
        throw TeamErrors.STATS_NOT_UPDATED;
    }
}

/**
 * This method will decrement the goals for a team and a specific player in the database
 * It updates both the team's overall goal stats and the individual player's goal stats
 * It assumes that both the team and player have stats objects for the given season.
 * 
 * @param teamId - The ID of the team to decrement goals for
 * @param playerId - The ID of the player who scored the goal
 * @param seasonId - The season ID to decrement goals for
 */
export async function DecrementGoalsForTeamInDatabase(teamId: string, playerId: string, seasonId: string) {
    // Update team's overall goal stats
    const teamUpdateResult = await collections.team?.updateOne(
        { _id: teamId, 'stats.seasonId': seasonId },
        {
            $inc: {
                'stats.$.goals': -1
            }
        }
    );
    
    if (!teamUpdateResult || teamUpdateResult.modifiedCount !== 1) {
        throw TeamErrors.STATS_NOT_UPDATED;
    }

    // Update individual player's goal stats within the team
    const playerUpdateResult = await collections.team?.updateOne(
        { 
            _id: teamId,
            'players.playerId': playerId, 
            'players.stats.seasonId': seasonId 
        },
        {
            $inc: {
                'players.$[player].stats.$[stat].goals': -1
            }
        },
        {
            arrayFilters: [
                { 'player.playerId': playerId },
                { 'stat.seasonId': seasonId }
            ]
        }
    );
    
    if (!playerUpdateResult || playerUpdateResult.modifiedCount !== 1) {
        throw TeamErrors.STATS_NOT_UPDATED;
    }
}

/**
 * This method will decrement the assists for a team and a specific player in the database
 * It updates both the team's overall assist stats and the individual player's assist stats
 * It assumes that both the team and player have stats objects for the given season.
 * 
 * @param teamId - The ID of the team to decrement assists for
 * @param playerId - The ID of the player who got the assist
 * @param seasonId - The season ID to decrement assists for
 */
export async function DecrementAssistsForTeamInDatabase(teamId: string, playerId: string, seasonId: string) {
    // Update team's overall assist stats
    const teamUpdateResult = await collections.team?.updateOne(
        { _id: teamId, 'stats.seasonId': seasonId },
        {
            $inc: {
                'stats.$.assists': -1
            }
        }
    );
    
    if (!teamUpdateResult || teamUpdateResult.modifiedCount !== 1) {
        throw TeamErrors.STATS_NOT_UPDATED;
    }

    // Update individual player's assist stats within the team
    const playerUpdateResult = await collections.team?.updateOne(
        { 
            _id: teamId,
            'players.playerId': playerId, 
            'players.stats.seasonId': seasonId 
        },
        {
            $inc: {
                'players.$[player].stats.$[stat].assists': -1
            }
        },
        {
            arrayFilters: [
                { 'player.playerId': playerId },
                { 'stat.seasonId': seasonId }
            ]
        }
    );
    
    if (!playerUpdateResult || playerUpdateResult.modifiedCount !== 1) {
        throw TeamErrors.STATS_NOT_UPDATED;
    }
}

/**
 * This method will decrement the penalty minutes (PIMS) for a team and a specific player in the database
 * It updates both the team's overall PIMS stats and the individual player's PIMS stats
 * It assumes that both the team and player have stats objects for the given season.
 * 
 * @param teamId - The ID of the team to decrement PIMS for
 * @param playerId - The ID of the player who got the penalty removed
 * @param seasonId - The season ID to decrement PIMS for
 * @param penaltyMinutes - The number of penalty minutes to subtract (default: 2)
 */
export async function DecrementPimsForTeamInDatabase(teamId: string, playerId: string, seasonId: string, penaltyMinutes: number = 2) {
    // Update team's overall PIMS stats
    const teamUpdateResult = await collections.team?.updateOne(
        { _id: teamId, 'stats.seasonId': seasonId },
        {
            $inc: {
                'stats.$.pims': -penaltyMinutes
            }
        }
    );
    
    if (!teamUpdateResult || teamUpdateResult.modifiedCount !== 1) {
        throw TeamErrors.STATS_NOT_UPDATED;
    }

    // Update individual player's PIMS stats within the team
    const playerUpdateResult = await collections.team?.updateOne(
        { 
            _id: teamId,
            'players.playerId': playerId, 
            'players.stats.seasonId': seasonId 
        },
        {
            $inc: {
                'players.$[player].stats.$[stat].pims': -penaltyMinutes
            }
        },
        {
            arrayFilters: [
                { 'player.playerId': playerId },
                { 'stat.seasonId': seasonId }
            ]
        }
    );
    
    if (!playerUpdateResult || playerUpdateResult.modifiedCount !== 1) {
        throw TeamErrors.STATS_NOT_UPDATED;
    }
}
