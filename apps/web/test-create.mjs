import { CodeSandbox } from '@codesandbox/sdk';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const sdk = new CodeSandbox(process.env.CSB_API_KEY);

async function run() {
  try {
    const data = await sdk.sandbox.create('d5t2cg');
    console.log("Create output:", data);
  } catch (e) {
    console.error(e);
  }
}
run();
