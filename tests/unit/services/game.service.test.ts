import { generateGameMock } from '../../helpers/game-mock';
import * as GameRepository from '../../../src/repository/game.repository';
import { CreateGame } from '../../../src/services/game.service';

describe('GameService', () => {
    it('should return a game object returned from mongo', () => {
        const mockGame = generateGameMock();

        jest.spyOn(GameRepository, 'InsertGameToDatabase').mockResolvedValue(
            mockGame
        );

        expect(CreateGame()).resolves.toEqual(mockGame);
    });
});
