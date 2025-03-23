import { collections } from '../../repository/database';
import * as SeasonsRepository from '../../repository/seasons.repository';
import app from '../../server';
import request from 'supertest';

describe('Seasons Integration Tests', () => {
    describe('GET', () => {
        const testCases = [
            {
                description:
                    'Should return empty array of seasons when no seasons are returned from mongo',
                mockedMongoResponse: [],
                expectedBody: [],
                expectedStatus: 200,
            },
            {
                description:
                    'Should return 1 item in the array when only 1 item returned from mongo',
                mockedMongoResponse: [{ _id: '123', name: '123' }],
                expectedBody: [{ _id: '123', name: '123' }],
                expectedStatus: 200,
            },
            {
                description:
                    'Should return multiple items in the array when multiple items are returned from mongo',
                mockedMongoResponse: [
                    { _id: '123', name: '123' },
                    { _id: '456', name: '456' },
                    { _id: '789', name: '789' },
                ],
                expectedBody: [
                    { _id: '123', name: '123' },
                    { _id: '456', name: '456' },
                    { _id: '789', name: '789' },
                ],
                expectedStatus: 200,
            },
        ];

        it.each(testCases)(
            '$expectedStatus - $description',
            async ({ mockedMongoResponse, expectedStatus, expectedBody }) => {
                jest.spyOn(
                    SeasonsRepository,
                    'GetAllSeasons'
                ).mockResolvedValue(mockedMongoResponse);

                const response = await request(app).get('/api/v2/seasons');
                expect(response.status).toBe(expectedStatus);
                expect(response.body).toEqual(expectedBody);
            }
        );

        it('500 - When error is thrown from GetAllSeasons', async () => {
            jest.spyOn(SeasonsRepository, 'GetAllSeasons').mockRejectedValue(
                null
            );

            const response = await request(app).get('/api/v2/seasons');
            expect(response.status).toBe(500);
        });
    });
});
