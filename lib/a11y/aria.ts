/**
 * Generate aria-label for a stock node
 */
export function stockAriaLabel(title: string, value: string): string {
  return `Stock: ${title}, value ${value}`;
}

/**
 * Generate aria-label for a flow edge
 */
export function flowAriaLabel(fromTitle: string, toTitle: string): string {
  return `Flow from ${fromTitle} to ${toTitle}`;
}

/**
 * Generate aria-label for a valve
 */
export function valveAriaLabel(fromTitle: string, toTitle: string): string {
  return `Adjust flow from ${fromTitle} to ${toTitle}`;
}

/**
 * Generate aria-label for an objective chip
 */
export function objectiveAriaLabel(title: string): string {
  return `Objective: ${title}`;
}

