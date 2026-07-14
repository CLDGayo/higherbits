import { CodeSandbox } from '@codesandbox/sdk';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const sdk = new CodeSandbox(process.env.CSB_API_KEY);

async function run() {
  const sandbox = await sdk.sandbox.start('kwk42j');
  console.log("fs keys:", Object.keys(sandbox.fs));
  
  let proto = Object.getPrototypeOf(sandbox.fs);
  while (proto) {
    console.log("prototype keys:", Object.getOwnPropertyNames(proto));
    proto = Object.getPrototypeOf(proto);
  }
}
run();
