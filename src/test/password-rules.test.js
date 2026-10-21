import { describe, it, expect } from 'vitest';
import { PASSWORD_RULE, friendlyPasswordError } from '../utils/password';

describe('PASSWORD_RULE (mirrors backend policy)', () => {
  it('accepts compliant passwords', () => {
    expect(PASSWORD_RULE.test('Secret1!')).toBe(true);
    expect(PASSWORD_RULE.test('Abcd1234#')).toBe(true);
  });

  it('rejects weak passwords', () => {
    expect(PASSWORD_RULE.test('secret1')).toBe(false); // no uppercase or symbol
    expect(PASSWORD_RULE.test('Short1!')).toBe(false); // fewer than 8 characters
    expect(PASSWORD_RULE.test('nouppercase1!')).toBe(false);
    expect(PASSWORD_RULE.test('NOLOWERCASE1!')).toBe(false);
    expect(PASSWORD_RULE.test('NoNumber!')).toBe(false);
    expect(PASSWORD_RULE.test('NoSymbol12')).toBe(false);
  });
});

describe('friendlyPasswordError', () => {
  it('replaces raw pattern-mismatch errors with the friendly hint', () => {
    const raw = 'validation error password: fails to match the required pattern: /^.+$/';
    expect(friendlyPasswordError(raw, ['Secret1!'])).not.toContain('pattern');
    expect(friendlyPasswordError(raw, ['Secret1!'])).toMatch(/uppercase/);
  });

  it('never renders a submitted secret value', () => {
    const raw = 'Password "Secret1!" is not allowed here, Secret1! rejected';
    const safe = friendlyPasswordError(raw, ['Secret1!']);
    expect(safe).not.toContain('Secret1!');
  });
});
