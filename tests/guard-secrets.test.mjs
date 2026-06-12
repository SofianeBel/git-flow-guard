import test from 'node:test';
import assert from 'node:assert/strict';
import { scanText, isPlaceholder } from '../scripts/lib/secret-patterns.mjs';
import { checkWrite } from '../scripts/guard-secrets.mjs';

test('detects real-looking secrets', () => {
  assert.ok(scanText('const key = "AKIAIOSFODNN7EXAMPL3"').length > 0, 'AWS key');
  assert.ok(scanText('token: ghp_J8kQm3xR7vN2pL5wT9yB4cD6fG1hZ0aXeWqS').length > 0, 'GitHub token');
  assert.ok(scanText('ANTHROPIC_KEY="sk-ant-api03-Qx7Rt2Lm9Zk3Vb8Ny4Pw"').length > 0, 'Anthropic key');
  assert.ok(scanText('-----BEGIN RSA PRIVATE KEY-----').length > 0, 'private key');
  assert.ok(scanText('mongodb://admin:Sup3rS3cretPw@db.host.com/x').length > 0, 'conn string');
});

test('ignores placeholders and env references', () => {
  assert.equal(scanText('apiKey: process.env.API_KEY').length, 0);
  assert.equal(scanText('password = "your-key-here-please"').length, 0);
  assert.equal(scanText('token: "${GITHUB_TOKEN}"').length, 0);
  assert.equal(scanText('secret: "xxxxxxxxxxxxxxxx"').length, 0);
  assert.equal(scanText('const k = "example-placeholder-key"').length, 0);
});

test('low entropy strings are placeholders', () => {
  assert.ok(isPlaceholder('password = "aaaaaaaaaaaaaaaa"'));
});

test('checkWrite exempts .env.example and test files', () => {
  const leak = 'API_KEY="sk-ant-api03-Qx7Rt2Lm9Zk3Vb8Ny4Pw"';
  assert.equal(checkWrite('.env.example', leak), null);
  assert.equal(checkWrite('src/auth.test.ts', leak), null);
  assert.ok(checkWrite('src/auth.ts', leak));
});
