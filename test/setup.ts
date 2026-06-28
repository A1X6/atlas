// Provide the minimum env the server modules validate, so unit tests can run
// without a real .env. These are dummy values, never used against real services.
process.env.DATABASE_URL ||= "postgresql://user:pass@localhost:5432/atlas";
process.env.JWT_ACCESS_SECRET ||= "test-access-secret-".padEnd(40, "x");
process.env.JWT_REFRESH_SECRET ||= "test-refresh-secret-".padEnd(40, "y");
process.env.ACCESS_TOKEN_TTL ||= "15m";
process.env.REFRESH_TOKEN_TTL_DAYS ||= "30";
process.env.EXTERNAL_API_BASE_URL ||= "https://dummyjson.com";
// NODE_ENV is set to "test" by the Vitest runner automatically.
