module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    roots: ['<rootDir>/nodes', '<rootDir>/src', '<rootDir>/test'],
    transform: {
        '^.+\\.tsx?$': 'ts-jest'
    },
    setupFiles: ['<rootDir>/test/jest.setup.js'],
    testRegex: '(/__tests__/.*|(\\.|/)(test|spec))\\.tsx?$',
    moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
    verbose: true,
    testPathIgnorePatterns: ['/node_modules/', '/dist/'],
    moduleNameMapper: {
        '^(\\.{1,2}/.*)\\.js$': '$1',
        '^../../../src/(.*)$': '<rootDir>/src/$1',
        '^openai(?:/.*)?$': '<rootDir>/test/__mocks__/openai.js',
        '^uuid$': '<rootDir>/test/__mocks__/uuid.js',
        // @modelcontextprotocol/sdk is ESM-only (type:module, no exports map, no CJS builds).
        // It cannot be require()'d in Jest's CJS environment and crashes the worker.
        // The MCP core tests only exercise pure validation functions that don't
        // use these imports, so stubbing them out is safe.
        // Note: @langchain/core is NOT stubbed here because it ships CJS builds
        // (e.g. tools.cjs) that Jest can require() normally.
        '^@modelcontextprotocol/sdk/(.*)$': '<rootDir>/test/__mocks__/esm-stub.js'
    }
}
