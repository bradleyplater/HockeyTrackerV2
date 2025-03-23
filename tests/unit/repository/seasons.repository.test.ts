import { collections } from '../../../repository/database';
import * as seasonsModule from '../../../repository/seasons.repository';
import { GetAllSeasons } from '../../../repository/seasons.repository';

describe('GetAllSeasons', () => {
    it('should call out to mongodb once', async () => {
        const mockToArray = jest.fn().mockResolvedValue([]);
        const mockFind = jest.fn().mockReturnValue({ toArray: mockToArray });

        collections.seasons = { find: mockFind } as any;

        await GetAllSeasons();

        expect(mockFind).toHaveBeenCalledTimes(1);
        expect(mockToArray).toHaveBeenCalledTimes(1);
    });
});
