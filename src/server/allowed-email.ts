// La app tiene un solo usuario: solo entra el email de ALLOWED_EMAIL.
export function isAllowedEmail(email: string | null | undefined, allowed: string): boolean {
  if (!email) return false;
  return normalize(email) === normalize(allowed);
}

function normalize(email: string): string {
  return email.trim().toLowerCase();
}
