import { Db, MongoClient } from 'mongodb';
import {
    closeClientConnection,
    connectToDatabase,
} from '../../../repository/database';

describe('Database Repository', () => {
    afterEach(() => {
        jest.restoreAllMocks();
        closeClientConnection();
    });
    it('Should call to create a database connection', async () => {
        const connectSpy = jest.spyOn(MongoClient.prototype, 'connect');

        await connectToDatabase();

        expect(connectSpy).toHaveBeenCalledTimes(1);
    });

    it('Should call to get the HockeyTracker database', async () => {
        const connectSpy = jest.spyOn(MongoClient.prototype, 'db');

        await connectToDatabase();

        expect(connectSpy).toHaveBeenCalledWith('HockeyTracker');
    });

    const collectionTestCases = [
        {
            collectionName: 'Seasons',
        },
    ];
    describe.each(collectionTestCases)(
        'Should call to get collection: ',
        ({ collectionName }) => {
            it(`${collectionName}`, async () => {
                const connectSpy = jest.spyOn(Db.prototype, 'collection');

                await connectToDatabase();

                expect(connectSpy).toHaveBeenCalledWith(collectionName);
            });
        }
    );
});
