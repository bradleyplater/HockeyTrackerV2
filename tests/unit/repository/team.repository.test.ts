import { collections } from '../../../repository/database';
import {
    GetAllPlayersFromDatabase,
    GetPlayerByIdFromDatabase,
    InsertPlayerToDatabase,
    RemovePlayerByIdFromDatabase,
    UpdatePlayerDetailsByIdFromDatabase,
} from '../../../repository/player.repository';
import { InsertTeamToDatabase, GetAllTeamsFromDatabase } from '../../../repository/team.repository';

describe('InsertTeamToDatabase', () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should call out to mongodb to insert and find', async () => {
        const mockInsertOne = jest
            .fn()
            .mockResolvedValue({ insertedId: 'TM123456' });

        const mockFind = jest.fn().mockReturnValue({ _id: 'TM123456' });

        collections.team = {
            findOne: mockFind,
            insertOne: mockInsertOne,
        } as any;

        await InsertTeamToDatabase({
            _id: 'TM123456',
            name: 'Team',
            players: [],
        });

        expect(mockFind).toHaveBeenCalledTimes(1);
        expect(mockInsertOne).toHaveBeenCalledTimes(1);
    });

    it('should throw error if team not within collections', async () => {
        collections.team = undefined as any;

        await expect(
            InsertTeamToDatabase({
                _id: 'TM123456',
                name: 'Team',
                players: [],
            })
        ).rejects.toThrow('Team not created');
    });

    it('should throw error if team not returned from mongo', async () => {
        const mockInsertOne = jest
            .fn()
            .mockResolvedValue({ insertedId: 'TM123456' });

        const mockFind = jest.fn().mockReturnValue(null);

        collections.team = {
            findOne: mockFind,
            insertOne: mockInsertOne,
        } as any;

        await expect(
            InsertTeamToDatabase({
                _id: 'TM123456',
                name: 'Team',
                players: [],
            })
        ).rejects.toThrow('Team not created');
    });
});

describe('GetAllTeams', () => {
    it('should call out to mongodb once', async () => {
        const mockToArray = jest.fn().mockResolvedValue([]);
        const mockFind = jest.fn().mockReturnValue({ toArray: mockToArray });

        collections.team = { find: mockFind } as any;

        await GetAllTeamsFromDatabase();

        expect(mockFind).toHaveBeenCalledTimes(1);
        expect(mockToArray).toHaveBeenCalledTimes(1);
    });

    it('should not call out to mongodb once', async () => {
        const mockToArray = jest.fn().mockResolvedValue([]);
        const mockFind = jest.fn().mockReturnValue({ toArray: mockToArray });

        collections.team = undefined as any;

        await GetAllTeamsFromDatabase();

        expect(mockFind).not.toHaveBeenCalled();
        expect(mockToArray).not.toHaveBeenCalled();
    });
});
