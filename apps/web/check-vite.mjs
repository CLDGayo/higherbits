import { CodeSandbox } from '@codesandbox/sdk';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const sdk = new CodeSandbox(process.env.CSB_API_KEY);

async function checkTemplate(id) {
  try {
    const sandbox = await sdk.sandbox.start(id);
    console.log(`Sandbox ${id} started`, sandbox);
  } catch (err) {
    console.error(`Error with ${id}:`, err);
  }
}

checkTemplate('vite-react-ts');
