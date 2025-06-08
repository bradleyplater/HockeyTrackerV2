export const LogRouteStarted = (message: string) => {
    console.log('Started:', message);
};

export const LogRouteFinished = (message: string) => {
    console.log('Successfully Finished:', message);
};

export const LogRouteUnsuccessfulFinished = (message: string) => {
    console.log('Error failed to:', message);
};

export const LogBadRequest = (message: string) => {
    console.warn('Bad Request:', message);
};
