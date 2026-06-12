// Secret detection patterns for git-flow-guard.
// Each pattern has a name and a regex. scanText() returns matches with
// placeholder filtering so env-var references and docs examples pass.

export const SECRET_PATTERNS = [
  { name: 'AWS access key', re: /\bAKIA[0-9A-Z]{16}\b/g },
  { name: 'AWS secret key assignment', re: /aws[_-]?secret[_-]?access[_-]?key\s*[:=]\s*['"]?[A-Za-z0-9/+=]{40}['"]?/gi },
  { name: 'GitHub token', re: /\b(?:ghp|gho|ghu|ghs|ghr)_[A-Za-z0-9]{36,}\b/g },
  { name: 'GitHub fine-grained PAT', re: /\bgithub_pat_[A-Za-z0-9_]{22,}\b/g },
  { name: 'Anthropic API key', re: /\bsk-ant-[A-Za-z0-9-_]{20,}\b/g },
  { name: 'OpenAI API key', re: /\bsk-(?:proj-)?[A-Za-z0-9-_]{20,}\b/g },
  { name: 'Stripe live key', re: /\b[sr]k_live_[A-Za-z0-9]{20,}\b/g },
  { name: 'Slack token', re: /\bxox[baprs]-[A-Za-z0-9-]{10,}\b/g },
  { name: 'Google API key', re: /\bAIza[0-9A-Za-z\-_]{35}\b/g },
  { name: 'Twilio API key', re: /\bSK[0-9a-fA-F]{32}\b/g },
  { name: 'SendGrid API key', re: /\bSG\.[A-Za-z0-9_-]{22}\.[A-Za-z0-9_-]{43}\b/g },
  { name: 'npm token', re: /\bnpm_[A-Za-z0-9]{36}\b/g },
  { name: 'Supabase service role key (JWT)', re: /\beyJ[A-Za-z0-9_-]{20,}\.eyJ[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}\b/g },
  { name: 'Private key block', re: /-----BEGIN (?:RSA |EC |DSA |OPENSSH |PGP )?PRIVATE KEY(?: BLOCK)?-----/g },
  { name: 'Fly.io token', re: /\bFlyV1 fm2_[A-Za-z0-9+/=]{20,}/g },
  { name: 'Generic credential assignment', re: /\b(?:password|passwd|secret|api[_-]?key|auth[_-]?token|access[_-]?token)\s*[:=]\s*['"][^'"\s]{12,}['"]/gi },
  { name: 'Connection string with password', re: /\b(?:postgres(?:ql)?|mysql|mongodb(?:\+srv)?|redis|amqp):\/\/[^\s:'"]+:[^\s@'"]{8,}@/gi },
  { name: 'Bearer token header', re: /\bAuthorization['"]?\s*[:=]\s*['"]?Bearer\s+[A-Za-z0-9._\-]{20,}/gi },
];

const PLACEHOLDER_RE = new RegExp(
  [
    'x{3,}', '\\*{3,}', '\\.{3,}', '<[^>]*>', '\\$\\{[^}]*\\}', '\\$[A-Z_]+\\b',
    'process\\.env', 'os\\.environ', 'getenv', 'env\\(', 'import\\.meta\\.env',
    'your[-_ ]?(?:api[-_ ]?)?key', 'example', 'placeholder', 'changeme', 'change[-_ ]me',
    'dummy', 'sample', 'redacted', 'fake', 'test[-_ ]?key', 'insert[-_ ]', 'todo',
    '1234567890', 'abcdef',
  ].join('|'),
  'i'
);

// Files where secret-looking strings are expected/allowed.
export const EXEMPT_FILE_RE = /(?:^|[\\/])(?:\.env\.example|\.env\.sample|\.env\.template|secret-patterns\.[cm]?js|.*\.(?:test|spec)\.[cm]?[jt]sx?)$/i;

// Files that must never be staged.
export const FORBIDDEN_FILE_RE = /(?:^|[\\/])(?:\.env(?:\.local|\.production|\.development)?|id_rsa[^\\/]*|id_ed25519[^\\/]*|[^\\/]*\.pem|[^\\/]*\.p12|[^\\/]*\.pfx|credentials\.json|service[-_]account[^\\/]*\.json)$/i;

function shannonEntropy(s) {
  const freq = {};
  for (const ch of s) freq[ch] = (freq[ch] ?? 0) + 1;
  return Object.values(freq).reduce((h, n) => {
    const p = n / s.length;
    return h - p * Math.log2(p);
  }, 0);
}

export function isPlaceholder(match) {
  if (PLACEHOLDER_RE.test(match)) return true;
  // Low-entropy "secrets" (aaaa..., 1111...) are placeholders.
  const value = match.match(/['"]([^'"]+)['"]\s*$/)?.[1] ?? match;
  return value.length >= 12 && shannonEntropy(value) < 2.5;
}

/**
 * Scan text for secrets. Returns [{ name, match }] (placeholders filtered out).
 */
export function scanText(text) {
  if (!text) return [];
  const findings = [];
  for (const { name, re } of SECRET_PATTERNS) {
    re.lastIndex = 0;
    for (const m of text.matchAll(re)) {
      if (!isPlaceholder(m[0])) {
        findings.push({ name, match: m[0].slice(0, 60) });
      }
    }
  }
  return findings;
}
