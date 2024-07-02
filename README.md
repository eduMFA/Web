## eduMFA Web

This is the source code of the [edumfa.io](https://edumfa.io) website. It is built with [Next.js](https://nextjs.org/),
a React framework and [NextUI](https://nextui.org/).

## Add your Organization

We like to feature organizations that implemented eduMFA. If you like to add your organization, please create a pull
request. Follow these steps:
1. Take your organization logo, name it appropriately for your organization and place it in the `public/organizations` folder.
2. Add an Entry to the json file `public/users.json`. The entry should look like this:
```json
{
  "name": "Your Organization Name",
  "logo": "organizations/your-organization-logo-name.png",
  "url": "https://your-organization-url.com",
  "userCount": 1000,
  "phase": "Evaluation/Testing/Production",
  "tokenTypes": ["IndexedSecret", "TOTP", ...]
}
```
- `name` is your official organization name.
- `logo` is the path to your logo you placed in the `public/organizations` folder.
- `url` is the URL to your organization.
- `userCount` is the approximate number of users using eduMFA. It's optional.
- `phase` is the phase of your organization implementing eduMFA. Applicable values are `Evaluation`, `Testing`, `Production`. It's optional.
- `tokenTypes` is an array of token types your organization uses. Please refer to the `OrganizationTokenType` enum in `types/organizationTypes.ts` for possible values. It's optional.
