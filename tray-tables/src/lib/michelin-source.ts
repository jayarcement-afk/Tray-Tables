/** Host used in Michelin Guide listing URLs. */
export const MICHELIN_GUIDE_HOST = "guide.michelin.com";

export function linkIsMichelinGuide(url: string | null | undefined): boolean {
  if (!url) return false;
  return url.toLowerCase().includes(MICHELIN_GUIDE_HOST);
}
