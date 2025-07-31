import { InsertOneResult } from 'mongodb';
import { collections } from './database';
import { TeamErrors } from '../helpers/error-helper';
import { IPlayerStats } from './player.repository';

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

/**
 * This method will add a stats object to a player in the database
 * It assumes that the players do NOT have a stats object. If they do this will fail.
 * In the event something goes wrong, it will throw an error and get caught.
 * No return because all logic based on this result is done in this method.
 *
 * @param playerIds A list of playersIds to add stats to
 * @param seasonId  The seasonId to add stats for
 */
export async function AddStatsObjectToTeamPlayersInDatabase(
    playerIds: string[],
    teamId: string,
    seasonId: string
) {
    // First, get the team to work with the current data
    const team = await collections.team?.findOne({ _id: teamId });
    
    if (!team) {
        throw TeamErrors.TEAM_NOT_FOUND;
    }

    // Update each player individually
    for (const playerId of playerIds) {
        const playerIndex = team.players.findIndex(p => p.playerId === playerId);
        
        if (playerIndex !== -1) {
            // Check if player already has stats for this season
            const hasSeasonStats = team.players[playerIndex].stats.some(
                stat => stat.seasonId === seasonId
            );
            
            if (!hasSeasonStats) {
                // Add stats object to this specific player
                await collections.team?.updateOne(
                    { 
                        _id: teamId,
                        'players.playerId': playerId
                    },
                    {
                        $push: {
                            'players.$.stats': {
                                seasonId: seasonId,
                                gamesPlayed: 0,
                                goals: 0,
                                assists: 0,
                                pims: 0
                            }
                        }
                    }
                );
            }
        }
    }

    // Verify the update worked
    const updatedTeam = await collections.team?.findOne({
        _id: teamId,
        'players.stats.seasonId': seasonId
    });

    if (!updatedTeam) {
        console.warn('Failed to add stats to team players');
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

