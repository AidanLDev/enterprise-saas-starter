// Runs before test modules load. Handlers and services read these at import
// time, so they must be set here rather than in a beforeEach hook.
process.env.TABLE_NAME = 'test-table';
process.env.USER_POOL_ID = 'us-east-1_test';
