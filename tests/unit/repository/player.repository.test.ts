import { collections } from '../../../repository/database';
import { InsertPlayerToDatabase } from '../../../repository/player.repository';

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
