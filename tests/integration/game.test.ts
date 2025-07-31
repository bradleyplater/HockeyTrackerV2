import { StatusCodes } from 'http-status-codes';
import {
    mockAuthKeys,
    mockEmptyAuthKeys,
    testApiKey,
} from '../helpers/authenticationMock';
import request from 'supertest';
import app from '../../server';
import * as GameService from '../../src/services/game.service';
import { generateGameMock, generateGameResponse } from '../helpers/game-mock';
import { IGamePostBody } from '../../src/types/GameTypes';

describe('Game Integration Tests', () => {
    describe('POST /game', () => {
        const endpoint = '/api/v2/game';
        const validBody: IGamePostBody = {
            date: '2024-01-20T19:00:00.000Z',
            opponentName: 'Test Team',
            team: 'TM123456',
            teamRoster: ['PLR123456', 'PLR123456'],
            seasonId: 'SSN2324',
        };

        const badPostBodyCases = [
            {
                description: 'No api key sent',
                expectedStatus: StatusCodes.UNAUTHORIZED,
                body: {},
                mockAuthKeyFunction: () => mockAuthKeys(),
                apiKey: '',
            },
            {
                description: 'Incorrect api key sent',
                expectedStatus: StatusCodes.UNAUTHORIZED,
                body: {},
                mockAuthKeyFunction: () => mockAuthKeys(),
                apiKey: 'incorrect key',
            },
            {
                description: 'When no api keys are stored',
                expectedStatus: StatusCodes.UNAUTHORIZED,
                body: {},
                mockAuthKeyFunction: () => mockEmptyAuthKeys(),
                apiKey: testApiKey,
            },
            {
                description: 'When date is not a valid date',
                expectedStatus: StatusCodes.BAD_REQUEST,
                body: { date: 'fsdfsd' },
                mockAuthKeyFunction: () => mockAuthKeys(),
                apiKey: testApiKey,
            },
            {
                description: 'When opponent team is not a valid name',
                expectedStatus: StatusCodes.BAD_REQUEST,
                body: { date: '2024-01-20T19:00:00.000Z', opponentName: '' },
                mockAuthKeyFunction: () => mockAuthKeys(),
                apiKey: testApiKey,
            },
            {
                description: 'When team is not a valid teamId',
                expectedStatus: StatusCodes.BAD_REQUEST,
                body: {
                    date: '2024-01-20T19:00:00.000Z',
                    opponentName: 'Test Team',
                    team: '',
                },
                mockAuthKeyFunction: () => mockAuthKeys(),
                apiKey: testApiKey,
            },
            {
                description: 'When teamRoster is undefined',
                expectedStatus: StatusCodes.BAD_REQUEST,
                body: {
                    date: '2024-01-20T19:00:00.000Z',
                    opponentName: 'Test Team',
                    team: 'TM123456',
                },
                mockAuthKeyFunction: () => mockAuthKeys(),
                apiKey: testApiKey,
            },
            {
                description: 'When seasonId is not a valid seasonId',
                expectedStatus: StatusCodes.BAD_REQUEST,
                body: {
                    date: '2024-01-20T19:00:00.000Z',
                    opponentName: 'Test Team',
                    team: 'TM123456',
                    seasonId: 'SSN',
                },
                mockAuthKeyFunction: () => mockAuthKeys(),
                apiKey: testApiKey,
            },
            {
                description: 'When team roster is undefined',
                expectedStatus: StatusCodes.BAD_REQUEST,
                body: {
                    date: '2024-01-20T19:00:00.000Z',
                    opponentName: 'Test Team',
                    team: 'TM123456',
                    seasonId: 'SSN1234',
                    teamRoster: undefined,
                },
                mockAuthKeyFunction: () => mockAuthKeys(),
                apiKey: testApiKey,
            },
            {
                description: 'When team roster contains invalid playerIds',
                expectedStatus: StatusCodes.BAD_REQUEST,
                body: {
                    date: '2024-01-20T19:00:00.000Z',
                    opponentName: 'Test Team',
                    team: 'TM123456',
                    seasonId: 'SSN1234',
                    teamRoster: ['PLR12345'],
                },
                mockAuthKeyFunction: () => mockAuthKeys(),
                apiKey: testApiKey,
            },
        ];

        it.each(badPostBodyCases)(
            '$expectedStatus - $description',
            async ({
                body,
                expectedStatus,
                mockAuthKeyFunction,
                apiKey,
                description,
            }) => {
                mockAuthKeyFunction();
                const response = await request(app)
                    .post(endpoint)
                    .set('x-api-key', apiKey)
                    .send(body);

                expect(response.status).toBe(expectedStatus);
            }
        );

        it('201 - Successfully create a game', async () => {
            mockAuthKeys();

            jest.spyOn(GameService, 'CreateGame').mockResolvedValue(
                generateGameMock()
            );

            const response = await request(app)
                .post(endpoint)
                .set('x-api-key', testApiKey)
                .send(validBody);

            expect(response.status).toBe(StatusCodes.CREATED);
            expect(response.body).toEqual(generateGameResponse());
        });

        it('500 - When error occurs, return 500', async () => {
            jest.spyOn(GameService, 'CreateGame').mockRejectedValue(
                new Error()
            );

            mockAuthKeys();

            const response = await request(app)
                .post(endpoint)
                .set('x-api-key', testApiKey)
                .send(validBody);

            expect(response.status).toBe(StatusCodes.INTERNAL_SERVER_ERROR);
        });
    });
});
