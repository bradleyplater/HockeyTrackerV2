const nameRegex = /^[A-Za-z'-]{2,30}$/;
const teawmNameRegex = /^[A-Za-z.' -]{3,30}$/;

const playerIdRegex = /^PLR\d{6}$/;

export const isValidName = (name: string): boolean => {
    if (name === undefined) return false;

    return isValidString(nameRegex, name);
};

export const isValidTeamName = (name: string): boolean => {
    if (name === undefined) return false;

    if (name.trim() === '') return false;

    return isValidString(teawmNameRegex, name);
};

export const isValidPlayerId = (playerId: string): boolean => {
    return isValidString(playerIdRegex, playerId);
};

const isValidString = (regex: RegExp, value: string): boolean => {
    return regex.test(value);
};
