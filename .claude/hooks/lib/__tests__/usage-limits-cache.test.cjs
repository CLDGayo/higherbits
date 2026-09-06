#!/usr/bin/env node
'use strict';

const {
  hasAnthropicRuntimeOverride,
  isAnthropicBaseUrlOverride
} = require('../usage-limits-cache.cjs');

let failures = 0;

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function runCase(name, fn) {
  try {
    fn();
    console.log(`✓ ${name}`);
  } catch (error) {
    failures += 1;
    console.log(`✗ ${name}\n    ${error.message}`);
  }
}

runCase('canonical ANTHROPIC_BASE_URL is not an override', () => {
  assert(!hasAnthropicRuntimeOverride({ ANTHROPIC_BASE_URL: 'https://api.anthropic.com' }),
    'explicitly setting the default endpoint routes where the default would');
  assert(!hasAnthropicRuntimeOverride({ ANTHROPIC_BASE_URL: 'https://api.anthropic.com/' }),
    'a trailing slash should not change the verdict');
  assert(!hasAnthropicRuntimeOverride({ ANTHROPIC_BASE_URL: '  https://api.anthropic.com  ' }),
    'surrounding whitespace should not change the verdict');
  assert(!hasAnthropicRuntimeOverride({ ANTHROPIC_BASE_URL: '' }),
    'an empty base URL is not an override');
  assert(!hasAnthropicRuntimeOverride({ ANTHROPIC_MODEL: 'claude-sonnet-4' }),
    'model-only overrides should not disable quota display');
});

runCase('non-canonical base URLs still disable quota', () => {
  assert(hasAnthropicRuntimeOverride({ ANTHROPIC_BASE_URL: 'http://127.0.0.1:8317/api/provider/gemini' }),
    'a proxy base URL must still disable quota display');
  assert(hasAnthropicRuntimeOverride({ ANTHROPIC_BASE_URL: 'https://api.anthropic.com.evil.test' }),
    'a lookalike host must not be accepted as canonical');
  assert(hasAnthropicRuntimeOverride({ ANTHROPIC_BASE_URL: 'http://api.anthropic.com' }),
    'plain HTTP to the same host is not the canonical endpoint');
});

runCase('credential overrides disqualify regardless of base URL', () => {
  assert(hasAnthropicRuntimeOverride({
    ANTHROPIC_BASE_URL: 'https://api.anthropic.com',
    ANTHROPIC_API_KEY: 'sk-test'
  }), 'an API key disqualifies regardless of base URL');
  assert(hasAnthropicRuntimeOverride({
    ANTHROPIC_BASE_URL: 'https://api.anthropic.com',
    ANTHROPIC_AUTH_TOKEN: 'ccs-managed'
  }), 'an auth token disqualifies regardless of base URL');
});

runCase('isAnthropicBaseUrlOverride is exported and consistent', () => {
  assert(isAnthropicBaseUrlOverride('https://proxy.internal') === true, 'proxy is an override');
  assert(isAnthropicBaseUrlOverride('https://api.anthropic.com') === false, 'canonical is not');
  assert(isAnthropicBaseUrlOverride(undefined) === false, 'unset is not an override');
});

console.log(failures === 0 ? '\nall passed' : `\n${failures} FAILED`);
process.exit(failures === 0 ? 0 : 1);
