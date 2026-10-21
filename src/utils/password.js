// Shared password rules that mirror the backend policy.
// Backend: /^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[#?!@$%^&*-]).{8,}$/
export const PASSWORD_RULE = /^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[#?!@$%^&*-]).{8,}$/;

export const PASSWORD_RULE_HINT =
  'At least 8 characters with an uppercase letter, a lowercase letter, a number, and a symbol (#?!@$%^&*-).';

export const PASSWORD_RULE_ERROR = `Password must be: ${PASSWORD_RULE_HINT}`;

/**
 * Removes sensitive values (e.g. submitted passwords) from a backend error
 * message before it is shown to the user, and converts raw pattern-mismatch
 * errors into the friendly rule hint.
 */
export function friendlyPasswordError(message, secrets = []) {
  if (!message) {
    return message;
  }
  if (/fails to match the required pattern/i.test(message)) {
    return PASSWORD_RULE_ERROR;
  }
  let safe = message;
  for (const secret of secrets) {
    if (typeof secret === 'string' && secret.length > 0) {
      safe = safe.split(secret).join('[hidden]');
    }
  }
  return safe;
}
