## eduMFA Web

This is the source code of the [edumfa.io](https://edumfa.io) website. It is built with [Next.js](https://nextjs.org/),
a React framework and [NextUI](https://nextui.org/).

## Add your Organization

We like to feature organizations that implemented eduMFA. If you like to add your organization, please [create an issue](https://github.com/eduMFA/Web/issues/new?labels=organization&title=%5BOrg%5D+&template=manage_organization.yml).
### Organization Documentation

`?` - Optional field

| Field              | Type     | Description                                                                                  |
|--------------------|----------|----------------------------------------------------------------------------------------------|
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
  "tokenTypes": [
    "IndexedSecret",
    "TOTP",
    "WebAuthn"
  ]
}
```