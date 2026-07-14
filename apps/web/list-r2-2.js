const { S3Client, ListObjectsV2Command } = require('@aws-sdk/client-s3');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const r2Client = new S3Client({
  region: 'auto',
  endpoint: process.env.NEXT_PUBLIC_R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});

async function main() {
  const command = new ListObjectsV2Command({
    Bucket: 'components-code',
    Prefix: 'cozy_downloads',
  });
  const response = await r2Client.send(command);
  console.log(response.Contents.map(c => c.Key));
}
main();
