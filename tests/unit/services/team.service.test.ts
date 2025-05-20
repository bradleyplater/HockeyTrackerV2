import * as TeamRepository from '../../../repository/team.repository';
import * as PlayerRepository from '../../../repository/player.repository';

import * as IdHelper from '../../../helpers/id-helper';
import {
    addPlayerToTeam,
    addTeamToDatabase,
} from '../../../services/team.service';
import { PlayerErrors, TeamErrors } from '../../../helpers/error-helper';
import { addPlayerToDatabase } from '../../../services/player.service';

describe('TeamService', () => {
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
        const errorTestCases = [
            // {
            //     description: 'When there is no team with the given id',
            //     givenPlayerNumber: 4,
            //     mongoReturnForTeam: undefined,
            //     mongoReturnForPlayer: undefined,
            //     expectedError: TeamErrors.TEAM_NOT_FOUND,
            // },
            // {
            //     description: 'When there is no player with the given id',
            //     givenPlayerNumber: 4,
            //     mongoReturnForTeam: {
            //         _id: 'TM123456',
            //         name: 'Peterborough Warriors',
            //         players: [],
            //     },
            //     mongoReturnForPlayer: undefined,
            //     expectedError: PlayerErrors.PLAYER_NOT_FOUND,
            // },
            {
                description: 'When the given player is already on the team',
                givenPlayerNumber: 4,
                mongoReturnForTeam: {
                    _id: 'TM123456',
                    name: 'Peterborough Warriors',
                    players: [
                        {
                            playerId: 'PLR123456',
                            number: 4,
                        },
                    ],
                },
                mongoReturnForPlayer: generatePlayerMock('PLR123456', [
                    { teamId: 'TM123456', number: 4 },
                ]),
                expectedError: TeamErrors.PLAYER_ALREADY_ON_TEAM,
            },
            // {
            //     description:
            //         'When the given player has the same number as another player on the team',
            //     givenPlayerNumber: 4,
            //     mongoReturnForTeam: {
            //         _id: 'TM123456',
            //         name: 'Peterborough Warriors',
            //         players: [
            //             {
            //                 playerId: 'PLR123456',
            //                 number: 4,
            //             },
            //         ],
            //     },
            //     mongoReturnForPlayer: generatePlayerMock('PLR654321'),
            //     expectedError: TeamErrors.PLAYER_NUMBER_IN_USE,
            // },
        ];

        it.each(errorTestCases)(
            'Should throw error when $description',
            async ({
                givenPlayerNumber,
                mongoReturnForTeam,
                mongoReturnForPlayer,
                expectedError,
            }) => {
                jest.spyOn(
                    TeamRepository,
                    'GetTeamByIdFromDatabase'
                ).mockResolvedValue(mongoReturnForTeam);

                jest.spyOn(
                    PlayerRepository,
                    'GetPlayerByIdFromDatabase'
                ).mockResolvedValue(mongoReturnForPlayer);

                await expect(
                    addPlayerToTeam('TM123456', 'PLR123456', givenPlayerNumber)
                ).rejects.toThrow(expectedError);
            }
        );
    });
});
