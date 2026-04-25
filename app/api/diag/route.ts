export async function GET() {
  const dbUrl = process.env.DATABASE_URL || '';
  const jwtSecret = process.env.JWT_SECRET || '';
  return Response.json({
    DATABASE_URL_length: dbUrl.length,
    DATABASE_URL_prefix: dbUrl.substring(0, 30),
    JWT_SECRET_length: jwtSecret.length,
    SMTP_HOST: process.env.SMTP_HOST || 'NOT SET',
    NODE_ENV: process.env.NODE_ENV || 'NOT SET',
  })
}