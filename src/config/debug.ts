export const DEBUG_PARAM = 'debug';

export function isDebugMode(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }
  return new URLSearchParams(window.location.search).get(DEBUG_PARAM) === '1';
}
