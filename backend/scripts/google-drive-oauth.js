const path = require('path');

const dotenv = require('dotenv');
const { google } = require('googleapis');

dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config();

const scope = 'https://www.googleapis.com/auth/drive';
const redirectUri = process.env.GOOGLE_REDIRECT_URI || 'http://localhost';

function createClient() {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error('Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in .env first.');
  }

  return new google.auth.OAuth2(clientId, clientSecret, redirectUri);
}

async function main() {
  const [command, code] = process.argv.slice(2);
  const client = createClient();

  if (command === 'url') {
    console.log(
      client.generateAuthUrl({
        access_type: 'offline',
        include_granted_scopes: true,
        prompt: 'consent',
        scope,
      }),
    );
    return;
  }

  if (command === 'token') {
    if (!code) {
      throw new Error('Usage: node scripts/google-drive-oauth.js token "<authorization_code>"');
    }

    const { tokens } = await client.getToken(code);
    if (!tokens.refresh_token) {
      throw new Error(
        'Google did not return a refresh token. Re-run the URL step and make sure prompt=consent is present.',
      );
    }

    console.log(tokens.refresh_token);
    return;
  }

  console.log('Usage:');
  console.log('  node scripts/google-drive-oauth.js url');
  console.log('  node scripts/google-drive-oauth.js token "<authorization_code>"');
}

main().catch(error => {
  console.error(error.message);
  process.exit(1);
});
