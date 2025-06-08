import app from '../../server';
import request from 'supertest';
import { StatusCodes } from 'http-status-codes';
import {
    mockAuthKeys,
    mockEmptyAuthKeys,
    testApiKey,
} from '../helpers/authenticationMock';
import * as TeamRepository from '../../repository/team.repository';
import * as TeamService from '../../services/team.service';
import * as PlayerRepository from '../../repository/player.repository';
import { PlayerErrors, TeamErrors } from '../../helpers/error-helper';

describe('Team Intergration Tests', () => {
    describe('Post', () => {
        beforeEach(() => {});

        afterEach(() => {
            jest.clearAllMocks();
            jest.resetAllMocks();
        });

        const badPostBodyCases = [
            {
                description: 'When empty body is sent',
                expectedStatus: StatusCodes.BAD_REQUEST,
                body: {},
                mockAuthKeyFunction: () => mockAuthKeys(),
                apiKey: testApiKey,
            },
            {
                description: 'No api key sent',
                expectedStatus: StatusCodes.UNAUTHORIZED,
                body: { firstName: 'Bradley', surname: 'Doe' },
                mockAuthKeyFunction: () => mockAuthKeys(),
                apiKey: '',
            },
            {
                description: 'Incorrect api key sent',
                expectedStatus: StatusCodes.UNAUTHORIZED,
                body: { firstName: 'Bradley', surname: 'Doe' },
                mockAuthKeyFunction: () => mockAuthKeys(),
                apiKey: 'incorrect key',
            },
            {
                description: 'When no api keys are stored',
                expectedStatus: StatusCodes.UNAUTHORIZED,
                body: { firstName: 'Bradley', surname: 'Doe' },
                mockAuthKeyFunction: () => mockEmptyAuthKeys(),
                apiKey: testApiKey,
            },
        ];

        it.each(badPostBodyCases)(
            '$expectedStatus - $description',
            async ({ body, expectedStatus, mockAuthKeyFunction, apiKey }) => {
                mockAuthKeyFunction();
                const response = await request(app)
                    .post('/api/v2/team')
                    .set('x-api-key', apiKey)
                    .send(body);

                expect(response.status).toBe(expectedStatus);
            }
        );

        it('500 - When error occurs, return 500', async () => {
            // Error occurs because mongo is not mocked so player isn't created

            mockAuthKeys();

            const response = await request(app)
                .post('/api/v2/team')
                .set('x-api-key', testApiKey)
                .send({ name: 'Peterborough Warriors' });

            expect(response.status).toBe(StatusCodes.INTERNAL_SERVER_ERROR);
        });

        it('201 - Successfully create a player', async () => {
            mockAuthKeys();

            jest.spyOn(
                TeamRepository,
                'InsertTeamToDatabase'
            ).mockResolvedValue({
                _id: 'TM123456',
                name: 'Peterborough Warriors',
                players: [],
            });

            const response = await request(app)
                .post('/api/v2/team')
                .set('x-api-key', testApiKey)
                .send({ name: 'Peterborough Warriors' });

            expect(response.status).toBe(StatusCodes.CREATED);
            expect(response.body.name).toBe('Peterborough Warriors');
            expect(response.body.players).toEqual([]);
        });
    });

    describe('Get all teams', () => {
        beforeEach(() => {});

        afterEach(() => {
            jest.clearAllMocks();
            jest.resetAllMocks();
        });

        const badGetCases = [
            {
                description: 'No api key sent',
                expectedStatus: StatusCodes.UNAUTHORIZED,
                mockAuthKeyFunction: () => mockAuthKeys(),
                apiKey: '',
            },
            {
                description: 'Incorrect api key sent',
                expectedStatus: StatusCodes.UNAUTHORIZED,
                mockAuthKeyFunction: () => mockAuthKeys(),
                apiKey: 'incorrect key',
            },
            {
                description: 'When no api keys are stored',
                expectedStatus: StatusCodes.UNAUTHORIZED,
                mockAuthKeyFunction: () => mockEmptyAuthKeys(),
                apiKey: testApiKey,
            },
        ];

        it.each(badGetCases)(
            '$expectedStatus - $description',
            async ({ expectedStatus, mockAuthKeyFunction, apiKey }) => {
                mockAuthKeyFunction();
                const response = await request(app)
                    .get('/api/v2/team')
                    .set('x-api-key', apiKey)
                    .send();

                expect(response.status).toBe(expectedStatus);
            }
        );

        it('500 - When error occurs, return 500', async () => {
            jest.spyOn(
                TeamRepository,
                'GetAllTeamsFromDatabase'
            ).mockRejectedValue(new Error());

            mockAuthKeys();

            const response = await request(app)
                .get('/api/v2/team')
                .set('x-api-key', testApiKey)
                .send();

            expect(response.status).toBe(StatusCodes.INTERNAL_SERVER_ERROR);
        });

        it('200 - Successfully got all teams', async () => {
            mockAuthKeys();

            jest.spyOn(
                TeamRepository,
                'GetAllTeamsFromDatabase'
            ).mockResolvedValue([
                {
                    _id: 'TM123456',
                    name: 'Peterborough Warriors',
                    players: [],
                },
                {
                    _id: 'TM654321',
                    name: 'Peterborough Preds',
                    players: [],
                },
            ]);

            const response = await request(app)
                .get('/api/v2/team')
                .set('x-api-key', testApiKey)
                .send();

            expect(response.status).toBe(StatusCodes.OK);
            expect(response.body[0]).toEqual({
                _id: 'TM123456',
                name: 'Peterborough Warriors',
                players: [],
            });
            expect(response.body[1]).toEqual({
                _id: 'TM654321',
                name: 'Peterborough Preds',
                players: [],
            });
        });

        const notFoundTestCases = [
            {
                description: 'When mongo returns null',
                expectedStatusCode: StatusCodes.OK,
                mongoReturn: null,
            },
            {
                description: 'When mongo returns undefined',
                expectedStatusCode: StatusCodes.OK,
                mongoReturn: undefined,
            },
            {
                description: 'When mongo returns empty array',
                expectedStatusCode: StatusCodes.OK,
                mongoReturn: [],
            },
        ];

        it.each(notFoundTestCases)(
            '404 - When mongo returns ',
            async ({ expectedStatusCode, mongoReturn }) => {
                mockAuthKeys();

                jest.spyOn(
                    TeamRepository,
                    'GetAllTeamsFromDatabase'
                ).mockResolvedValue(mongoReturn as TeamRepository.ITeam[]);

                const response = await request(app)
                    .get('/api/v2/team')
                    .set('x-api-key', testApiKey)
                    .send();

                expect(response.status).toBe(expectedStatusCode);
            }
        );
    });

    describe('Add player to team', () => {
        const endpoint = '/api/v2/team/addplayer/TM123456';

        beforeEach(() => {});

        afterEach(() => {
            jest.clearAllMocks();
            jest.resetAllMocks();
        });

        const badAddPlayerCases = [
            {
                description: 'No api key sent',
                expectedStatus: StatusCodes.UNAUTHORIZED,
                mockAuthKeyFunction: () => mockAuthKeys(),
                apiKey: '',
                body: { playerId: 'PLR123456', number: 23 },
            },
            {
                description: 'Incorrect api key sent',
                expectedStatus: StatusCodes.UNAUTHORIZED,
                mockAuthKeyFunction: () => mockAuthKeys(),
                apiKey: 'incorrect key',
                body: { playerId: 'PLR123456', number: 23 },
            },
            {
                description: 'When no api keys are stored',
                expectedStatus: StatusCodes.UNAUTHORIZED,
                mockAuthKeyFunction: () => mockEmptyAuthKeys(),
                apiKey: testApiKey,
                body: { playerId: 'PLR123456', number: 23 },
            },
            {
                description: 'When empty body is sent',
                expectedStatus: StatusCodes.BAD_REQUEST,
                mockAuthKeyFunction: () => mockAuthKeys(),
                apiKey: testApiKey,
                body: {},
            },
            {
                description: 'When playerId is missing',
                expectedStatus: StatusCodes.BAD_REQUEST,
                mockAuthKeyFunction: () => mockAuthKeys(),
                apiKey: testApiKey,
                body: { number: 23 },
            },
            {
                description: 'When number is missing',
                expectedStatus: StatusCodes.BAD_REQUEST,
                mockAuthKeyFunction: () => mockAuthKeys(),
                apiKey: testApiKey,
                body: { playerId: 'PLR123456' },
            },
        ];

        it.each(badAddPlayerCases)(
            '$expectedStatus - $description',
            async ({ body, expectedStatus, mockAuthKeyFunction, apiKey }) => {
                mockAuthKeyFunction();
                const response = await request(app)
                    .patch(endpoint)
                    .set('x-api-key', apiKey)
                    .send(body);

                expect(response.status).toBe(expectedStatus);
            }
        );

        it('400 - Team Service returns HockeyTracker error', async () => {
            mockAuthKeys();

            jest.spyOn(TeamService, 'addPlayerToTeam').mockRejectedValue(
                TeamErrors.PLAYER_ALREADY_ON_TEAM
            );

            const response = await request(app)
                .patch(endpoint)
                .set('x-api-key', testApiKey)
                .send({ playerId: 'PLR123456', number: 23 });

            expect(response.status).toBe(StatusCodes.BAD_REQUEST);
        });

        it('500 - Team Service returns error', async () => {
            mockAuthKeys();

            jest.spyOn(TeamService, 'addPlayerToTeam').mockRejectedValue(
                new Error()
            );

            const response = await request(app)
                .patch(endpoint)
                .set('x-api-key', testApiKey)
                .send({ playerId: 'PLR123456', number: 23 });

            expect(response.status).toBe(StatusCodes.INTERNAL_SERVER_ERROR);
        });

        it('200 - Successfully added player to team', async () => {
            mockAuthKeys();

            const mockTeam = {
                _id: 'TM123456',
                name: 'Peterborough Warriors',
                players: [{ playerId: 'PLR123456', number: 23 }],
            };

            jest.spyOn(TeamService, 'addPlayerToTeam').mockResolvedValue(
                mockTeam as TeamRepository.ITeam
            );

            const response = await request(app)
                .patch(endpoint)
                .set('x-api-key', testApiKey)
                .send({ playerId: 'PLR123456', number: 23 });

            expect(response.status).toBe(StatusCodes.OK);
            expect(response.body).toEqual({
                _id: 'TM123456',
                name: 'Peterborough Warriors',
                players: [{ playerId: 'PLR123456', number: 23 }],
            });
        });
    });

    describe('Remove player from team', () => {
        const endpoint = '/api/v2/team/removeplayer/TM123456';

        beforeEach(() => {});

        afterEach(() => {
            jest.clearAllMocks();
            jest.resetAllMocks();
        });

        const badAddPlayerCases = [
            {
                description: 'No api key sent',
                expectedStatus: StatusCodes.UNAUTHORIZED,
                mockAuthKeyFunction: () => mockAuthKeys(),
                apiKey: '',
                body: { playerId: 'PLR123456' },
            },
            {
                description: 'Incorrect api key sent',
                expectedStatus: StatusCodes.UNAUTHORIZED,
                mockAuthKeyFunction: () => mockAuthKeys(),
                apiKey: 'incorrect key',
                body: { playerId: 'PLR123456' },
            },
            {
                description: 'When no api keys are stored',
                expectedStatus: StatusCodes.UNAUTHORIZED,
                mockAuthKeyFunction: () => mockEmptyAuthKeys(),
                apiKey: testApiKey,
                body: { playerId: 'PLR123456' },
            },
            {
                description: 'When empty body is sent',
                expectedStatus: StatusCodes.BAD_REQUEST,
                mockAuthKeyFunction: () => mockAuthKeys(),
                apiKey: testApiKey,
                body: {},
            },
        ];

        it.each(badAddPlayerCases)(
            '$expectedStatus - $description',
            async ({ body, expectedStatus, mockAuthKeyFunction, apiKey }) => {
                mockAuthKeyFunction();
                const response = await request(app)
                    .patch(endpoint)
                    .set('x-api-key', apiKey)
                    .send(body);

                expect(response.status).toBe(expectedStatus);
            }
        );

        it('400 - Team Service returns HockeyTracker error', async () => {
            mockAuthKeys();

            jest.spyOn(TeamService, 'removePlayerFromTeam').mockRejectedValue(
                PlayerErrors.PLAYER_NOT_ON_TEAM
            );

            const response = await request(app)
                .patch(endpoint)
                .set('x-api-key', testApiKey)
                .send({ playerId: 'PLR123456' });

            expect(response.status).toBe(StatusCodes.NOT_FOUND);
        });

        it('500 - Team Service returns error', async () => {
            mockAuthKeys();

            jest.spyOn(TeamService, 'removePlayerFromTeam').mockRejectedValue(
                new Error()
            );

            const response = await request(app)
                .patch(endpoint)
                .set('x-api-key', testApiKey)
                .send({ playerId: 'PLR123456' });

            expect(response.status).toBe(StatusCodes.INTERNAL_SERVER_ERROR);
        });

        it('204 - Successfully removed player from team', async () => {
            mockAuthKeys();

            jest.spyOn(TeamService, 'removePlayerFromTeam').mockResolvedValue();

            const response = await request(app)
                .patch(endpoint)
                .set('x-api-key', testApiKey)
                .send({ playerId: 'PLR123456' });

            expect(response.status).toBe(StatusCodes.NO_CONTENT);
        });
    });
});
