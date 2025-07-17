export const jwtConstants = {
  accessTokenSecret: process.env.JWT_ACCESS_SECRET || 'accessSecretKey123',
  refreshTokenSecret: process.env.JWT_REFRESH_SECRET || 'refreshSecretKey456',
  accessTokenExpiration: process.env.JWT_ACCESS_EXPIRATION || '15m',
  refreshTokenExpiration: process.env.JWT_REFRESH_EXPIRATION || '7d',
};

export const MAX_FAILED_LOGIN_ATTEMPTS = 5;
export const LOCKOUT_DURATION_MINUTES = 30;

console.log('🔧 JWT Configuration:');
console.log('- Access token expiration:', jwtConstants.accessTokenExpiration);
console.log('- Refresh token expiration:', jwtConstants.refreshTokenExpiration);
