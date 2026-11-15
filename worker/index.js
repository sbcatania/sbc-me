// sbc.me on Cloudflare Workers. Everything is a static file in ./out, except the
// diagram editor: diagrams live only in each visitor's browser, so the build makes
// one placeholder page (/systems/d/_) and this Worker serves it for every id.
// Both the page (/systems/d/<id>) and its client-navigation payload
// (/systems/d/<id>.txt) map to the placeholder; the page reads the id from the URL.
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const m = url.pathname.match(/^\/systems\/d\/[^/]+?(\.txt)?$/);
    if (m) {
      url.pathname = `/systems/d/_${m[1] ?? ""}`;
      return env.ASSETS.fetch(new Request(url, request));
    }
    return env.ASSETS.fetch(request);
  },
};
