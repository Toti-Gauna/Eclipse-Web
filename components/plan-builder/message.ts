/**
 * Small, pure helpers around the WhatsApp message built by lib/plan-message.ts.
 */

/** Inserts a line right after the greeting (the first line). An empty line leaves the message as is. */
export function withGoals(message: string, line: string): string {
  if (!line) return message;
  const [first, ...rest] = message.split('\n');
  return [first, line, ...rest].join('\n');
}

/**
 * Adds the package's bonus ("• Incluido sin cargo: Landing premium…") right after the last
 * priced line ("• …"), so it reads as part of what was asked for, without a price.
 * An empty line leaves the message as is.
 */
export function withBonus(message: string, line: string): string {
  if (!line) return message;
  const lines = message.split('\n');
  let last = -1;
  lines.forEach((text, i) => {
    if (text.startsWith('• ')) last = i;
  });
  lines.splice(last === -1 ? 1 : last + 1, 0, `• ${line}`);
  return lines.join('\n');
}
