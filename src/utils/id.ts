/** Genera un identificador único legible basado en timestamp + aleatorio. */
export function createId(): string {
  const time = Date.now().toString(36);
  const rand = Math.random().toString(36).slice(2, 8);
  return `${time}-${rand}`;
}