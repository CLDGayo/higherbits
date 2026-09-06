#!/usr/bin/env node
'use strict';

const path = require('path');
const { checkPrivacy, stripWriteContent } = require('../lib/privacy-checker.cjs');

let failures = 0;

// Point config lookups at a directory that cannot exist, so .vc.json's
// privacyBlock and privacyAllowlist can never silently neutralize these tests.
const ISOLATED_CONFIG_DIR = path.join(__dirname, '__no_such_config_dir__');

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

const opts = { allowBash: false, configDir: ISOLATED_CONFIG_DIR };
const bash = (command) => checkPrivacy({ toolName: 'Bash', toolInput: { command }, options: opts });
const read = (p) => checkPrivacy({ toolName: 'Read', toolInput: { file_path: p }, options: opts });

// ───────────────────────────────────────────────────────────────────────────
// Must NOT block: write content and environment-object property reads
// ───────────────────────────────────────────────────────────────────────────

runCase('quoted heredoc body with an env-object read is not a path', () => {
  const cmd = [
    "cat > hook.cjs <<'EOF'",
    'const THRESHOLD = Number(process.env.HANDOFF_THRESHOLD || 0.85);',
    'EOF',
  ].join('\n');
  assert(bash(cmd).blocked === false, 'heredoc body should be treated as content');
});

runCase('quoted heredoc body mentioning a dotenv path in prose is not a path', () => {
  const cmd = [
    "cat > notes.md <<'EOF'",
    'Never commit .env or .env.local to git.',
    'EOF',
  ].join('\n');
  assert(bash(cmd).blocked === false, 'prose inside a quoted heredoc should not block');
});

runCase('double-quoted heredoc delimiter is also inert', () => {
  const cmd = ['cat > f.txt <<"END"', 'value from .env.production', 'END'].join('\n');
  assert(bash(cmd).blocked === false, 'double-quoted heredoc should be treated as content');
});

runCase('tab-stripping heredoc with indented terminator is handled', () => {
  const cmd = ["\tcat > f.txt <<-'EOF'", '\tmentions .env.local here', '\tEOF'].join('\n');
  assert(bash(cmd).blocked === false, '<<- form should be recognized');
});

runCase('inline node -e env-object read is not a path', () => {
  assert(bash('node -e "console.log(process.env.NEXT_PUBLIC_URL)"').blocked === false, 'process.env read should not block');
});

runCase('import.meta.env and Deno.env reads are not paths', () => {
  assert(bash('grep -r "import.meta.env.VITE_URL" apps/web/').blocked === false, 'import.meta.env should not block');
  assert(bash('node -e "Deno.env.get(1)"').blocked === false, 'Deno.env should not block');
});

runCase('example/sample files stay exempt', () => {
  assert(bash('cat .env.example').blocked === false, '.env.example is a safe pattern');
});

// ───────────────────────────────────────────────────────────────────────────
// Must STILL block: real reads of sensitive files
// ───────────────────────────────────────────────────────────────────────────

runCase('plain read of a dotenv file still blocks', () => {
  assert(bash('cat .env').blocked === true, 'cat .env must block');
});

runCase('suffixed dotenv file still blocks', () => {
  assert(bash('cat apps/web/.env.production').blocked === true, 'suffixed dotenv must block');
});

runCase('bash variable assignment still blocks', () => {
  assert(bash('FILE=.env.local; cat $FILE').blocked === true, 'variable assignment must block');
});

runCase('command substitution still blocks', () => {
  assert(bash('echo $(cat .env)').blocked === true, 'command substitution must block');
});

runCase('UNQUOTED heredoc body still blocks (the shell expands it)', () => {
  const cmd = ['cat > out.txt <<EOF', '$(cat .env)', 'EOF'].join('\n');
  assert(bash(cmd).blocked === true, 'unquoted heredoc expands, so it must stay in scope');
});

runCase('unterminated quoted heredoc still blocks', () => {
  const cmd = ["cat > out.txt <<'EOF'", 'cat .env'].join('\n');
  assert(bash(cmd).blocked === true, 'no terminator means no strip, so it must stay in scope');
});

runCase('content outside the heredoc is still scanned', () => {
  const cmd = ["cat .env && cat > f <<'EOF'", 'harmless', 'EOF'].join('\n');
  assert(bash(cmd).blocked === true, 'a real read alongside a heredoc must still block');
});

runCase('private keys and credentials block on path-bearing tools', () => {
  assert(read('~/.ssh/id_rsa').blocked === true, 'id_rsa must block');
  assert(read('server.pem').blocked === true, '.pem must block');
  assert(read('credentials.json').blocked === true, 'credentials must block');
});

runCase('KNOWN GAP: bash scanning covers dotenv paths only', () => {
  // Pre-existing behaviour, unchanged by the write-content fix: extractPaths
  // only mines bash commands for dotenv-shaped strings, so non-dotenv secrets
  // named directly in a bash command are not caught. This test pins the gap so
  // a future widening is deliberate.
  assert(bash('cat ~/.ssh/id_rsa').blocked === false, 'documents current bash coverage');
  assert(bash('cat server.pem').blocked === false, 'documents current bash coverage');
});

runCase('non-Bash tools are unaffected', () => {
  assert(read('.env').blocked === true, 'Read of a dotenv file must still block');
});

runCase('APPROVED prefix still grants access', () => {
  const approved = read('APPROVED:.env');
  assert(approved.blocked === false && approved.approved === true, 'APPROVED: prefix must still work');
});

// ───────────────────────────────────────────────────────────────────────────
// stripWriteContent unit behaviour
// ───────────────────────────────────────────────────────────────────────────

runCase('stripWriteContent removes only quoted heredoc bodies', () => {
  const cmd = ["a <<'X'", 'secret body', 'X', 'b <<Y', 'kept body', 'Y'].join('\n');
  const out = stripWriteContent(cmd);
  assert(!out.includes('secret body'), 'quoted body should be elided');
  assert(out.includes('kept body'), 'unquoted body should survive');
});

runCase('stripWriteContent handles multiple quoted heredocs', () => {
  const cmd = ["a <<'X'", 'one', 'X', "b <<'Y'", 'two', 'Y'].join('\n');
  const out = stripWriteContent(cmd);
  assert(!out.includes('one') && !out.includes('two'), 'both bodies should be elided');
});

console.log(failures === 0 ? '\nall passed' : `\n${failures} FAILED`);
process.exit(failures === 0 ? 0 : 1);
