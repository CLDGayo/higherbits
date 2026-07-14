import { CodeSandbox } from '@codesandbox/sdk';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const sdk = new CodeSandbox(process.env.CSB_API_KEY);

async function checkTemplate(id) {
  try {
    const sandbox = await sdk.sandbox.start(id);
    console.log(`Sandbox ${id} started`);
    const root = await sandbox.fs.readdir("/");
    console.log(`readdir /:`, root);
    
    // Check package.json
    try {
      const stat = await sandbox.fs.stat("/package.json");
      console.log(`package.json exists`, stat);
    } catch (e) {
      console.error(`package.json missing`, e);
    }
  } catch (err) {
    console.error(`Error with ${id}:`, err);
  }
}

checkTemplate('d5t2cg');
