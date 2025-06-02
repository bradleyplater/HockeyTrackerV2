import app from '../../server';
import request from 'supertest';
import {
    mockAuthKeys,
    mockEmptyAuthKeys,
    testApiKey,
} from '../helpers/authenticationMock';
import * as PlayerRepository from '../../repository/player.repository';
import { StatusCodes } from 'http-status-codes';
import { PlayerErrors } from '../../helpers/error-helper';

describe('Player Integration Tests', () => {
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
                description: 'When only firstName is sent',
                expectedStatus: StatusCodes.BAD_REQUEST,
                body: { firstName: 'Bradley' },
                mockAuthKeyFunction: () => mockAuthKeys(),
                apiKey: testApiKey,
            },
            {
                description: 'When only surname is sent',
                expectedStatus: StatusCodes.BAD_REQUEST,
                body: { surname: 'Doe' },
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
                    .post('/api/v2/player')
                    .set('x-api-key', apiKey)
                    .send(body);

                expect(response.status).toBe(expectedStatus);
            }
        );

        it('500 - When error occurs, return 500', async () => {
            // Error occurs because mongo is not mocked so player isn't created

            mockAuthKeys();

            const response = await request(app)
                .post('/api/v2/player')
                .set('x-api-key', testApiKey)
                .send({ firstName: 'Bradley', surname: 'Doe' });

            expect(response.status).toBe(StatusCodes.INTERNAL_SERVER_ERROR);
        });

        it('201 - Successfully create a player', async () => {
            mockAuthKeys();

            jest.spyOn(
                PlayerRepository,
                'InsertPlayerToDatabase'
            ).mockResolvedValue({
                _id: 'PLR123456',
                firstName: 'Bradley',
                surname: 'Doe',
                teams: [],
            });

            const response = await request(app)
                .post('/api/v2/player')
                .set('x-api-key', testApiKey)
                .send({ firstName: 'Bradley', surname: 'Doe' });

            expect(response.status).toBe(StatusCodes.CREATED);
            expect(response.body.firstName).toBe('Bradley');
            expect(response.body.surname).toBe('Doe');
        });
    });

    describe('Get all', () => {
        beforeEach(() => {});

        afterEach(() => {
            jest.clearAllMocks();
            jest.resetAllMocks();
        });

        const badPostBodyCases = [
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

        it.each(badPostBodyCases)(
            '$expectedStatus - $description',
            async ({ expectedStatus, mockAuthKeyFunction, apiKey }) => {
                mockAuthKeyFunction();
                const response = await request(app)
                    .get('/api/v2/player')
                    .set('x-api-key', apiKey)
                    .send();

                expect(response.status).toBe(expectedStatus);
            }
        );

        it('500 - When error occurs, return 500', async () => {
            jest.spyOn(
                PlayerRepository,
                'GetAllPlayersFromDatabase'
            ).mockRejectedValue(new Error());

            mockAuthKeys();

            const response = await request(app)
                .get('/api/v2/player')
                .set('x-api-key', testApiKey)
                .send();

            expect(response.status).toBe(StatusCodes.INTERNAL_SERVER_ERROR);
        });

        it('200 - Successfully got all players', async () => {
            mockAuthKeys();

            jest.spyOn(
                PlayerRepository,
                'GetAllPlayersFromDatabase'
            ).mockResolvedValue([
                {
                    _id: 'PLR123456',
                    firstName: 'Bradley',
                    surname: 'Doe',
                    teams: [],
                },
                {
                    _id: 'PLR654321',
                    firstName: 'Doe',
                    surname: 'Bradley',
                    teams: [],
                },
            ]);

            const response = await request(app)
                .get('/api/v2/player')
                .set('x-api-key', testApiKey)
                .send();

            expect(response.status).toBe(StatusCodes.OK);
            expect(response.body[0]).toEqual({
                _id: 'PLR123456',
                firstName: 'Bradley',
                surname: 'Doe',
                teams: [],
            });
            expect(response.body[1]).toEqual({
                _id: 'PLR654321',
                firstName: 'Doe',
                surname: 'Bradley',
                teams: [],
            });
        });

        it('When HockeyTrackerError is thrown, correct status code is returned', async () => {
            mockAuthKeys();

            jest.spyOn(
                PlayerRepository,
                'GetAllPlayersFromDatabase'
            ).mockRejectedValue(PlayerErrors.PLAYER_NOT_FOUND);

            const response = await request(app)
                .get('/api/v2/player')
                .set('x-api-key', testApiKey)
                .send();

            expect(response.status).toBe(StatusCodes.NOT_FOUND);
        });
    });

    describe('Get player by id', () => {
        const playerId = 'PLR123456';

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
            {
                description: 'No playerId provided',
                expectedStatus: StatusCodes.BAD_REQUEST,
                mockAuthKeyFunction: () => mockAuthKeys(),
                apiKey: testApiKey,
                overwrittenPlayerId: null,
            },
            {
                description: 'Incorrect playerId: incorrect prefix',
                expectedStatus: StatusCodes.BAD_REQUEST,
                mockAuthKeyFunction: () => mockAuthKeys(),
                apiKey: testApiKey,
                overwrittenPlayerId: 'AAA123456',
            },
            {
                description: 'Incorrect playerId: incorrect digits',
                expectedStatus: StatusCodes.BAD_REQUEST,
                mockAuthKeyFunction: () => mockAuthKeys(),
                apiKey: testApiKey,
                overwrittenPlayerId: 'PLR12345',
            },
        ];

        it.each(badGetCases)(
            '$expectedStatus - $description',
            async ({
                expectedStatus,
                mockAuthKeyFunction,
                apiKey,
                overwrittenPlayerId,
            }) => {
                mockAuthKeyFunction();
                const response = await request(app)
                    .get(`/api/v2/player/${overwrittenPlayerId}`)
                    .set('x-api-key', apiKey)
                    .send();

                expect(response.status).toBe(expectedStatus);
            }
        );

        it('500 - When error occurs, return 500', async () => {
            jest.spyOn(
                PlayerRepository,
                'GetPlayerByIdFromDatabase'
            ).mockRejectedValue(new Error());

            mockAuthKeys();

            const response = await request(app)
                .get(`/api/v2/player/${playerId}`)
                .set('x-api-key', testApiKey)
                .send();

            expect(response.status).toBe(StatusCodes.INTERNAL_SERVER_ERROR);
        });

        it('200 - Successfully got all players', async () => {
            mockAuthKeys();

            jest.spyOn(
                PlayerRepository,
                'GetPlayerByIdFromDatabase'
            ).mockResolvedValue({
                _id: 'PLR123456',
                firstName: 'Bradley',
                surname: 'Doe',
                teams: [],
            });

            const response = await request(app)
                .get(`/api/v2/player/${playerId}`)
                .set('x-api-key', testApiKey)
                .send();

            expect(response.status).toBe(StatusCodes.OK);
            expect(response.body).toEqual({
                _id: 'PLR123456',
                firstName: 'Bradley',
                surname: 'Doe',
                teams: [],
            });
        });

        it('When HockeyTrackerError is thrown, correct status code is returned', async () => {
            mockAuthKeys();

            jest.spyOn(
                PlayerRepository,
                'GetPlayerByIdFromDatabase'
            ).mockRejectedValue(PlayerErrors.PLAYER_NOT_FOUND);

            const response = await request(app)
                .get(`/api/v2/player/${playerId}`)
                .set('x-api-key', testApiKey)
                .send();

            expect(response.status).toBe(StatusCodes.NOT_FOUND);
        });
    });

    describe('Delete player by id', () => {
        const playerId = 'PLR123456';

        beforeEach(() => {});

        afterEach(() => {
            jest.clearAllMocks();
            jest.resetAllMocks();
        });

        const badDeleteCases = [
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
            {
                description: 'No playerId provided',
                expectedStatus: StatusCodes.BAD_REQUEST,
                mockAuthKeyFunction: () => mockAuthKeys(),
                apiKey: testApiKey,
                overwrittenPlayerId: null,
            },
            {
                description: 'Incorrect playerId: incorrect prefix',
                expectedStatus: StatusCodes.BAD_REQUEST,
                mockAuthKeyFunction: () => mockAuthKeys(),
                apiKey: testApiKey,
                overwrittenPlayerId: 'AAA123456',
            },
            {
                description: 'Incorrect playerId: incorrect digits',
                expectedStatus: StatusCodes.BAD_REQUEST,
                mockAuthKeyFunction: () => mockAuthKeys(),
                apiKey: testApiKey,
                overwrittenPlayerId: 'PLR12345',
            },
        ];

        it.each(badDeleteCases)(
            '$expectedStatus - $description',
            async ({
                expectedStatus,
                mockAuthKeyFunction,
                apiKey,
                overwrittenPlayerId,
            }) => {
                mockAuthKeyFunction();
                const response = await request(app)
                    .delete(`/api/v2/player/${overwrittenPlayerId}`)
                    .set('x-api-key', apiKey)
                    .send();

                expect(response.status).toBe(expectedStatus);
            }
        );

        it('500 - When error occurs, return 500', async () => {
            jest.spyOn(
                PlayerRepository,
                'RemovePlayerByIdFromDatabase'
            ).mockRejectedValue(new Error());

            mockAuthKeys();

            const response = await request(app)
                .delete(`/api/v2/player/${playerId}`)
                .set('x-api-key', testApiKey)
                .send();

            expect(response.status).toBe(StatusCodes.INTERNAL_SERVER_ERROR);
        });

        it('200 - Successfully deleted a player', async () => {
            mockAuthKeys();

            jest.spyOn(
                PlayerRepository,
                'RemovePlayerByIdFromDatabase'
            ).mockResolvedValue();

            const response = await request(app)
                .delete(`/api/v2/player/${playerId}`)
                .set('x-api-key', testApiKey)
                .send();

            expect(response.status).toBe(StatusCodes.NO_CONTENT);
        });

        it('When error is thrown, correct status code is returned', async () => {
            mockAuthKeys();

            jest.spyOn(
                PlayerRepository,
                'RemovePlayerByIdFromDatabase'
            ).mockRejectedValue(PlayerErrors.PLAYER_NOT_FOUND);

            const response = await request(app)
                .delete(`/api/v2/player/${playerId}`)
                .set('x-api-key', testApiKey)
                .send();

            expect(response.status).toBe(StatusCodes.NOT_FOUND);
        });
    });

    describe('Patch player by id (details)', () => {
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
                playerId: 'PLR123456',
            },
            {
                description: 'When only firstName is sent',
                expectedStatus: StatusCodes.BAD_REQUEST,
                body: { firstName: 'Bradley' },
                mockAuthKeyFunction: () => mockAuthKeys(),
                apiKey: testApiKey,
                playerId: 'PLR123456',
            },
            {
                description: 'When only surname is sent',
                expectedStatus: StatusCodes.BAD_REQUEST,
                body: { surname: 'Doe' },
                mockAuthKeyFunction: () => mockAuthKeys(),
                apiKey: testApiKey,
                playerId: 'PLR123456',
            },
            {
                description: 'No api key sent',
                expectedStatus: StatusCodes.UNAUTHORIZED,
                body: { firstName: 'Bradley', surname: 'Doe' },
                mockAuthKeyFunction: () => mockAuthKeys(),
                apiKey: '',
                playerId: 'PLR123456',
            },
            {
                description: 'Incorrect api key sent',
                expectedStatus: StatusCodes.UNAUTHORIZED,
                body: { firstName: 'Bradley', surname: 'Doe' },
                mockAuthKeyFunction: () => mockAuthKeys(),
                apiKey: 'incorrect key',
                playerId: 'PLR123456',
            },
            {
                description: 'When no api keys are stored',
                expectedStatus: StatusCodes.UNAUTHORIZED,
                body: { firstName: 'Bradley', surname: 'Doe' },
                mockAuthKeyFunction: () => mockEmptyAuthKeys(),
                apiKey: testApiKey,
                playerId: 'PLR123456',
            },
            {
                description: 'No playerId provided',
                expectedStatus: StatusCodes.BAD_REQUEST,
                mockAuthKeyFunction: () => mockAuthKeys(),
                apiKey: testApiKey,
                playerId: null,
            },
            {
                description: 'Incorrect playerId: incorrect prefix',
                expectedStatus: StatusCodes.BAD_REQUEST,
                mockAuthKeyFunction: () => mockAuthKeys(),
                apiKey: testApiKey,
                playerId: 'AAA123456',
            },
            {
                description: 'Incorrect playerId: incorrect digits',
                expectedStatus: StatusCodes.BAD_REQUEST,
                mockAuthKeyFunction: () => mockAuthKeys(),
                apiKey: testApiKey,
                playerId: 'PLR12345',
            },
        ];

        it.each(badPostBodyCases)(
            '$expectedStatus - $description',
            async ({
                body,
                expectedStatus,
                mockAuthKeyFunction,
                apiKey,
                playerId,
            }) => {
                mockAuthKeyFunction();
                const response = await request(app)
                    .patch(`/api/v2/player/${playerId}/details`)
                    .set('x-api-key', apiKey)
                    .send(body);

                expect(response.status).toBe(expectedStatus);
            }
        );

        it('500 - When error occurs, return 500', async () => {
            jest.spyOn(
                PlayerRepository,
                'UpdatePlayerDetailsByIdFromDatabase'
            ).mockRejectedValue(new Error());

            mockAuthKeys();

            const response = await request(app)
                .patch(`/api/v2/player/PLR123456/details`)
                .set('x-api-key', testApiKey)
                .send({ firstName: 'Bradley', surname: 'Doe' });

            expect(response.status).toBe(StatusCodes.INTERNAL_SERVER_ERROR);
        });

        it('Successfully updated a player', async () => {
            mockAuthKeys();

            jest.spyOn(
                PlayerRepository,
                'UpdatePlayerDetailsByIdFromDatabase'
            ).mockResolvedValue();

            const response = await request(app)
                .patch(`/api/v2/player/PLR123456/details`)
                .set('x-api-key', testApiKey)
                .send({ firstName: 'Bradley', surname: 'Doe' });

            expect(response.status).toBe(StatusCodes.NO_CONTENT);
        });

        it('When UpdatePlayerDetailsByIdFromDatabase throws error should return correct response', async () => {
            mockAuthKeys();

            jest.spyOn(
                PlayerRepository,
                'UpdatePlayerDetailsByIdFromDatabase'
            ).mockRejectedValue(PlayerErrors.PLAYER_NOT_FOUND);

            const response = await request(app)
                .patch(`/api/v2/player/PLR123456/details`)
                .set('x-api-key', testApiKey)
                .send({ firstName: 'Bradley', surname: 'Doe' });

            expect(response.status).toBe(
                PlayerErrors.PLAYER_NOT_FOUND.statusCode
            );
        });
    });
});
