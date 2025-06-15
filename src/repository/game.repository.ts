import { InsertOneResult } from 'mongodb';
import { IGame } from '../types/GameTypes';
import { collections } from './database';
import { GameErrors } from '../helpers/error-helper';

export async function InsertGameToDatabase(game: IGame) {
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
