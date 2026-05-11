import { InsertOneResult } from 'mongodb';
import { IAddGoalBody, IAddOpponentGoalBody, IAddPenaltyBody, IAddOpponentPenaltyBody, IGame } from '../types/GameTypes';
import { collections } from './database';
import { GameErrors } from '../helpers/error-helper';
import { generateIdWithPrefix } from '../helpers/id-helper';

export async function InsertGameToDatabase(game: IGame): Promise<IGame> {
    const result = (await collections.game?.insertOne(
        game
    )) as InsertOneResult<IGame>;

    const storedGame = await collections.game?.findOne({
        _id: result.insertedId,
    });

    if (!storedGame) {
        throw GameErrors.GAME_NOT_CREATED;
    }

    return storedGame;
}

export async function GetGameById(gameId: string): Promise<IGame> {
    const game =  await collections.game?.findOne({
        _id: gameId,
    });

    if (!game) {
        throw GameErrors.GAME_NOT_FOUND;
    }

    return game
}

export async function GetAllGamesFromDatabase(): Promise<IGame[]> {
    const games = await collections.game?.find({}).toArray();
    
    if (!games) {
        return [];
    }
    
    return games;
}

export async function UpdateGameAwardsInDatabase(gameId: string, manOfTheMatchPlayerId: string | null, warriorOfTheGamePlayerId: string | null) {
    const update: Record<string, string | null> = {};
    
    update.manOfTheMatchPlayerId = manOfTheMatchPlayerId;
    update.warriorOfTheGamePlayerId = warriorOfTheGamePlayerId;

    const result = await collections.game?.updateOne(
        { _id: gameId },
        {
            $set: update
        }
    );

    if (!result || result.matchedCount === 0) {
        throw GameErrors.GAME_NOT_FOUND;
    }

    if (result.modifiedCount === 0) {
        throw new Error('Failed to update game awards');
    }
}

export async function UpdateGameNetminderInDatabase(gameId: string, netminderPlayerId: string) {
    const result = await collections.game?.updateOne(
        { _id: gameId },
        {
            $set: {
                netminderPlayerId: netminderPlayerId
            }
        }
    );

    if (!result || result.matchedCount === 0) {
        throw GameErrors.GAME_NOT_FOUND;
    }

    if (result.modifiedCount === 0) {
        throw new Error('Failed to update game netminder');
    }
}

export async function AddGoalToGameInDatabase(gameId: string, addGoal: IAddGoalBody) {
    // Determine which period based on minute
    let periodNumber = 1;
    if (addGoal.minute >= 20 && addGoal.minute < 40) {
        periodNumber = 2;
    } else if (addGoal.minute >= 40 && addGoal.minute <= 60) {
        periodNumber = 3;
    }

    // Create the goal object that will be added
    const newGoal = {
        _id: generateIdWithPrefix('GOL'),
        scoredBy: addGoal.scoredBy,
        assist1: addGoal.assist1,
        assist2: addGoal.assist2,
        minute: addGoal.minute,
        second: addGoal.second,
        type: addGoal.type
    };

    const result = await collections.game?.updateOne(
        { _id: gameId },
        {
            $push: {
                "team.goals": newGoal
            },
            $inc: {
                "score.team": 1,
                [`score.periods.$[period].team`]: 1,
                [`team.roster.$[scorer].stats.goals`]: 1,
                ...(addGoal.assist1 ? { [`team.roster.$[assist1].stats.assists`]: 1 } : {}),
                ...(addGoal.assist2 ? { [`team.roster.$[assist2].stats.assists`]: 1 } : {})
            }
        },
        {
            arrayFilters: [
                { "period.number": periodNumber },
                { "scorer.playerId": addGoal.scoredBy },
                ...(addGoal.assist1 ? [{ "assist1.playerId": addGoal.assist1 }] : []),
                ...(addGoal.assist2 ? [{ "assist2.playerId": addGoal.assist2 }] : [])
            ]
        }
    );

    if (!result || result.matchedCount === 0) {
        throw GameErrors.GAME_NOT_FOUND;
    }

    if (result.modifiedCount === 0) {
        throw new Error('Failed to add goal to game');
    }

    return newGoal;
}

