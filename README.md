## eduMFA Web

This is the source code of the [edumfa.io](https://edumfa.io) website. It is built with [Next.js](https://nextjs.org/),
a React framework and [HeroUI](https://heroui.com/).

## Development

Install dependencies with `bun install --frozen-lockfile`, then run `bun run dev`.
Run `bun run lint`, `bun run format:check`, and `bun run typecheck` to check changes.

## Server deployment

Use Node.js 24 and Bun to install dependencies and prepare the application:

```sh
bun install --frozen-lockfile
bun run build
bun run start --hostname 127.0.0.1 --port 3000
```

Run the start command under a process manager and put an HTTPS reverse proxy in front of
`127.0.0.1:3000`. Deploy the application with `.next`, `public`, `node_modules`,
`package.json`, and `next.config.mjs`; keep `.next` writable for the image cache.
See the [Next.js self-hosting guide](https://nextjs.org/docs/app/guides/self-hosting).

The site uses the Next.js server, including image optimization and server redirects.
GitHub Actions checks and builds the application; deployment is managed on the server.
When switching hosting, disable GitHub Pages in the repository settings and point the
website's DNS at the new server.

English and German share the same URLs. The server selects the language from the
request's `Accept-Language` header, falling back to English, and sets the HTML language
accordingly. Forward this header through the reverse proxy and respect Next.js's
cache-control headers so language-specific responses are not cached across visitors.
The former `/en` and `/de` URLs permanently redirect to `/`.

## Manage your Organization Listing

Use the GitHub issue forms to [add](https://github.com/eduMFA/Web/issues/new?template=add_organization.yml), [update](https://github.com/eduMFA/Web/issues/new?template=update_organization.yml), or [remove](https://github.com/eduMFA/Web/issues/new?template=remove_organization.yml) your organization listing. Changes are published after a maintainer merges the generated pull request.

### Organization Documentation

`?` - Optional field

| Field              | Type     | Description                                                                                  |
| ------------------ | -------- | -------------------------------------------------------------------------------------------- |
| name               | string   | The name of the organization.                                                                |
| logoSrc            | string   | The Path to the organization logo, starting with `organizations/`                            |
| url                | string   | The URL to the organization.                                                                 |
| phase              | string   | The phase of the organization implementing eduMFA.                                           |
| userCount?         | number   | The approximate number of users in your organization.                                        |
| enrolledUserCount? | number   | The approximate number of enrolled users to eduMFA. Leave blank if when in evaluation phase. |
| tokenTypes?        | string[] | An array of token types the organization uses.                                               |

**Example:**

```json
{
  "name": "Example Org",
  "logoSrc": "organizations/example_org.png",
  "url": "https://example.org",
  "userCount": 1000,
  "enrolledUserCount": 20000,
  "phase": "Testing",
  "tokenTypes": ["IndexedSecret", "TOTP", "WebAuthn"]
}
```
