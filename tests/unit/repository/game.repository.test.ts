import { GameErrors, PlayerErrors } from '../../../src/helpers/error-helper';
import { collections } from '../../../src/repository/database';
import { InsertGameToDatabase } from '../../../src/repository/game.repository';
import { InsertPlayerToDatabase } from '../../../src/repository/player.repository';
import { generateGameMock } from '../../helpers/game-mock';

describe('InsertPlayerToDatabase', () => {
    it('should call out to mongodb to insert and find', async () => {
        const mockInsertOne = jest
            .fn()
            .mockResolvedValue({ insertedId: 'GME123456' });

        const mockFind = jest.fn().mockReturnValue({ _id: 'GME123456' });

        collections.game = {
            findOne: mockFind,
            insertOne: mockInsertOne,
        } as any;

        const mockGame = generateGameMock();

        await InsertGameToDatabase(mockGame);

        expect(mockFind).toHaveBeenCalledTimes(1);
        expect(mockInsertOne).toHaveBeenCalledTimes(1);
    });

    it('should throw error if game not within collections', async () => {
        const mockInsertOne = jest
            .fn()
            .mockResolvedValue({ insertedId: 'GME123456' });

        const mockFind = jest.fn().mockReturnValue({ _id: 'GME123456' });

        collections.game = undefined as any;

        const mockGame = generateGameMock();

        await expect(InsertGameToDatabase(mockGame)).rejects.toThrow(
            GameErrors.GAME_NOT_CREATED
        );
    });

    it('should throw error if game not returned from mongo', async () => {
        const mockInsertOne = jest
            .fn()
            .mockResolvedValue({ insertedId: 'GME123456' });

        const mockFind = jest.fn().mockReturnValue(null);

        collections.game = {
            findOne: mockFind,
            insertOne: mockInsertOne,
        } as any;
        const mockGame = generateGameMock();

        await expect(InsertGameToDatabase(mockGame)).rejects.toThrow(
            GameErrors.GAME_NOT_CREATED
        );
    });
});
