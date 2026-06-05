import { Client } from "@atproto/lex";
import type { DatetimeString } from "@atproto/syntax";
import { PasswordSession } from "@atproto/lex-password-session";
import { RichText, AtpAgent } from "@atproto/api";
import * as app from "./lexicons/app.js";
import * as xyz from "./lexicons/xyz.js";

const args = process.argv.slice(2);
const username = args[0] ?? "your-handle.bsky.social";
const password = args[1] ?? "your-app-password";
const command = args[2] ?? "statusphere";
const contents = args[3] ?? "🍕";

async function main() {
  const result = await PasswordSession.login({
    service: "https://bsky.social", // or your PDS host
    identifier: username,
    password: password,
  });

  const client = new Client(result);
  const createdAt = new Date().toISOString() as DatetimeString;

  // Instantiating an agent for rich text support
  const myFetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    console.log("requesting", input);
    const response = await globalThis.fetch(input, init);
    console.log("got response", response);
    return response;
  };

  const agent = new AtpAgent({
    service: "https://bsky.social",
    fetch: myFetch,
  });

  const rt = new RichText({
    text: contents,
  });

  await rt.detectFacets(agent);

  if (command === "bsky") {
    const posts = await client.create(app.bsky.feed.post, {
      text: rt.text,
      facets: rt.facets,
      createdAt: createdAt,
    });
    console.log(posts);
  } else {
    // NOTE: this does not work, stratusphere does not support facets
    const profile = await client.create(xyz.statusphere.status, {
      text: rt.text,
      facets: rt.facets,
      createdAt,
    });
    console.log(profile);
  }
}

main();
