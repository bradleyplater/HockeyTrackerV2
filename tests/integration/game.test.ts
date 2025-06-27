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

describe('Game Integration Tests', () => {
    describe('POST /game', () => {
        const endpoint = '/api/v2/game';

        const badPostBodyCases = [
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
            {
                description: 'When date is not a valid date',
                expectedStatus: StatusCodes.BAD_REQUEST,
                body: { date: 'fsdfsd' },
                mockAuthKeyFunction: () => mockEmptyAuthKeys(),
                apiKey: testApiKey,
            },
            {
                description: 'When opponent team is not a valid name',
                expectedStatus: StatusCodes.BAD_REQUEST,
                body: { date: '2024-01-20T19:00:00.000Z', opponentTeam: '' },
                mockAuthKeyFunction: () => mockEmptyAuthKeys(),
                apiKey: testApiKey,
            },
        ];

        it.each(badPostBodyCases)(
            '$expectedStatus - $description',
            async ({ body, expectedStatus, mockAuthKeyFunction, apiKey }) => {
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
                .send();

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
                .send();

            expect(response.status).toBe(StatusCodes.INTERNAL_SERVER_ERROR);
        });
    });
});
