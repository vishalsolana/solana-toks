import { Rettiwt } from "rettiwt-api";

let client: Rettiwt | null = null;

/**
 * Lazily creates a singleton Rettiwt client authenticated with RETTIWT_API_KEY.
 * The key is a serialized X/Twitter session cookie — see rettiwt-api docs for
 * `rettiwt auth login` to generate one for a dedicated scraping account.
 */
export function getRettiwtClient(): Rettiwt {
  const apiKey = process.env.RETTIWT_API_KEY;
  if (!apiKey) {
    throw new Error(
      "RETTIWT_API_KEY is not set. Generate one with `npx rettiwt-api auth login -e <email> -u <username> -p <password>` and add it to .env.local."
    );
  }

  if (!client || client.apiKey !== apiKey) {
    client = new Rettiwt({ apiKey });
  }

  return client;
}

export function isRettiwtConfigured(): boolean {
  return Boolean(process.env.RETTIWT_API_KEY);
}
