import { PlayerErrors } from '../../../helpers/error-helper';
import { collections } from '../../../repository/database';
import {
    AddTeamToPlayerByIdFromDatabase,
    GetAllPlayersFromDatabase,
    GetPlayerByIdFromDatabase,
    InsertPlayerToDatabase,
    IPlayerTeamDetails,
    RemovePlayerByIdFromDatabase,
    RemoveTeamFromPlayerInDatabase,
    UpdatePlayerDetailsByIdFromDatabase,
} from '../../../repository/player.repository';
import { RemovePlayerFromTeamInDatabase } from '../../../repository/team.repository';
import { basicPlayerMock } from '../../helpers/player-mock';

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
            teams: [],
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
                teams: [],
            })
        ).rejects.toThrow(PlayerErrors.PLAYER_NOT_CREATED);
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

        await expect(
            InsertPlayerToDatabase({
                _id: 'PLR123456',
                firstName: 'John',
                surname: 'Doe',
                teams: [],
            })
        ).rejects.toThrow(PlayerErrors.PLAYER_NOT_CREATED);
    });
});

describe('GetAllPlayers', () => {
    it('Should return found players', async () => {
        const mockToArray = jest.fn().mockResolvedValue([basicPlayerMock]);
        const mockFind = jest.fn().mockReturnValue({ toArray: mockToArray });

        collections.player = { find: mockFind } as any;

        expect(await GetAllPlayersFromDatabase()).toEqual([basicPlayerMock]);
    });

    it('Should return empty array when mongo returns null', async () => {
        const mockToArray = jest.fn().mockResolvedValue(null);
        const mockFind = jest.fn().mockReturnValue({ toArray: mockToArray });

        collections.player = { find: mockFind } as any;

        expect(await GetAllPlayersFromDatabase()).toEqual([]);
    });

    it('Should return empty array when mongo returns undefined', async () => {
        const mockToArray = jest.fn().mockResolvedValue(undefined);
        const mockFind = jest.fn().mockReturnValue({ toArray: mockToArray });

        collections.player = { find: mockFind } as any;

        expect(await GetAllPlayersFromDatabase()).toEqual([]);
    });

    it('Should return empty array when mongo collection doesnt exist', async () => {
        const mockToArray = jest.fn().mockResolvedValue(undefined);
        const mockFind = jest.fn().mockReturnValue({ toArray: mockToArray });

        collections.player = undefined as any;

        expect(await GetAllPlayersFromDatabase()).toEqual([]);
    });
});

describe('GetPlayerById', () => {
    it('Should return player when found', async () => {
        const mockFind = jest.fn().mockReturnValue(basicPlayerMock);

        collections.player = { findOne: mockFind } as any;

        expect(await GetPlayerByIdFromDatabase('PLR123456')).toEqual(
            basicPlayerMock
        );
    });

    it('Should throw error when player not found: undefined', async () => {
        const mockFind = jest.fn().mockReturnValue(undefined);

        collections.player = { findOne: mockFind } as any;

        await expect(GetPlayerByIdFromDatabase('PLR123456')).rejects.toBe(
            PlayerErrors.PLAYER_NOT_FOUND
        );
    });

    it('Should throw error when player not found: null', async () => {
        const mockFind = jest.fn().mockReturnValue(null);

        collections.player = { findOne: mockFind } as any;

        await expect(GetPlayerByIdFromDatabase('PLR123456')).rejects.toBe(
            PlayerErrors.PLAYER_NOT_FOUND
        );
    });

    it('Should throw error when mongo collection doesnt exist', async () => {
        const mockFind = jest.fn().mockReturnValue(null);

        collections.player = undefined as any;

        await expect(GetPlayerByIdFromDatabase('PLR123456')).rejects.toBe(
            PlayerErrors.PLAYER_NOT_FOUND
        );
    });
});

