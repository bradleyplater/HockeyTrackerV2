import * as TeamRepository from '../../../repository/team.repository';
import * as PlayerRepository from '../../../repository/player.repository';

import * as IdHelper from '../../../helpers/id-helper';
import {
    addPlayerToTeam,
    addTeamToDatabase,
} from '../../../services/team.service';
import {
    HockeyTrackerError,
    PlayerErrors,
    TeamErrors,
} from '../../../helpers/error-helper';
import { UpdateResult } from 'mongodb';

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
        type ErrorTestCase = {
            description: string;
            givenPlayerNumber: number;
            mongoReturnForTeam?: TeamRepository.ITeam;
            mongoReturnForPlayer?: PlayerRepository.IPlayer;
            mongoReturnForTeamUpdate?: UpdateResult<TeamRepository.ITeam>;
            mongoReturnForPlayerUpdate?: UpdateResult<PlayerRepository.IPlayer>;
            expectedError: HockeyTrackerError;
        };

        const errorTestCases: ErrorTestCase[] = [
            {
                description: 'When there is no player with the given id',
                givenPlayerNumber: 4,
                mongoReturnForTeam: {
                    _id: 'TM123456',
                    name: 'Peterborough Warriors',
                    players: [],
                },
                mongoReturnForPlayer: undefined,
                expectedError: PlayerErrors.PLAYER_NOT_FOUND,
            },
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
            {
                description:
                    'When the given player has the same number as another player on the team',
                givenPlayerNumber: 4,
                mongoReturnForTeam: {
                    _id: 'TM123456',
                    name: 'Peterborough Warriors',
                    players: [
                        {
                            playerId: 'PLR654321',
                            number: 4,
                        },
                    ],
                },
                mongoReturnForPlayer: generatePlayerMock('PLR123456'),
                expectedError: TeamErrors.PLAYER_NUMBER_IN_USE,
            },
            {
                description:
                    'When the team wasn not able to be updated with the new player when mongo update returns undefined',
                givenPlayerNumber: 13,
                mongoReturnForTeam: {
                    _id: 'TM123456',
                    name: 'Peterborough Warriors',
                    players: [
                        {
                            playerId: 'PLR654321',
                            number: 4,
                        },
                    ],
                },
                mongoReturnForPlayer: generatePlayerMock('PLR123456'),
                mongoReturnForTeamUpdate: undefined,
                expectedError: TeamErrors.PLAYER_NOT_ADDED,
            },
            {
                description:
                    'When the team wasn not able to be updated with the new player when mongo update returns modifiedCount as 0',
                givenPlayerNumber: 13,
                mongoReturnForTeam: {
                    _id: 'TM123456',
                    name: 'Peterborough Warriors',
                    players: [
                        {
                            playerId: 'PLR654321',
                            number: 4,
                        },
                    ],
                },
                mongoReturnForPlayer: generatePlayerMock('PLR123456'),
                mongoReturnForTeamUpdate: {
                    acknowledged: true,
                    matchedCount: 1,
                    modifiedCount: 0,
                    upsertedCount: 0,
                    upsertedId: null,
                },
                expectedError: TeamErrors.PLAYER_NOT_ADDED,
            },
            {
                description:
                    'When the player was not able to be updated with the new team when mongo update returns modifiedCount as 0',
                givenPlayerNumber: 13,
                mongoReturnForTeam: {
                    _id: 'TM123456',
                    name: 'Peterborough Warriors',
                    players: [
                        {
                            playerId: 'PLR654321',
                            number: 4,
                        },
                    ],
                },
                mongoReturnForPlayer: generatePlayerMock('PLR123456'),
                mongoReturnForTeamUpdate: {
                    acknowledged: true,
                    matchedCount: 1,
                    modifiedCount: 1,
                    upsertedCount: 0,
                    upsertedId: null,
                },
                mongoReturnForPlayerUpdate: {
                    acknowledged: true,
                    matchedCount: 1,
                    modifiedCount: 0,
                    upsertedCount: 0,
                    upsertedId: null,
                },
                expectedError: PlayerErrors.TEAM_NOT_ADDED,
            },
            {
                description:
                    'When the player was not able to be updated with the new team when mongo update returns undefined',
                givenPlayerNumber: 13,
                mongoReturnForTeam: {
                    _id: 'TM123456',
                    name: 'Peterborough Warriors',
                    players: [
                        {
                            playerId: 'PLR654321',
                            number: 4,
                        },
                    ],
                },
                mongoReturnForPlayer: generatePlayerMock('PLR123456'),
                mongoReturnForTeamUpdate: {
                    acknowledged: true,
                    matchedCount: 1,
                    modifiedCount: 1,
                    upsertedCount: 0,
                    upsertedId: null,
                },
                mongoReturnForPlayerUpdate: undefined,
                expectedError: PlayerErrors.TEAM_NOT_ADDED,
            },
        ];

        // it.each(errorTestCases)(
        //     'Should throw error when $description',
        //     async ({
        //         givenPlayerNumber,
        //         mongoReturnForTeam,
        //         mongoReturnForPlayer,
        //         mongoReturnForTeamUpdate,
        //         mongoReturnForPlayerUpdate,
        //         expectedError,
        //     }) => {
        //         jest.spyOn(
        //             TeamRepository,
        //             'GetTeamByIdFromDatabase'
        //         ).mockResolvedValue(mongoReturnForTeam);

        //         jest.spyOn(
        //             TeamRepository,
        //             'AddPlayerToTeamInDatabase'
        //         ).mockResolvedValue(mongoReturnForTeamUpdate);

        //         jest.spyOn(
        //             PlayerRepository,
        //             'GetPlayerByIdFromDatabase'
        //         ).mockResolvedValue(mongoReturnForPlayer);

        //         jest.spyOn(
        //             PlayerRepository,
        //             'AddTeamToPlayerByIdFromDatabase'
        //         ).mockResolvedValue(mongoReturnForPlayerUpdate);

        //         await expect(
        //             addPlayerToTeam('TM123456', 'PLR123456', givenPlayerNumber)
        //         ).rejects.toThrow(expectedError);
        //     }
        // );

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
            ).mockResolvedValue({
                acknowledged: true,
                matchedCount: 1,
                modifiedCount: 1,
                upsertedCount: 0,
                upsertedId: null,
            });

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
});
