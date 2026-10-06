import assert from 'node:assert/strict'
import { generateAgyPromptGuidance } from '../agy-auto-index-prompts.mjs'

let model = ''
const guidance = await generateAgyPromptGuidance('component', 'demo', async (_command, args) => {
  model = args[args.indexOf('--model') + 1]
  return { stdout: JSON.stringify({ status: 'SUCCESS', response: 'Preserve the accessible button and spacing.' }) }
})
assert.equal(model, 'gemini-3.8-flash-high')
assert.match(guidance, /accessible button/)
await assert.rejects(generateAgyPromptGuidance('', 'demo', async () => ({ stdout: '' })), /required/)
console.log('agy guidance contract passed')
