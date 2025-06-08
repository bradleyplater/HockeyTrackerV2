import * as TeamRepository from '../../../repository/team.repository';
import * as PlayerRepository from '../../../repository/player.repository';

import * as IdHelper from '../../../helpers/id-helper';
import {
    addPlayerToTeam,
    addTeamToDatabase,
    removePlayerFromTeam,
} from '../../../services/team.service';
import { PlayerErrors, TeamErrors } from '../../../helpers/error-helper';
import { getBasicTeamMock } from '../../helpers/team-mock';

describe('TeamService', () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    const generatePlayerMock = (
        playerIdOverride?: string,
        teamsOverride?: PlayerRepository.IPlayerTeamDetails[]
    ): PlayerRepository.IPlayer => {
        return {
            _id: playerIdOverride ?? 'PLR123456',
            firstName: 'John',
            surname: 'Doe',
            teams: teamsOverride ?? [],
        };
    };

    describe('AddTeamToDatabase', () => {
        const testCases = [
            {
                name: 'Peterborough Warriors',
            },
            {
                name: 'Peterborough Preds',
            },
            {
                name: 'Pollington Nomads',
            },
        ];

        it.each(testCases)(
            'Should call InsertTeamToDatabase with correct name: $name',
            async ({ name }) => {
                const insertTeamToDatabaseSpy = jest
                    .spyOn(TeamRepository, 'InsertTeamToDatabase')
                    .mockResolvedValue({
                        _id: 'TM123456',
                        name,
                        players: [],
                    });

                jest.spyOn(IdHelper, 'generateIdWithPrefix').mockReturnValue(
                    'TM123456'
                );

                const expectedResult = {
                    _id: 'TM123456',
                    name,
                    players: [],
                };

                await addTeamToDatabase(name);

                expect(insertTeamToDatabaseSpy).toHaveBeenCalledWith(
                    expectedResult
                );
            }
        );

        it('Should rethrow error when InsertTeamToDatabase fails', async () => {
            const testError = new Error('Database error');

            jest.spyOn(
                TeamRepository,
                'InsertTeamToDatabase'
            ).mockRejectedValue(testError);

            jest.spyOn(IdHelper, 'generateIdWithPrefix').mockReturnValue(
                'TM123456'
            );

            await expect(
                addTeamToDatabase('Peterborough Warriors')
            ).rejects.toThrow(testError);
        });
    });

    describe('AddPlayerToTeam', () => {
        it('Should throw error getting team throws an error', async () => {
            jest.spyOn(
                TeamRepository,
                'GetTeamByIdFromDatabase'
            ).mockRejectedValue(TeamErrors.TEAM_NOT_FOUND);

            await expect(
                addPlayerToTeam('TM123456', 'PLR123456', 1)
            ).rejects.toThrow(TeamErrors.TEAM_NOT_FOUND);
        });

        it('Should throw error getting team throws an error', async () => {
            jest.spyOn(
                TeamRepository,
                'GetTeamByIdFromDatabase'
            ).mockResolvedValue(getBasicTeamMock());

            jest.spyOn(
                PlayerRepository,
                'GetPlayerByIdFromDatabase'
            ).mockRejectedValue(PlayerErrors.PLAYER_NOT_FOUND);

            await expect(
                addPlayerToTeam('TM123456', 'PLR123456', 1)
            ).rejects.toThrow(PlayerErrors.PLAYER_NOT_FOUND);
        });

        it('Should throw error when player already on team', async () => {
            const team = getBasicTeamMock();
            team.players.push({
                playerId: 'PLR123456',
                number: 14,
            });

            const player = generatePlayerMock('PLR123456');

            jest.spyOn(
                TeamRepository,
                'GetTeamByIdFromDatabase'
            ).mockResolvedValue(team);

            jest.spyOn(
                PlayerRepository,
                'GetPlayerByIdFromDatabase'
            ).mockResolvedValue(player);

            await expect(
                addPlayerToTeam('TM123456', 'PLR123456', 1)
            ).rejects.toThrow(TeamErrors.PLAYER_ALREADY_ON_TEAM);
        });

        it('Should throw error when player number already being used', async () => {
            const team = getBasicTeamMock();
            team.players.push({
                playerId: 'PLR456789',
                number: 1,
            });

            const player = generatePlayerMock('PLR123456');

            jest.spyOn(
                TeamRepository,
                'GetTeamByIdFromDatabase'
            ).mockResolvedValue(team);

            jest.spyOn(
                PlayerRepository,
                'GetPlayerByIdFromDatabase'
            ).mockResolvedValue(player);

            await expect(
                addPlayerToTeam('TM123456', 'PLR123456', 1)
            ).rejects.toThrow(TeamErrors.PLAYER_NUMBER_IN_USE);
        });

        it('Should return the new team with new player object when successful', async () => {
            jest.spyOn(
                TeamRepository,
                'GetTeamByIdFromDatabase'
            ).mockResolvedValue({
                _id: 'TM123456',
                name: 'Peterborough Warriors',
                players: [
                    {
                        playerId: 'PLR654321',
                        number: 4,
                    },
                ],
            });

            jest.spyOn(
                PlayerRepository,
                'GetPlayerByIdFromDatabase'
            ).mockResolvedValue(generatePlayerMock('PLR123456'));

            jest.spyOn(
                PlayerRepository,
                'AddTeamToPlayerByIdFromDatabase'
            ).mockResolvedValue();

            jest.spyOn(
                TeamRepository,
                'AddPlayerToTeamInDatabase'
            ).mockResolvedValue();

            const expectedResult = {
                _id: 'TM123456',
                name: 'Peterborough Warriors',
                players: [
                    {
                        playerId: 'PLR654321',
                        number: 4,
                    },
                    {
                        playerId: 'PLR123456',
                        number: 13,
                    },
                ],
            };

            expect(await addPlayerToTeam('TM123456', 'PLR123456', 13)).toEqual(
                expectedResult
            );
        });
    });

    describe('RemovePlayerFromTeam', () => {
        it('Should throw error getting team throws an error', async () => {
            jest.spyOn(
                TeamRepository,
                'GetTeamByIdFromDatabase'
            ).mockRejectedValue(TeamErrors.TEAM_NOT_FOUND);

            await expect(
                removePlayerFromTeam('TM123456', 'PLR123456')
            ).rejects.toThrow(TeamErrors.TEAM_NOT_FOUND);
        });

        it('Should throw error getting team throws an error', async () => {
            jest.spyOn(
                TeamRepository,
                'GetTeamByIdFromDatabase'
            ).mockResolvedValue(getBasicTeamMock());

            jest.spyOn(
                PlayerRepository,
                'GetPlayerByIdFromDatabase'
            ).mockRejectedValue(PlayerErrors.PLAYER_NOT_FOUND);

            await expect(
                removePlayerFromTeam('TM123456', 'PLR123456')
            ).rejects.toThrow(PlayerErrors.PLAYER_NOT_FOUND);
        });

        it('Should throw error when player not on the team', async () => {
            const team = getBasicTeamMock();

            const player = generatePlayerMock('PLR123456');

            jest.spyOn(
                TeamRepository,
                'GetTeamByIdFromDatabase'
            ).mockResolvedValue(team);

            jest.spyOn(
                PlayerRepository,
                'GetPlayerByIdFromDatabase'
            ).mockResolvedValue(player);

            await expect(
                removePlayerFromTeam('TM123456', 'PLR123456')
            ).rejects.toThrow(PlayerErrors.PLAYER_NOT_ON_TEAM);
        });

        it('Should call the remove methods when successful call', async () => {
            jest.spyOn(
                TeamRepository,
                'GetTeamByIdFromDatabase'
            ).mockResolvedValue({
                _id: 'TM123456',
                name: 'Peterborough Warriors',
                players: [
                    {
                        playerId: 'PLR123456',
                        number: 4,
                    },
                ],
            });

            jest.spyOn(
                PlayerRepository,
                'GetPlayerByIdFromDatabase'
            ).mockResolvedValue(generatePlayerMock('PLR123456'));

            const removeTeamSpy = jest
                .spyOn(PlayerRepository, 'RemoveTeamFromPlayerInDatabase')
                .mockResolvedValue(new Promise((resolve) => resolve()));

            const removePlayerSpy = jest
                .spyOn(TeamRepository, 'RemovePlayerFromTeamInDatabase')
                .mockResolvedValue(new Promise((resolve) => resolve()));

            await removePlayerFromTeam('TM123456', 'PLR123456');

            expect(removeTeamSpy).toHaveBeenCalledTimes(1);
            expect(removePlayerSpy).toHaveBeenCalledTimes(1);
        });
    });
});