export async function AddOpponentGoalToGameInDatabase(gameId: string, addGoal: IAddOpponentGoalBody) {
    // Determine which period based on minute
    let periodNumber = 1;
    if (addGoal.minute >= 20 && addGoal.minute < 40) {
        periodNumber = 2;
    } else if (addGoal.minute >= 40 && addGoal.minute <= 60) {
        periodNumber = 3;
    }

    // Create the goal object that will be added
    const newGoal = {
        _id: generateIdWithPrefix('OGL'),
        scoredBy: addGoal.scoredBy,
        minute: addGoal.minute,
        second: addGoal.second,
        type: addGoal.type
    };

    const result = await collections.game?.updateOne(
        { _id: gameId },
        {
            $push: {
                "opponentTeam.goals": newGoal
            },
            $inc: {
                "score.opponent": 1,
                [`score.periods.$[period].opponent`]: 1
            }
        },
        {
            arrayFilters: [
                { "period.number": periodNumber }
            ]
        }
    );

    if (!result || result.matchedCount === 0) {
        throw GameErrors.GAME_NOT_FOUND;
    }

    if (result.modifiedCount === 0) {
        throw new Error('Failed to add opponent goal to game');
    }

    return newGoal;
}

/**
 * This method will remove a specific goal from a game in the database
 * It will decrement the team score, period score, and player stats
 * 
 * @param gameId - The ID of the game to remove the goal from
 * @param goalId - The ID of the specific goal to remove
 * @returns The update result
 */
export async function RemoveGoalFromGameInDatabase(gameId: string, goalId: string) {
    // First, get the game to find the specific goal
    const game = await GetGameById(gameId);
    
    if (!game.team.goals || game.team.goals.length === 0) {
        throw new Error('No goals to remove from this game');
    }
    
    // Find the specific goal by ID
    const goalToRemove = game.team.goals.find(goal => goal._id === goalId);
    
    if (!goalToRemove) {
        throw new Error(`Goal with ID ${goalId} not found in this game`);
    }
    
    // Determine which period based on minute
    let periodNumber = 1;
    if (goalToRemove.minute >= 20 && goalToRemove.minute < 40) {
        periodNumber = 2;
    } else if (goalToRemove.minute >= 40 && goalToRemove.minute <= 60) {
        periodNumber = 3;
    }
    
    const result = await collections.game?.updateOne(
        { _id: gameId },
        {
            $pull: {
                "team.goals": { "_id": goalId }  // Remove the specific goal from the array
            },
            $inc: {
                "score.team": -1,
                [`score.periods.$[period].team`]: -1,
                [`team.roster.$[scorer].stats.goals`]: -1,
                ...(goalToRemove.assist1 ? { [`team.roster.$[assist1].stats.assists`]: -1 } : {}),
                ...(goalToRemove.assist2 ? { [`team.roster.$[assist2].stats.assists`]: -1 } : {})
            }
        },
        {
            arrayFilters: [
                { "period.number": periodNumber },
                { "scorer.playerId": goalToRemove.scoredBy },
                ...(goalToRemove.assist1 ? [{ "assist1.playerId": goalToRemove.assist1 }] : []),
                ...(goalToRemove.assist2 ? [{ "assist2.playerId": goalToRemove.assist2 }] : [])
            ]
        }
    );
    
    if (!result || result.matchedCount === 0) {
        throw GameErrors.GAME_NOT_FOUND;
    }
    
    if (result.modifiedCount === 0) {
        throw new Error('Failed to remove goal from game');
    }
    
    return { result, removedGoal: goalToRemove };
}

/**
 * This method will remove a specific opponent goal from a game in the database
 * It will decrement the opponent score and period score
 * 
 * @param gameId - The ID of the game to remove the goal from
 * @param goalId - The ID of the specific opponent goal to remove
 * @returns The update result
 */
export async function RemoveOpponentGoalFromGameInDatabase(gameId: string, goalId: string) {
    // First, get the game to find the specific goal
    const game = await GetGameById(gameId);
    
    if (!game.opponentTeam.goals || game.opponentTeam.goals.length === 0) {
        throw new Error('No opponent goals to remove from this game');
    }
    
    // Find the specific goal by ID
    const goalToRemove = game.opponentTeam.goals.find(goal => goal._id === goalId);
    
    if (!goalToRemove) {
        throw new Error(`Opponent goal with ID ${goalId} not found in this game`);
    }
    
    // Determine which period based on minute
    let periodNumber = 1;
    if (goalToRemove.minute >= 20 && goalToRemove.minute < 40) {
        periodNumber = 2;
    } else if (goalToRemove.minute >= 40 && goalToRemove.minute <= 60) {
        periodNumber = 3;
    }
    
    const result = await collections.game?.updateOne(
        { _id: gameId },
        {
            $pull: {
                "opponentTeam.goals": { "_id": goalId }  // Remove the specific goal from the array
            },
            $inc: {
                "score.opponent": -1,
                [`score.periods.$[period].opponent`]: -1
            }
        },
        {
            arrayFilters: [
                { "period.number": periodNumber }
            ]
        }
    );
    
    if (!result || result.matchedCount === 0) {
        throw GameErrors.GAME_NOT_FOUND;
    }
    
    if (result.modifiedCount === 0) {
        throw new Error('Failed to remove opponent goal from game');
    }
    
    return { result, removedGoal: goalToRemove };
}

