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
    position: string;
    teams: IPlayerTeamDetails[];
    stats: IPlayerStats[];
}

export interface IPlayerStats {
    seasonId: string;
    gamesPlayed: number;
    goals: number;
    assists: number;
    pims: number;
    manOfTheMatch: number;
    warriorOfTheGame: number;
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

/**
 * Updates a player's number for a specific team in the database
 * 
 * @param playerId ID of the player to update
 * @param teamId ID of the team to update the number for
 * @param newNumber The new number for the player
 * @returns Promise<void>
 */
export async function UpdatePlayerNumberForTeamInDatabase(
    playerId: string,
    teamId: string,
    newNumber: number
) {
    const updateResult = await collections.player?.updateOne(
        { _id: playerId, 'teams.teamId': teamId },
        { $set: { 'teams.$.number': newNumber } }
    );

    if (!updateResult || updateResult.matchedCount === 0) {
        throw PlayerErrors.PLAYER_NOT_FOUND;
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
export async function AddStatsObjectToPlayersInDatabase(
    playerIds: string[],
    seasonId: string
) {
    await collections.player?.updateMany(
        { _id: { $in: playerIds }, 'stats.seasonId': { $ne: seasonId } },
        {
            $push: {
                stats: {
                    seasonId: seasonId,
                    gamesPlayed: 0,
                    goals: 0,
                    assists: 0,
                    pims: 0,
                    manOfTheMatch: 0,
                    warriorOfTheGame: 0,
                },
            },
        }
    );

    const stillMissing =
        (await collections.player
            ?.find({
                _id: { $in: playerIds },
                'stats.seasonId': { $ne: seasonId },
            })
            .toArray()) ?? [];

    if (stillMissing.length > 0) {
        const failedIds = stillMissing.map((p) => p._id);
        console.warn('These player IDs failed to update:', failedIds);
        throw PlayerErrors.STATS_NOT_ADDED;
    }
}

/**
 * This method will increment the games played for a player in the database
 * It assumes that the players have a stats object. If they do not this will fail.
 * In the event something goes wrong, it will throw an error and get caught.
 * No return because all logic based on this result is done in this method.
 * 
 * @param playerIds 
 * @param seasonId 
 */
export async function IncrementGamesPlayedForPlayerInDatabase(playerIds: string[], seasonId: string ) {
    const updateResult = await collections.player?.updateMany(
        { _id: { $in: playerIds }, 'stats.seasonId': seasonId },
        {
            $inc: {
                'stats.$.gamesPlayed': 1
            }
        }
    );
    
    // Verify all players were updated
    if (!updateResult || updateResult.modifiedCount !== playerIds.length) {
        throw PlayerErrors.STATS_NOT_UPDATED;
    }
}

/**
 * This method will increment the goals for a player in the database
 * It assumes that the player has a stats object for the given season. If they do not this will fail.
 * In the event something goes wrong, it will throw an error and get caught.
 * No return because all logic based on this result is done in this method.
 * 
 * @param playerId - The ID of the player to increment goals for
 * @param seasonId - The season ID to increment goals for
 */
export async function IncrementGoalsForPlayerInDatabase(playerId: string, seasonId: string) {
    const updateResult = await collections.player?.updateOne(
        { _id: playerId, 'stats.seasonId': seasonId },
        {
            $inc: {
                'stats.$.goals': 1
            }
        }
    );
    
    // Verify the player was updated
    if (!updateResult || updateResult.modifiedCount !== 1) {
        throw PlayerErrors.STATS_NOT_UPDATED;
    }
}

export async function IncrementAssistsForPlayerInDatabase(playerId: string, seasonId: string) {
    const updateResult = await collections.player?.updateOne(
        { _id: playerId, 'stats.seasonId': seasonId },
        {
            $inc: {
                'stats.$.assists': 1
            }
        }
    );
    
    // Verify the player was updated
    if (!updateResult || updateResult.modifiedCount !== 1) {
        throw PlayerErrors.STATS_NOT_UPDATED;
    }
}

/**
 * This method will decrement the goals for a player in the database
 * It assumes that the player has a stats object for the given season. If they do not this will fail.
 * In the event something goes wrong, it will throw an error and get caught.
 * No return because all logic based on this result is done in this method.
 * 
 * @param playerId - The ID of the player to decrement goals for
 * @param seasonId - The season ID to decrement goals for
 */
export async function DecrementGoalsForPlayerInDatabase(playerId: string, seasonId: string) {
    const updateResult = await collections.player?.updateOne(
        { _id: playerId, 'stats.seasonId': seasonId },
        {
            $inc: {
                'stats.$.goals': -1
            }
        }
    );
    
    // Verify the player was updated
    if (!updateResult || updateResult.modifiedCount !== 1) {
        throw PlayerErrors.STATS_NOT_UPDATED;
    }
}

/**
 * This method will decrement the assists for a player in the database
 * It assumes that the player has a stats object for the given season. If they do not this will fail.
 * In the event something goes wrong, it will throw an error and get caught.
 * No return because all logic based on this result is done in this method.
 * 
 * @param playerId - The ID of the player to decrement assists for
 * @param seasonId - The season ID to decrement assists for
 */
export async function DecrementAssistsForPlayerInDatabase(playerId: string, seasonId: string) {
    const updateResult = await collections.player?.updateOne(
        { _id: playerId, 'stats.seasonId': seasonId },
        {
            $inc: {
                'stats.$.assists': -1
            }
        }
    );
    
    // Verify the player was updated
    if (!updateResult || updateResult.modifiedCount !== 1) {
        throw PlayerErrors.STATS_NOT_UPDATED;
    }
}

/**
 * This method will increment the penalty minutes (PIMS) for a player in the database
 * It assumes that the player has a stats object for the given season. If they do not this will fail.
 * In the event something goes wrong, it will throw an error and get caught.
 * No return because all logic based on this result is done in this method.
 * 
 * @param playerId - The ID of the player to increment PIMS for
 * @param seasonId - The season ID to increment PIMS for
 * @param penaltyMinutes - The number of penalty minutes to add (default: 2)
 */
export async function IncrementPimsForPlayerInDatabase(playerId: string, seasonId: string, penaltyMinutes: number = 2) {
    const updateResult = await collections.player?.updateOne(
        { _id: playerId, 'stats.seasonId': seasonId },
        {
            $inc: {
                'stats.$.pims': penaltyMinutes
            }
        }
    );
    
    // Verify the player was updated
    if (!updateResult || updateResult.modifiedCount !== 1) {
        throw PlayerErrors.STATS_NOT_UPDATED;
    }
}

/**
 * This method will decrement the penalty minutes (PIMS) for a player in the database
 * It assumes that the player has a stats object for the given season. If they do not this will fail.
 * In the event something goes wrong, it will throw an error and get caught.
 * No return because all logic based on this result is done in this method.
 * 
 * @param playerId - The ID of the player to decrement PIMS for
 * @param seasonId - The season ID to decrement PIMS for
 * @param penaltyMinutes - The number of penalty minutes to subtract (default: 2)
 */
export async function DecrementPimsForPlayerInDatabase(playerId: string, seasonId: string, penaltyMinutes: number = 2) {
    const updateResult = await collections.player?.updateOne(
        { _id: playerId, 'stats.seasonId': seasonId },
        {
            $inc: {
                'stats.$.pims': -penaltyMinutes
            }
        }
    );
    
    // Verify the player was updated
    if (!updateResult || updateResult.modifiedCount !== 1) {
        throw PlayerErrors.STATS_NOT_UPDATED;
    }
}

export async function IncrementManOfTheMatchForPlayerInDatabase(playerId: string, seasonId: string) {
    const updateResult = await collections.player?.updateOne(
        { _id: playerId, 'stats.seasonId': seasonId },
        {
            $inc: {
                'stats.$.manOfTheMatch': 1
            }
        }
    );
    
    if (!updateResult || updateResult.modifiedCount !== 1) {
        throw PlayerErrors.STATS_NOT_UPDATED;
    }
}

export async function DecrementManOfTheMatchForPlayerInDatabase(playerId: string, seasonId: string) {
    const updateResult = await collections.player?.updateOne(
        { _id: playerId, 'stats.seasonId': seasonId },
        {
            $inc: {
                'stats.$.manOfTheMatch': -1
            }
        }
    );
    
    if (!updateResult || updateResult.modifiedCount !== 1) {
        throw PlayerErrors.STATS_NOT_UPDATED;
    }
}

export async function IncrementWarriorOfTheGameForPlayerInDatabase(playerId: string, seasonId: string) {
    const updateResult = await collections.player?.updateOne(
        { _id: playerId, 'stats.seasonId': seasonId },
        {
            $inc: {
                'stats.$.warriorOfTheGame': 1
            }
        }
    );
    
    if (!updateResult || updateResult.modifiedCount !== 1) {
        throw PlayerErrors.STATS_NOT_UPDATED;
    }
}

export async function DecrementWarriorOfTheGameForPlayerInDatabase(playerId: string, seasonId: string) {
    const updateResult = await collections.player?.updateOne(
        { _id: playerId, 'stats.seasonId': seasonId },
        {
            $inc: {
                'stats.$.warriorOfTheGame': -1
            }
        }
    );
    
    if (!updateResult || updateResult.modifiedCount !== 1) {
        throw PlayerErrors.STATS_NOT_UPDATED;
    }
}
