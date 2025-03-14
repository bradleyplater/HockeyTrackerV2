import app from '../../server';
import request from 'supertest';

describe('Liveness Integration Tests', () => {
    describe('GET', () => {
        it('200 - Should return api is live message', async () => {
            const response = await request(app).get('/api/v2/liveness');
            expect(response.status).toBe(200);
            expect(response.text).toEqual('We are live baby!');
        });
    });
});
