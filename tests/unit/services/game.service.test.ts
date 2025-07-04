import { generateGameMock } from '../../helpers/game-mock';
import * as PlayerRepository from '../../../src/repository/player.repository';
import { CreateGame } from '../../../src/services/game.service';
import { IGamePostBody } from '../../../src/types/GameTypes';
import * as gameRepository from '../../../src/repository/game.repository';
import * as idHelper from '../../../src/helpers/id-helper';

describe('GameService', () => {
    describe('CreateGame', () => {
        beforeEach(() => {
            jest.spyOn(
                gameRepository,
                'InsertGameToDatabase'
            ).mockResolvedValue(null as any);
        });

        afterEach(() => {
            jest.restoreAllMocks();
        });

        it('should log when player not added due to not existing in database', async () => {
            const postGame: IGamePostBody = {
                teamRoster: ['PLR123456'],
                team: 'TM123456',
                date: '2024-01-20T19:00:00.000Z',
                opponentName: 'team',
                seasonId: 'SSN2324',
            };

            const logSpy = jest.spyOn(console, 'log');
            jest.spyOn(
                PlayerRepository,
                'GetAllPlayersFromDatabase'
            ).mockResolvedValue([]);

            await CreateGame(postGame);

            expect(logSpy).toHaveBeenCalledWith(
                `Player not added to game due to not existing in database`,
                'PLR123456'
            );
        });

        it('should log when player not added due to not existing in team', async () => {
            const postGame: IGamePostBody = {
                teamRoster: ['PLR123456'],
                team: 'TM123456',
                date: '2024-01-20T19:00:00.000Z',
                opponentName: 'team',
                seasonId: 'SSN2324',
            };

            const logSpy = jest.spyOn(console, 'log');
            jest.spyOn(
                PlayerRepository,
                'GetAllPlayersFromDatabase'
            ).mockResolvedValue([
                {
                    _id: 'PLR123456',
                    teams: [{ teamId: 'TM654321', number: 1 }],
                    firstName: 'firstName',
                    surname: 'surname',
                },
            ]);

            await CreateGame(postGame);

            expect(logSpy).toHaveBeenCalledWith(
                `Player not added to game due to not existing in team`,
                'PLR123456'
            );
        });

        it('should return a hydrated new game object', async () => {
            const postGame: IGamePostBody = {
                teamRoster: ['PLR123456'],
                team: 'team-1',
                date: '2024-01-20T19:00:00.000Z',
                opponentName: 'team',
                seasonId: 'SSN2324',
            };

            const expectedResult = generateGameMock();
            expectedResult._id = 'GME123456';
            expectedResult.date = new Date('2024-01-20T19:00:00.000Z');
            expectedResult.opponentTeam = {
                name: 'team',
                goals: [],
                penalties: [],
            };
            expectedResult.team.roster = [
                {
                    playerId: 'PLR123456',
                    teamId: 'team-1',
                    stats: { assists: 0, goals: 0, pims: 0 },
                },
            ];
            expectedResult.team.goals = [];
            expectedResult.team.penalties = [];
            expectedResult.score.opponent = 0;
            expectedResult.score.team = 0;
            expectedResult.score.periods = [
                {
                    number: 1,
                    opponent: 0,
                    team: 0,
                },
                {
                    number: 2,
                    opponent: 0,
                    team: 0,
                },
                {
                    number: 3,
                    opponent: 0,
                    team: 0,
                },
            ];

            jest.spyOn(idHelper, 'generateIdWithPrefix').mockReturnValue(
                'GME123456'
            );

            const InsertGameToDatabaseSpy = jest
                .spyOn(gameRepository, 'InsertGameToDatabase')
                .mockResolvedValue(expectedResult);

            jest.spyOn(
                PlayerRepository,
                'GetAllPlayersFromDatabase'
            ).mockResolvedValue([
                {
                    _id: 'PLR123456',
                    teams: [{ teamId: 'team-1', number: 1 }],
                    firstName: 'firstName',
                    surname: 'surname',
                },
            ]);

            const result = await CreateGame(postGame);

            expect(InsertGameToDatabaseSpy).toHaveBeenCalledWith(
                expectedResult
            );

            expect(result).toEqual(expectedResult);
        });
    });
});
