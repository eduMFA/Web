## eduMFA Web

This is the source code of the [edumfa.io](https://edumfa.io) website. It is built with [Next.js](https://nextjs.org/),
a React framework and [NextUI](https://nextui.org/).

## Add your Organization

We like to feature organizations that implemented eduMFA. If you like to add your organization, please create a pull
request. Follow these steps:
1. Take your organization logo, name it appropriately for your organization and place it in the `public/organizations` folder.
2. Add an Entry to the json file `public/users.json`, as shown in the Documentation below.
3. Submit a pull request.

### Documentation
`?` - Optional field

| Field       | Type     | Description                                                       |
|-------------|----------|-------------------------------------------------------------------|
| name        | string   | The name of the organization.                                     |
| logoSrc     | string   | The Path to the organization logo, starting with `organizations/` |
| url         | string   | The URL to the organization.                                      |
| userCount?  | number   | The approximate number of users using eduMFA, if available.       |
| phase?      | string   | The phase of the organization implementing eduMFA.                |
| tokenTypes? | string[] | An array of token types the organization uses.                    |

**Example:**
```json
{
  "name": "Example Org",
  "logoSrc": "organizations/example_org.png",
  "url": "https://example.org",
  "userCount": 1000,
  "phase": "Testing",
  "tokenTypes": ["IndexedSecret", "TOTP", "WebAuthn"]
}
```