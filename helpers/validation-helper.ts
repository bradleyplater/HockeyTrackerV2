const nameRegex = /^[A-Za-z'-]{2,30}$/;

export const isValidName = (name: string): boolean => {
    if (name === undefined) return false;

    return isValidString(nameRegex, name);
};

const isValidString = (regex: RegExp, value: string): boolean => {
    return regex.test(value);
};
