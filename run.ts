import * as dotenv from 'dotenv';
dotenv.config({ path: 'apps/web/.env.local' });
import { generateGhlTemplate } from './apps/web/lib/ghl-generator';
async function run() {
  await generateGhlTemplate(18);
}
run();
