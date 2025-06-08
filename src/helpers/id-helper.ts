export const generateIdWithPrefix = (prefix: string) => {
    const randomNumber = Math.floor(Math.random() * 1000000);

    // Format the number to have leading zeros and ensure it's 6 digits long
    const formattedNumber = String(randomNumber).padStart(6, '0');

    return `${prefix}${formattedNumber}`;
};
