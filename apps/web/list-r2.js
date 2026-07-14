const { S3Client, ListObjectsV2Command } = require("@aws-sdk/client-s3");
const client = new S3Client({
  region: "auto",
  endpoint: process.env.NEXT_PUBLIC_R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});
async function main() {
  const command = new ListObjectsV2Command({ Bucket: "higherbits" });
  try {
    const data = await client.send(command);
    console.log(data.Contents?.map(c => c.Key));
  } catch (err) {
    console.error(err);
  }
}
main();
