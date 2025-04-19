import { GetAllApiKeys } from '../../../repository/apiKey.repository';
import { collections } from '../../../repository/database';
import * as seasonsModule from '../../../repository/seasons.repository';
import { GetAllSeasons } from '../../../repository/seasons.repository';

describe('GetAllApiKeys', () => {
    it('should call out to mongodb once', async () => {
        const mockToArray = jest.fn().mockResolvedValue([]);
        const mockFind = jest.fn().mockReturnValue({ toArray: mockToArray });

        collections.apiKeys = { find: mockFind } as any;

        await GetAllApiKeys();

        expect(mockFind).toHaveBeenCalledTimes(1);
        expect(mockToArray).toHaveBeenCalledTimes(1);
    });

    it('should not call out to mongodb once', async () => {
        const mockToArray = jest.fn().mockResolvedValue([]);
        const mockFind = jest.fn().mockReturnValue({ toArray: mockToArray });

        collections.apiKeys = undefined as any;

        await GetAllApiKeys();

        expect(mockFind).not.toHaveBeenCalled();
        expect(mockToArray).not.toHaveBeenCalled();
    });
});
