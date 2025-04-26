import { collections } from '../../../repository/database';
import {
    GetAllPlayersFromDatabase,
    InsertPlayerToDatabase,
} from '../../../repository/player.repository';

describe('InsertPlayerToDatabase', () => {
    it('should call out to mongodb to insert and find', async () => {
        const mockInsertOne = jest
            .fn()
            .mockResolvedValue({ insertedId: 'PLR123456' });

        const mockFind = jest.fn().mockReturnValue({ _id: 'PLR123456' });

        collections.player = {
            findOne: mockFind,
            insertOne: mockInsertOne,
        } as any;

        await InsertPlayerToDatabase({
            _id: 'PLR123456',
            firstName: 'John',
            surname: 'Doe',
        });

        expect(mockFind).toHaveBeenCalledTimes(1);
        expect(mockInsertOne).toHaveBeenCalledTimes(1);
    });

    it('should throw error if player not within collections', async () => {
        const mockInsertOne = jest
            .fn()
            .mockResolvedValue({ insertedId: 'PLR123456' });

        const mockFind = jest.fn().mockReturnValue({ _id: 'PLR123456' });

        collections.player = undefined as any;

        await expect(
            InsertPlayerToDatabase({
                _id: 'PLR123456',
                firstName: 'John',
                surname: 'Doe',
            })
        ).rejects.toThrow('Player not created');
    });

    it('should throw error if player not returned from mongo', async () => {
        const mockInsertOne = jest
            .fn()
            .mockResolvedValue({ insertedId: 'PLR123456' });

        const mockFind = jest.fn().mockReturnValue(null);

        collections.player = {
            findOne: mockFind,
            insertOne: mockInsertOne,
        } as any;
    });
});

describe('GetAllPlayers', () => {
    it('should call out to mongodb once', async () => {
        const mockToArray = jest.fn().mockResolvedValue([]);
        const mockFind = jest.fn().mockReturnValue({ toArray: mockToArray });

        collections.player = { find: mockFind } as any;

        await GetAllPlayersFromDatabase();

        expect(mockFind).toHaveBeenCalledTimes(1);
        expect(mockToArray).toHaveBeenCalledTimes(1);
    });

    it('should not call out to mongodb once', async () => {
        const mockToArray = jest.fn().mockResolvedValue([]);
        const mockFind = jest.fn().mockReturnValue({ toArray: mockToArray });

        collections.player = undefined as any;

        await GetAllPlayersFromDatabase();

        expect(mockFind).not.toHaveBeenCalled();
        expect(mockToArray).not.toHaveBeenCalled();
    });
});