describe('RemovePlayerById', () => {
    it('should call out to mongodb once', async () => {
        const mockDelete = jest.fn().mockReturnValue({});

        collections.player = { deleteOne: mockDelete } as any;

        await RemovePlayerByIdFromDatabase('PLR123456');

        expect(mockDelete).toHaveBeenCalledTimes(1);
        expect(mockDelete).toHaveBeenCalledWith({ _id: 'PLR123456' });
    });

    it('Should throw error if mongo returns null', async () => {
        const mockDelete = jest.fn().mockReturnValue(null);

        collections.player = { deleteOne: mockDelete } as any;

        await expect(RemovePlayerByIdFromDatabase('PLR123456')).rejects.toBe(
            PlayerErrors.PLAYER_NOT_FOUND
        );
    });

    it('Should throw error if mongo returns undefined', async () => {
        const mockDelete = jest.fn().mockReturnValue(undefined);

        collections.player = { deleteOne: mockDelete } as any;

        await expect(RemovePlayerByIdFromDatabase('PLR123456')).rejects.toBe(
            PlayerErrors.PLAYER_NOT_FOUND
        );
    });

    it('Should throw error if mongo returns deleted 0', async () => {
        const mockDelete = jest.fn().mockReturnValue({ deletedCount: 0 });

        collections.player = { deleteOne: mockDelete } as any;

        await expect(RemovePlayerByIdFromDatabase('PLR123456')).rejects.toBe(
            PlayerErrors.PLAYER_NOT_FOUND
        );
    });

    it('Should throw error if mongo collection doesnt exist', async () => {
        const mockDelete = jest.fn().mockReturnValue({ deletedCount: 0 });

        collections.player = undefined as any;

        await expect(RemovePlayerByIdFromDatabase('PLR123456')).rejects.toBe(
            PlayerErrors.PLAYER_NOT_FOUND
        );
    });
});

describe('UpdatePlayerById Details', () => {
    it('should call out to mongodb once', async () => {
        const mockUpdateOne = jest.fn().mockReturnValue({});

        collections.player = { updateOne: mockUpdateOne } as any;

        await UpdatePlayerDetailsByIdFromDatabase('PLR123456', {
            _id: 'PLR123456',
            firstName: 'John',
            surname: 'Doe',
            teams: [],
        });

        expect(mockUpdateOne).toHaveBeenCalledTimes(1);
        expect(mockUpdateOne).toHaveBeenCalledWith(
            { _id: 'PLR123456' },
            {
                $set: {
                    firstName: 'John',
                    surname: 'Doe',
                },
            }
        );
    });

    it('Should throw error if mongo returns null', async () => {
        const mockUpdateOne = jest.fn().mockReturnValue(null);

        collections.player = { updateOne: mockUpdateOne } as any;

        await expect(
            UpdatePlayerDetailsByIdFromDatabase('PLR123456', {
                _id: 'PLR123456',
                firstName: 'John',
                surname: 'Doe',
                teams: [],
            })
        ).rejects.toBe(PlayerErrors.PLAYER_NOT_FOUND);
    });

    it('Should throw error if mongo returns undefined', async () => {
        const mockUpdateOne = jest.fn().mockReturnValue(undefined);

        collections.player = { updateOne: mockUpdateOne } as any;

        await expect(
            UpdatePlayerDetailsByIdFromDatabase('PLR123456', {
                _id: 'PLR123456',
                firstName: 'John',
                surname: 'Doe',
                teams: [],
            })
        ).rejects.toBe(PlayerErrors.PLAYER_NOT_FOUND);
    });

    it('Should throw error if mongo returns modifiedCount 0', async () => {
        const mockUpdateOne = jest.fn().mockReturnValue({ modifiedCount: 0 });

        collections.player = { updateOne: mockUpdateOne } as any;

        await expect(
            UpdatePlayerDetailsByIdFromDatabase('PLR123456', {
                _id: 'PLR123456',
                firstName: 'John',
                surname: 'Doe',
                teams: [],
            })
        ).rejects.toBe(PlayerErrors.PLAYER_NOT_FOUND);
    });

    it('Should throw error if mongo collection doesnt exist', async () => {
        const mockUpdateOne = jest.fn().mockReturnValue({ modifiedCount: 0 });

        collections.player = undefined as any;

        await expect(
            UpdatePlayerDetailsByIdFromDatabase('PLR123456', {
                _id: 'PLR123456',
                firstName: 'John',
                surname: 'Doe',
                teams: [],
            })
        ).rejects.toBe(PlayerErrors.PLAYER_NOT_FOUND);
    });
});

