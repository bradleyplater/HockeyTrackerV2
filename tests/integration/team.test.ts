import app from '../../server';
import request from 'supertest';
import { StatusCodes } from 'http-status-codes';
import {
    mockAuthKeys,
    mockEmptyAuthKeys,
    testApiKey,
} from '../helpers/authenticationMock';
import * as TeamRepository from '../../repository/team.repository';

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
});
