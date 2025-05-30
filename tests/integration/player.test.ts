import app from '../../server';
import request from 'supertest';
import {
    mockAuthKeys,
    mockEmptyAuthKeys,
    testApiKey,
} from '../helpers/authenticationMock';
import * as PlayerRepository from '../../repository/player.repository';
import { StatusCodes } from 'http-status-codes';
import { DeleteResult } from 'mongodb';

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

        const notFoundTestCases = [
            {
                description: 'When mongo returns null',
                expectedStatusCode: StatusCodes.NOT_FOUND,
                mongoReturn: null,
            },
            {
                description: 'When mongo returns undefined',
                expectedStatusCode: StatusCodes.NOT_FOUND,
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
                    PlayerRepository,
                    'GetAllPlayersFromDatabase'
                ).mockResolvedValue(mongoReturn as PlayerRepository.IPlayer[]);

                const response = await request(app)
                    .get('/api/v2/player')
                    .set('x-api-key', testApiKey)
                    .send();

                expect(response.status).toBe(expectedStatusCode);
            }
        );
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

        const notFoundTestCases = [
            {
                description: 'When mongo returns null',
                expectedStatusCode: StatusCodes.NOT_FOUND,
                mongoReturn: null,
            },
            {
                description: 'When mongo returns undefined',
                expectedStatusCode: StatusCodes.NOT_FOUND,
                mongoReturn: undefined,
            },
        ];

        it.each(notFoundTestCases)(
            '404 - When mongo returns ',
            async ({ expectedStatusCode, mongoReturn }) => {
                mockAuthKeys();

                jest.spyOn(
                    PlayerRepository,
                    'GetPlayerByIdFromDatabase'
                ).mockResolvedValue(mongoReturn);

                const response = await request(app)
                    .get(`/api/v2/player/${playerId}`)
                    .set('x-api-key', testApiKey)
                    .send();

                expect(response.status).toBe(expectedStatusCode);
            }
        );
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
            ).mockResolvedValue({
                acknowledged: true,
                deletedCount: 1,
            });

            const response = await request(app)
                .delete(`/api/v2/player/${playerId}`)
                .set('x-api-key', testApiKey)
                .send();

            expect(response.status).toBe(StatusCodes.NO_CONTENT);
        });

        const notFoundTestCases = [
            {
                description: 'When no played is found',
                expectedStatusCode: StatusCodes.NOT_FOUND,
                mongoReturn: { acknowledged: true, deletedCount: 0 },
            },
            {
                description: 'When mongo returns undefined',
                expectedStatusCode: StatusCodes.INTERNAL_SERVER_ERROR,
                mongoReturn: undefined,
            },
            {
                description: 'When mongo returns null',
                expectedStatusCode: StatusCodes.INTERNAL_SERVER_ERROR,
                mongoReturn: null,
            },
        ];

        it.each(notFoundTestCases)(
            '$expectedStatusCode - $description',
            async ({ expectedStatusCode, mongoReturn }) => {
                mockAuthKeys();

                jest.spyOn(
                    PlayerRepository,
                    'RemovePlayerByIdFromDatabase'
                ).mockResolvedValue(mongoReturn as DeleteResult);

                const response = await request(app)
                    .delete(`/api/v2/player/${playerId}`)
                    .set('x-api-key', testApiKey)
                    .send();

                expect(response.status).toBe(expectedStatusCode);
            }
        );
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

        const testCases = [
            {
                description: 'Successfully updated a player',
                expectedStatusCode: StatusCodes.NO_CONTENT,
                mongoReturn: {
                    acknowledged: true,
                    matchedCount: 1,
                    modifiedCount: 1,
                    upsertedCount: 1,
                    upsertedId: '1234',
                },
            },
            {
                description: 'When no player is found',
                expectedStatusCode: StatusCodes.NOT_MODIFIED,
                mongoReturn: {
                    acknowledged: true,
                    matchedCount: 0,
                    modifiedCount: 0,
                    upsertedCount: 0,
                    upsertedId: '1234',
                },
            },
            {
                description: 'When mongo returns undefined',
                expectedStatusCode: StatusCodes.INTERNAL_SERVER_ERROR,
                mongoReturn: undefined,
            },
            {
                description: 'When mongo returns null',
                expectedStatusCode: StatusCodes.INTERNAL_SERVER_ERROR,
                mongoReturn: undefined,
            },
        ];

        it.each(testCases)(
            '$expectedStatusCode - $description',
            async ({ mongoReturn, expectedStatusCode }) => {
                mockAuthKeys();

                jest.spyOn(
                    PlayerRepository,
                    'UpdatePlayerDetailsByIdFromDatabase'
                ).mockResolvedValue(mongoReturn);

                const response = await request(app)
                    .patch(`/api/v2/player/PLR123456/details`)
                    .set('x-api-key', testApiKey)
                    .send({ firstName: 'Bradley', surname: 'Doe' });

                expect(response.status).toBe(expectedStatusCode);
            }
        );
    });
});
