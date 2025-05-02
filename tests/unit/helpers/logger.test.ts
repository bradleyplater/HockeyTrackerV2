import {
    LogBadRequest,
    LogRouteFinished,
    LogRouteStarted,
    LogRouteUnsuccessfulFinished,
} from '../../../helpers/logger';

describe('Logger', () => {
    it('Calls console.log when you LogRouteStarted', () => {
        const spy = jest.spyOn(console, 'log');

        LogRouteStarted('test');

        expect(spy).toHaveBeenCalledWith('Started:', 'test');
    });

    it('Calls console.log when you LogBadRequest', () => {
        const spy = jest.spyOn(console, 'warn');

        LogBadRequest('test');

        expect(spy).toHaveBeenCalledWith('Bad Request:', 'test');
    });

    it('Calls console.log when you LogRouteFinished', () => {
        const spy = jest.spyOn(console, 'log');

        LogRouteFinished('test');

        expect(spy).toHaveBeenCalledWith('Successfully Finished:', 'test');
    });

    it('Calls console.log when you LogRouteUnsuccessfulFinished', () => {
        const spy = jest.spyOn(console, 'log');

        LogRouteUnsuccessfulFinished('test');

        expect(spy).toHaveBeenCalledWith('Error failed to:', 'test');
    });
});
