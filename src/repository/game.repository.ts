import { InsertOneResult } from 'mongodb';
import { IAddGoalBody, IGame } from '../types/GameTypes';
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

export async function AddGoalToGameInDatabase(gameId: string, addGoal: IAddGoalBody) {
    // Determine which period based on minute
    let periodNumber = 1;
    if (addGoal.minute >= 20 && addGoal.minute < 40) {
        periodNumber = 2;
    } else if (addGoal.minute >= 40 && addGoal.minute <= 60) {
        periodNumber = 3;
    }

    const result = await collections.game?.updateOne(
        { _id: gameId },
        {
            $push: {
                "team.goals": {
                    _id: generateIdWithPrefix('GOL'),
                    scoredBy: addGoal.scoredBy,
                    assist1: addGoal.assist1,
                    assist2: addGoal.assist2,
                    minute: addGoal.minute,
                    second: addGoal.second,
                    type: addGoal.type
                }
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

    return result;
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