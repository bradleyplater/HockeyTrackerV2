import app from '../../server';
import request from 'supertest';
import {
    mockAuthKeys,
    mockEmptyAuthKeys,
    testApiKey,
} from '../helpers/authenticationMock';
import * as PlayerRepository from '../../repository/player.repository';

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
                expectedStatus: 400,
                body: {},
                mockAuthKeyFunction: () => mockAuthKeys(),
                apiKey: testApiKey,
            },
            {
                description: 'When only firstName is sent',
                expectedStatus: 400,
                body: { firstName: 'Bradley' },
                mockAuthKeyFunction: () => mockAuthKeys(),
                apiKey: testApiKey,
            },
            {
                description: 'When only surname is sent',
                expectedStatus: 400,
                body: { surname: 'Doe' },
                mockAuthKeyFunction: () => mockAuthKeys(),
                apiKey: testApiKey,
            },
            {
                description: 'No api key sent',
                expectedStatus: 403,
                body: { firstName: 'Bradley', surname: 'Doe' },
                mockAuthKeyFunction: () => mockAuthKeys(),
                apiKey: '',
            },
            {
                description: 'Incorrect api key sent',
                expectedStatus: 403,
                body: { firstName: 'Bradley', surname: 'Doe' },
                mockAuthKeyFunction: () => mockAuthKeys(),
                apiKey: 'incorrect key',
            },
            {
                description: 'When no api keys are stored',
                expectedStatus: 403,
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

            expect(response.status).toBe(500);
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

            expect(response.status).toBe(201);
            expect(response.body.firstName).toBe('Bradley');
            expect(response.body.surname).toBe('Doe');
        });
    });
});
