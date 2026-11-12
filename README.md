## eduMFA Web

This is the source code of the [edumfa.io](https://edumfa.io) website. It is built with [Next.js](https://nextjs.org/),
a React framework and [HeroUI](https://heroui.com/).

## Push token tester

Open **Push token tester** in the home page footer. The tester uses a shared eduMFA instance. Each browser gets its own token list. Scan an enrollment QR code with eduMFA Authenticator, then send a challenge to see whether it was accepted, declined, or expired. Removing a token deletes it from the test instance.

GitHub Pages serves the UI. Run the tester service separately with Node.js 24 and `bun run push-tester`. For local development, set these variables in `.env.local`, start the tester service, and run `bun run dev` in a second terminal.

```dotenv
NEXT_PUBLIC_PUSH_TESTER_URL=http://127.0.0.1:8787
PUSH_TESTER_ORIGIN=http://localhost:3000
EDUMFA_TEST_URL=http://127.0.0.1:8080
EDUMFA_TEST_USERNAME=push-tester
EDUMFA_TEST_PASSWORD=replace-with-the-service-account-password
```

Open the local site using the exact origin configured in `PUSH_TESTER_ORIGIN`. For production, set it to the public website origin and set the GitHub Actions repository variable `NEXT_PUBLIC_PUSH_TESTER_URL` to the HTTPS URL of the tester service. Configure the eduMFA credentials only on the service host. The service defaults to `127.0.0.1:8787` for use behind an HTTPS reverse proxy. Set `PUSH_TESTER_HOST` and `PUSH_TESTER_PORT` if the host requires other values.

Use a dedicated eduMFA test instance with [eduPUSH enrollment policies and Firebase configured](https://edumfa.readthedocs.io/en/latest/tokens/tokentypes/edupush.html). Give the service account permission to authenticate through `/auth`, enroll, list and delete test tokens, trigger challenges, and read token challenges. Set `EDUMFA_TEST_REALM` if the service account is in a named realm. The phone connects to the registration URL in the QR code, so use an address it can reach.

Run one tester service process per dedicated eduMFA instance. Set `PUSH_TESTER_DB_PATH` to a SQLite file on a persistent, writable volume in production. The service inventories existing tester tokens at startup and retains their stored expiration across restarts. Existing tester tokens without a stored expiration receive the configured lifetime from the first inventory. The defaults are 100 outstanding tokens across all browsers and 24 hours per token. Set `PUSH_TESTER_MAX_TOKENS` and `PUSH_TESTER_TOKEN_TTL_HOURS` to adjust them. The service checks for expired tokens every minute and retries failed deletions. Expired tokens continue to occupy capacity until cleanup confirms they are gone.

The service limits each IP to 120 requests and 5 enrollment attempts per minute. It also limits total traffic, enrollments, and challenges across IPs. Behind a reverse proxy on the same host, set `PUSH_TESTER_TRUST_PROXY=1` and have the proxy **overwrite** `X-Real-IP` with the actual client IP. Keep the tester listener on loopback. Configure rate and connection limits at the public proxy as well, so excess traffic is dropped before it reaches the service. For example, with Nginx directly facing clients, put the two zone directives in the `http` block and the location in the tester’s HTTPS server block.

```nginx
limit_req_zone $binary_remote_addr zone=push_tester_requests:10m rate=2r/s;
limit_conn_zone $binary_remote_addr zone=push_tester_connections:10m;

location / {
    limit_req zone=push_tester_requests burst=20 nodelay;
    limit_req_status 429;
    limit_conn push_tester_connections 10;
    limit_conn_status 429;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_pass http://127.0.0.1:8787;
}
```

If another proxy sits in front of Nginx, configure Nginx to resolve client IPs from that trusted proxy before using IP limits. Clearing browser storage starts a new browser session. Its old tokens still expire on schedule.

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
