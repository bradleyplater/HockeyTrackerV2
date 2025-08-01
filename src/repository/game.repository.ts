import { InsertOneResult } from 'mongodb';
import { IAddGoalBody, IGame } from '../types/GameTypes';
import { collections } from './database';
import { GameErrors } from '../helpers/error-helper';

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