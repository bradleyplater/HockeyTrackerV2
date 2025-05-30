import { TeamErrors } from '../../../helpers/error-helper';
import { collections } from '../../../repository/database';
import { IPlayer } from '../../../repository/player.repository';
import {
    InsertTeamToDatabase,
    GetAllTeamsFromDatabase,
    GetTeamByIdFromDatabase,
    AddPlayerToTeamInDatabase,
    ITeamPlayerDetails,
} from '../../../repository/team.repository';
import { basicTeamMock } from '../helpers/team-mock';

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
        ).rejects.toThrow(TeamErrors.TEAM_NOT_CREATED);
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
        ).rejects.toThrow(TeamErrors.TEAM_NOT_CREATED);
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

    it('when mongo returns undefined return empty array', async () => {
        const mockToArray = jest.fn().mockResolvedValue(null);
        const mockFind = jest.fn().mockReturnValue({ toArray: mockToArray });

        collections.team = { find: mockFind } as any;

        expect(await GetAllTeamsFromDatabase()).toEqual([]);
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

describe('GetTeamByIdFromDatabase', () => {
    it('When Mongo returns a team, should return it', async () => {
        const mockFind = jest.fn().mockReturnValue(basicTeamMock);

        collections.team = { findOne: mockFind } as any;

        expect(await GetTeamByIdFromDatabase('TM123456')).toEqual(
            basicTeamMock
        );
    });

    it('When Mongo does not return a team (null), should throw an error', async () => {
        const mockFind = jest.fn().mockReturnValue(null);

        collections.team = { findOne: mockFind } as any;

        await expect(GetTeamByIdFromDatabase('TM123456')).rejects.toBe(
            TeamErrors.TEAM_NOT_FOUND
        );
    });

    it('When Mongo does not return a team (undefined), should throw an error', async () => {
        const mockFind = jest.fn().mockReturnValue(undefined);

        collections.team = { findOne: mockFind } as any;

        await expect(GetTeamByIdFromDatabase('TM123456')).rejects.toBe(
            TeamErrors.TEAM_NOT_FOUND
        );
    });
});

describe('AddPlayerToTeamInDatabase', () => {
    it('should call out to mongodb once', async () => {
        const mockPlayer: ITeamPlayerDetails = {
            playerId: 'PL123456',
            number: 4,
        };

        const mockUpdateOne = jest.fn().mockReturnValue({});

        collections.team = { updateOne: mockUpdateOne } as any;

        await AddPlayerToTeamInDatabase(mockPlayer, 'TM123456');

        expect(mockUpdateOne).toHaveBeenCalledTimes(1);
        expect(mockUpdateOne).toHaveBeenCalledWith(
            { _id: 'TM123456' },
            { $push: { players: mockPlayer } }
        );
    });

    it('Should throw error if mongo returns no result (null)', async () => {
        const mockPlayer: ITeamPlayerDetails = {
            playerId: 'PL123456',
            number: 4,
        };

        const mockUpdateOne = jest.fn().mockReturnValue(null);

        collections.team = { updateOne: mockUpdateOne } as any;

        await expect(
            AddPlayerToTeamInDatabase(mockPlayer, 'TM123456')
        ).rejects.toBe(TeamErrors.PLAYER_NOT_ADDED);
    });
});
