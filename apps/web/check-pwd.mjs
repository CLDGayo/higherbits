import { CodeSandbox } from '@codesandbox/sdk';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const sdk = new CodeSandbox(process.env.CSB_API_KEY);

async function run() {
  const sandbox = await sdk.sandbox.start('d5t2cg');
  const shell = await sandbox.shells.open('pwd');
  
  shell.onOutput((data) => {
    console.log("PWD:", data);
  });
  
  setTimeout(() => process.exit(0), 5000);
}
run();
