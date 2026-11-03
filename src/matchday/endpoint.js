// matchday-rsvp: the ONE endpoint rule, shared by submit.js (runtime) and vite.config.js (build). Pure and import-free so node can load it without config.js, import.meta.env or the DOM.
// Why an endpoint is refused (a sentence ending "nothing was sent."), or null when it is fine. dev is passed in.
export function endpointProblem(url, dev) {
  try {
    const u = new URL(url);
    if (u.username || u.password) return 'RSVP_ENDPOINT must not contain credentials (user:password@); nothing was sent.';
    if (u.search || u.hash) return 'RSVP_ENDPOINT must not contain a query string or fragment; nothing was sent.';   // a token in the URL would be public and logged
    // Letters, digits, dots, hyphens, or a bracketed IPv6 literal. URL accepts `x.test;script-src` and `*.x.test`, and u.origin would then inject a CSP directive or a wildcard into connect-src.
    if (!/^([a-z0-9.-]+|\[[0-9a-f:]+\])$/i.test(u.hostname)) return 'RSVP_ENDPOINT host may only contain letters, digits, dots and hyphens (or an IPv6 literal); nothing was sent.';
    return u.protocol === 'https:' || (dev && u.protocol === 'http:' && u.hostname === 'localhost') ? null : 'RSVP_ENDPOINT must be https:// (or http://localhost in dev); nothing was sent.';
  } catch { return 'RSVP_ENDPOINT is not a valid URL; nothing was sent.'; }
}
