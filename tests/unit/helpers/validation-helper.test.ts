import {
    isValidName,
    isValidPlayerId,
} from '../../../helpers/validation-helper';

describe('validation-helper', () => {
    describe('name validation', () => {
        const testCases = [
            {
                description:
                    'A name with just lowercase characters should be accepted',
                name: 'bradley',
                expectedResponse: true,
            },
            {
                description:
                    'A name with just lowercase characters should be accepted',
                name: 'BRADLEY',
                expectedResponse: true,
            },
            {
                description:
                    'A name with both lowercase and uppercase characters should be accepted',
                name: 'Bradley',
                expectedResponse: true,
            },
            {
                description: 'A name with a hyphen should be accepted',
                name: 'Anne-Marie',
                expectedResponse: true,
            },
            {
                description: 'A name with an apostrophe should be accepted',
                name: "O'Conner",
                expectedResponse: true,
            },
            {
                description: 'A name with numbers should not be accepted',
                name: 'John123',
                expectedResponse: false,
            },
            {
                description:
                    'A name with less than 2 characters should not be accepted',
                name: 'J',
                expectedResponse: false,
            },
            {
                description:
                    'A name with more than 30 characters should not be accepted',
                name: 'TooLongNameThatExceedsThirtyCharactersLimit',
                expectedResponse: false,
            },
            {
                description: 'A name that is undefined should not be accepted',
                name: undefined,
                expectedResponse: false,
            },
        ];

        it.each(testCases)(
            '$description - $name',
            ({ name, expectedResponse }) => {
                expect(isValidName(name as string)).toBe(expectedResponse);
            }
        );
    });

    describe('playerId', () => {
        const testCases = [
            {
                description:
                    'A playerId with uppercase prefix and 6 digits should be accepted',
                playerdId: 'PLR123456',
                expectedResponse: true,
            },
            {
                description:
                    'A playerId with lowercase prefix and 6 digits should not accepted',
                playerdId: 'plr123456',
                expectedResponse: false,
            },
            {
                description:
                    'A playerId with no prefix and 6 digits should not accepted',
                playerdId: '123456',
                expectedResponse: false,
            },
            {
                description:
                    'A playerId with prefix and 5 digits should not accepted',
                playerdId: 'PLR12345',
                expectedResponse: false,
            },
            {
                description:
                    'A playerId with prefix and 7 digits should not accepted',
                playerdId: 'PLR1234567',
                expectedResponse: false,
            },
            {
                description: 'A playerId that is undefined should not accepted',
                playerdId: undefined,
                expectedResponse: false,
            },
        ];

        it.each(testCases)(
            '$description - $playerdId',
            ({ playerdId, expectedResponse }) => {
                expect(isValidPlayerId(playerdId as string)).toBe(
                    expectedResponse
                );
            }
        );
    });
});