describe('AddTeamToPlayerByIdFromDatabase', () => {
    const mockTeam: IPlayerTeamDetails = {
        teamId: 'PL123456',
        number: 4,
    };

    it('should call out to mongodb once', async () => {
        const mockUpdateOne = jest.fn().mockReturnValue({});

        collections.player = { updateOne: mockUpdateOne } as any;

        await AddTeamToPlayerByIdFromDatabase(mockTeam, 'PLR123456');

        expect(mockUpdateOne).toHaveBeenCalledTimes(1);
        expect(mockUpdateOne).toHaveBeenCalledWith(
            { _id: 'PLR123456' },
            {
                $push: {
                    teams: mockTeam,
                },
            }
        );
    });

    it('Should throw error if mongo returns null', async () => {
        const mockUpdateOne = jest.fn().mockReturnValue(null);

        collections.player = { updateOne: mockUpdateOne } as any;

        await expect(
            AddTeamToPlayerByIdFromDatabase(mockTeam, 'PLR123456')
        ).rejects.toBe(PlayerErrors.TEAM_NOT_ADDED);
    });

    it('Should throw error if mongo returns undefined', async () => {
        const mockUpdateOne = jest.fn().mockReturnValue(undefined);

        collections.player = { updateOne: mockUpdateOne } as any;

        await expect(
            AddTeamToPlayerByIdFromDatabase(mockTeam, 'PLR123456')
        ).rejects.toBe(PlayerErrors.TEAM_NOT_ADDED);
    });

    it('Should throw error if mongo returns modifiedCount 0', async () => {
        const mockUpdateOne = jest.fn().mockReturnValue({ modifiedCount: 0 });

        collections.player = { updateOne: mockUpdateOne } as any;

        await expect(
            AddTeamToPlayerByIdFromDatabase(mockTeam, 'PLR123456')
        ).rejects.toBe(PlayerErrors.TEAM_NOT_ADDED);
    });

    it('Should throw error if mongo collection doesnt exist', async () => {
        const mockUpdateOne = jest.fn().mockReturnValue({ modifiedCount: 0 });

        collections.player = undefined as any;

        await expect(
            AddTeamToPlayerByIdFromDatabase(mockTeam, 'PLR123456')
        ).rejects.toBe(PlayerErrors.TEAM_NOT_ADDED);
    });
});

describe('RemoveTeamFromPlayerByIdFromDatabase', () => {
    it('should call out to mongodb once', async () => {
        const mockUpdateOne = jest.fn().mockReturnValue({});

        collections.player = { updateOne: mockUpdateOne } as any;

        await RemoveTeamFromPlayerInDatabase('TM123456', 'PLR123456');

        expect(mockUpdateOne).toHaveBeenCalledTimes(1);
        expect(mockUpdateOne).toHaveBeenCalledWith(
            { _id: 'PLR123456' },
            {
                $pull: {
                    teams: { teamId: 'TM123456' },
                },
            }
        );
    });

    it('Should throw error if mongo returns null', async () => {
        const mockUpdateOne = jest.fn().mockReturnValue(null);

        collections.player = { updateOne: mockUpdateOne } as any;

        await expect(
            RemoveTeamFromPlayerInDatabase('TM123456', 'PLR123456')
        ).rejects.toBe(PlayerErrors.TEAM_NOT_REMOVED);
    });

    it('Should throw error if mongo returns undefined', async () => {
        const mockUpdateOne = jest.fn().mockReturnValue(undefined);

        collections.player = { updateOne: mockUpdateOne } as any;

        await expect(
            RemoveTeamFromPlayerInDatabase('TM123456', 'PLR123456')
        ).rejects.toBe(PlayerErrors.TEAM_NOT_REMOVED);
    });

    it('Should throw error if mongo returns modifiedCount 0', async () => {
        const mockUpdateOne = jest.fn().mockReturnValue({ modifiedCount: 0 });

        collections.player = { updateOne: mockUpdateOne } as any;

        await expect(
            RemoveTeamFromPlayerInDatabase('TM123456', 'PLR123456')
        ).rejects.toBe(PlayerErrors.TEAM_NOT_REMOVED);
    });

    it('Should throw error if mongo collection doesnt exist', async () => {
        const mockUpdateOne = jest.fn().mockReturnValue({ modifiedCount: 0 });

        collections.player = undefined as any;

        await expect(
            RemoveTeamFromPlayerInDatabase('TM123456', 'PLR123456')
        ).rejects.toBe(PlayerErrors.TEAM_NOT_REMOVED);
    });
});
