const EMAIL_PATTERN = /^\S+@\S+\.\S+$/;
const PASSWORD_PATTERN = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/;

export const isValidEmail = (email: string): boolean =>
  email.length <= 254 && EMAIL_PATTERN.test(email);

export const getPasswordError = (password: string): string | null => {
  const bytes = new TextEncoder().encode(password).length;

  if (bytes < 8 || bytes > 72) {
    return "Use between 8 and 72 bytes.";
  }

  if (!PASSWORD_PATTERN.test(password)) {
    return "Include uppercase, lowercase, and numeric characters.";
  }

  return null;
};
