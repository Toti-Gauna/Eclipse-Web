/**
 * Small, pure helpers around the WhatsApp message built by lib/plan-message.ts.
 */

/** Inserts a line right after the greeting (the first line). An empty line leaves the message as is. */
export function withGoals(message: string, line: string): string {
  if (!line) return message;
  const [first, ...rest] = message.split('\n');
  return [first, line, ...rest].join('\n');
}