export async function AddPenaltyToGameInDatabase(gameId: string, addPenalty: IAddPenaltyBody) {
    // Create the penalty object that will be added
    const newPenalty = {
        _id: generateIdWithPrefix('PEN'),
        offender: addPenalty.offender,
        minute: addPenalty.minute,
        second: addPenalty.second,
        type: addPenalty.type,
        duration: addPenalty.duration
    };

    const result = await collections.game?.updateOne(
        { _id: gameId },
        {
            $push: {
                "team.penalties": newPenalty
            },
            $inc: {
                ...(addPenalty.offender !== 'BENCH' ? { [`team.roster.$[penaltyPlayer].stats.pims`]: addPenalty.duration } : {})
            }
        },
        {
            arrayFilters: [
                ...(addPenalty.offender !== 'BENCH' ? [{ "penaltyPlayer.playerId": addPenalty.offender }] : [])
            ]
        }
    );

    if (!result || result.matchedCount === 0) {
        throw GameErrors.GAME_NOT_FOUND;
    }

    if (result.modifiedCount === 0) {
        throw new Error('Failed to add penalty to game');
    }

    return newPenalty;
}

export async function RemovePenaltyFromGameInDatabase(gameId: string, penaltyId: string) {
    // First, get the game to find the penalty
    const game = await GetGameById(gameId);
    
    if (!game.team.penalties || game.team.penalties.length === 0) {
        throw new Error('No penalties found for this game');
    }
    
    // Find the penalty to remove
    const penaltyToRemove = game.team.penalties.find(penalty => penalty._id === penaltyId);
    
    if (!penaltyToRemove) {
        throw new Error('Penalty not found');
    }

    const result = await collections.game?.updateOne(
        { _id: gameId },
        {
            $pull: {
                "team.penalties": { _id: penaltyId }
            },
            $inc: {
                ...(penaltyToRemove.offender !== 'BENCH' ? { [`team.roster.$[penaltyPlayer].stats.pims`]: -penaltyToRemove.duration } : {})
            }
        },
        {
            arrayFilters: [
                ...(penaltyToRemove.offender !== 'BENCH' ? [{ "penaltyPlayer.playerId": penaltyToRemove.offender }] : [])
            ]
        }
    );
    
    if (!result || result.matchedCount === 0) {
        throw GameErrors.GAME_NOT_FOUND;
    }
    
    if (result.modifiedCount === 0) {
        throw new Error('Failed to remove penalty from game');
    }
    
    return { result, removedPenalty: penaltyToRemove };
}

export async function AddOpponentPenaltyToGameInDatabase(gameId: string, addPenalty: IAddOpponentPenaltyBody) {
    // Create the penalty object that will be added
    const newPenalty = {
        _id: generateIdWithPrefix('OPP'),
        offender: addPenalty.offender,
        minute: addPenalty.minute,
        second: addPenalty.second,
        type: addPenalty.type,
        duration: addPenalty.duration
    };

    const result = await collections.game?.updateOne(
        { _id: gameId },
        {
            $push: {
                "opponentTeam.penalties": newPenalty
            }
        }
    );

    if (!result || result.matchedCount === 0) {
        throw GameErrors.GAME_NOT_FOUND;
    }

    if (result.modifiedCount === 0) {
        throw new Error('Failed to add opponent penalty to game');
    }

    return newPenalty;
}

export async function RemoveOpponentPenaltyFromGameInDatabase(gameId: string, penaltyId: string) {
    // First, get the game to find the penalty
    const game = await GetGameById(gameId);
    
    if (!game.opponentTeam.penalties || game.opponentTeam.penalties.length === 0) {
        throw new Error('No opponent penalties found for this game');
    }
    
    // Find the penalty to remove
    const penaltyToRemove = game.opponentTeam.penalties.find(penalty => penalty._id === penaltyId);
    
    if (!penaltyToRemove) {
        throw new Error('Opponent penalty not found');
    }

    const result = await collections.game?.updateOne(
        { _id: gameId },
        {
            $pull: {
                "opponentTeam.penalties": { _id: penaltyId }
            }
        }
    );
    
    if (!result || result.matchedCount === 0) {
        throw GameErrors.GAME_NOT_FOUND;
    }
    
    if (result.modifiedCount === 0) {
        throw new Error('Failed to remove opponent penalty from game');
    }
    
    return { result, removedPenalty: penaltyToRemove };
}
