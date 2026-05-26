import { defineCloudflareConfig } from "@opennextjs/cloudflare/config";

// Minimal config: lets OpenNext convert the Next.js build output into a
// Cloudflare Workers entry-point at `.open-next/worker.js`. Wrangler picks
// that up via wrangler.toml.
export default defineCloudflareConfig({});
