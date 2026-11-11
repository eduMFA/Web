## eduMFA Web

This is the source code of the [edumfa.io](https://edumfa.io) website. It is built with [Next.js](https://nextjs.org/),
a React framework and [HeroUI](https://heroui.com/).

## Manage your Organization Listing

Use the GitHub issue forms to [add](https://github.com/eduMFA/Web/issues/new?template=add_organization.yml), [update](https://github.com/eduMFA/Web/issues/new?template=update_organization.yml), or [remove](https://github.com/eduMFA/Web/issues/new?template=remove_organization.yml) your organization listing. Changes are published after a maintainer merges the generated pull request.

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
