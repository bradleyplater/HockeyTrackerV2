import app from '../../server';
import request from 'supertest';
import {
    mockAuthKeys,
    mockEmptyAuthKeys,
    testApiKey,
} from '../helpers/authenticationMock';
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
            },
            {
                description: 'When only firstName is sent',
                expectedStatus: 400,
                body: { firstName: 'Bradley' },
            },
            {
                description: 'When only surname is sent',
                expectedStatus: 400,
                body: { surname: 'Doe' },
            },
        ];

        it.each(badPostBodyCases)(
            '$expectedStatus - $description',
            async ({ body, expectedStatus }) => {
                mockAuthKeys();
                const response = await request(app)
                    .post('/api/v2/player')
                    .set('x-api-key', testApiKey)
                    .send(body);

                expect(response.status).toBe(expectedStatus);
            }
        );

        it('403 - No api key sent', async () => {
            mockAuthKeys();
            const response = await request(app)
                .post('/api/v2/player')
                .send({ firstName: 'Bradley', surname: 'Doe' });

            expect(response.status).toBe(403);
        });

        it('403 - Incorrect api key sent', async () => {
            mockAuthKeys();
            const response = await request(app)
                .post('/api/v2/player')
                .set('x-api-key', 'incorrect key')
                .send({ firstName: 'Bradley', surname: 'Doe' });

            expect(response.status).toBe(403);
        });

        it('403 - When no api keys are stored', async () => {
            mockEmptyAuthKeys();
            const response = await request(app)
                .post('/api/v2/player')
                .set('x-api-key', 'incorrect key')
                .send({ firstName: 'Bradley', surname: 'Doe' });

            expect(response.status).toBe(403);
        });

        it('200 - Successfully create a player', async () => {
            mockAuthKeys();
            const response = await request(app)
                .post('/api/v2/player')
                .set('x-api-key', testApiKey)
                .send({ firstName: 'Bradley', surname: 'Doe' });

            expect(response.status).toBe(200);
        });
    });
});
