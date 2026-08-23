#!/usr/bin/env node
/**
 * Generates the PBKDF2 salt + hash pair that goes into src/environments/*.ts,
 * so the admin password itself is never compiled into the shipped bundle.
 *
 * Usage:
 *   node tools/generate-admin-hash.mjs                 # generate a strong random password
 *   node tools/generate-admin-hash.mjs "your password" # hash a password you chose
 */
import { pbkdf2Sync, randomBytes } from 'node:crypto';

const ITERATIONS = 310000;
const KEY_LENGTH = 32;
const DIGEST = 'sha256';

function generatePassword() {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789-_';
  const bytes = randomBytes(24);
  return Array.from(bytes, (b) => alphabet[b % alphabet.length]).join('');
}

const password = process.argv[2] ?? generatePassword();
if (password.length < 12) {
  console.error('Refusing to hash a password shorter than 12 characters.');
  process.exit(1);
}

const salt = randomBytes(16);
const hash = pbkdf2Sync(password, salt, ITERATIONS, KEY_LENGTH, DIGEST);

console.log(JSON.stringify({
  password,
  adminAuth: {
    salt: salt.toString('hex'),
    hash: hash.toString('hex'),
    iterations: ITERATIONS,
  },
}, null, 2));
