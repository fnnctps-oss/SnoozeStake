/**
 * Safely extract a route param as a string.
 * Express 5 types params as string | string[].
 */
export function paramStr(param: string | string[] | undefined): string {
  if (Array.isArray(param)) return param[0];
  return param || '';
}
