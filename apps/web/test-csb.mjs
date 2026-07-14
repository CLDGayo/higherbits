import { CodeSandbox } from '@codesandbox/sdk';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const sdk = new CodeSandbox(process.env.CSB_API_KEY);

async function main() {
  try {
    const sandboxId = 'rxmptq';
    console.log('Starting sandbox...', sandboxId);
    const startData = await sdk.sandbox.start(sandboxId);
    console.log('Start data received');
    
    // Connect to the sandbox programmatically using WebSocket?
    // The SDK provides sdk.sandbox.open? No, SDK is usually for browser.
    console.log('Cannot easily use SDK browser methods in node, but let us check template.');
  } catch (err) {
    console.error(err);
  }
}

main();
