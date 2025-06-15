import { generateGameMock } from '../../tests/helpers/game-mock';
import { InsertGameToDatabase } from '../repository/game.repository';

export const CreateGame = async () => {
    return  await InsertGameToDatabase(generateGameMock());
};
