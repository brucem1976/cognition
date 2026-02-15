export default {
    preset: 'ts-jest',
    testEnvironment: 'jsdom',
    testEnvironmentOptions: {
        customExportConditions: ['node', 'require', 'default'],
    },
    transform: {
        "^.+\\.tsx?$": ["ts-jest", {
            tsconfig: 'tsconfig.jest.json'
        }]
    },
    moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/src/$1',
        '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
        '\\.(jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga)$': '<rootDir>/src/setupTests.ts',
        '^sinon$': 'sinon/lib/sinon.js',
    },
    transformIgnorePatterns: [
        "node_modules/(?!(aws-sdk-client-mock|@aws-sdk|sinon)/)"
    ],
    setupFilesAfterEnv: ['<rootDir>/src/setupTests.ts'],
};
