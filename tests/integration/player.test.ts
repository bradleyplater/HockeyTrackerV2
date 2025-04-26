import app from '../../server';
import request from 'supertest';
import {
    mockAuthKeys,
    mockEmptyAuthKeys,
    testApiKey,
} from '../helpers/authenticationMock';
import * as PlayerRepository from '../../repository/player.repository';
import { StatusCodes } from 'http-status-codes';

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
                },
                {
                    _id: 'PLR654321',
                    firstName: 'Doe',
                    surname: 'Bradley',
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
            });
            expect(response.body[1]).toEqual({
                _id: 'PLR654321',
                firstName: 'Doe',
                surname: 'Bradley',
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
});
