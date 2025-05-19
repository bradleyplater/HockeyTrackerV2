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
});
