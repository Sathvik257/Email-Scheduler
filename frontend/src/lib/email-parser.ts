const EMAIL_PATTERN = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi;

export function extractEmails(text: string): string[] {
  const matches = text.match(EMAIL_PATTERN) ?? [];
  return Array.from(new Set(matches.map((email) => email.toLowerCase())));
}
