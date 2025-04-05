import { generateIdWithPrefix } from '../../../helpers/id-helper';

describe('id-helper', () => {
    describe('Id Generator', () => {
        const testCases = [
            {
                prefix: 'PLR',
            },
            {
                prefix: 'TM',
            },
            {
                prefix: 'RAND',
            },
        ];

        it.each(testCases)(
            'Generates an Id with the prefix: $prefix',
            ({ prefix }) => {
                const result = generateIdWithPrefix(prefix);

                expect(result.startsWith(prefix)).toBeTruthy();
            }
        );

        it.each(testCases)(
            'Should not generate 2 of the same id with prefix: ',
            ({ prefix }) => {
                const result1 = generateIdWithPrefix(prefix);
                const result2 = generateIdWithPrefix(prefix);

                expect(result1).not.toEqual(result2);
            }
        );
    });
});
