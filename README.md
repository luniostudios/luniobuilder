
# LUNIO No-Code Drag & Drop AI Website Builder

LUNIO Builder is a NO-CODE drag & drop AI website builder that allows you to generate and create stunning websites with ease. With its intuitive drag-and-drop interface, you can design and publish your website in minutes, without any coding knowledge. Also, you can generate with AI your first website and then edit in our intuitive editor.

## Demo

https://www.luniobuilder.com

## Screenshots

![App Screenshot](https://media.licdn.com/dms/image/v2/D4E22AQFbH8xbznDJAA/feedshare-image-high-res/B4EaCscynLIEAU-/0/1789599623973?e=1791417600&v=beta&t=ImtiyBoCytB7S77gGC4cDlWbAsHf4SyYOltvesttjSM)
![App Screenshot](https://i.ibb.co/Q3FpjQCP/luniobuil.png)
![App Screenshot](https://i.ibb.co/Xrt6T2nd/luniobuild.png)

## Environment Variables

To run this project, you will need to add the following environment variables to your .env file

`AUTH_SECRET`

`AUTH_GOOGLE_ID`

`AUTH_GOOGLE_SECRET`

`SUPABASE_URL`
 
 `SUPABASE_SERVICE_ROLE_KEY`

`LIVEBLOCKS_SECRET_KEY` (required for realtime editor collaboration)

`NEXT_PUBLIC_ROOT_DOMAIN` (optional, defaults to `luniobuilder.com`)

`AI_CREDENTIALS_ENCRYPTION_KEY` (recommended; a stable secret used to encrypt project AI provider keys)

### Account AI provider keys

Users can add Gemini, OpenAI, or Anthropic Claude API keys from any Project Settings page. Keys are account-wide, encrypted server-side, and never sent back to the browser in full. Set `AI_CREDENTIALS_ENCRYPTION_KEY` in every environment and keep it stable; changing it makes previously stored keys unreadable.

Apply `supabase/migrations/20260916000001_add_project_ai_credentials.sql` and then `supabase/migrations/20260916000002_move_ai_credentials_to_accounts.sql` before saving provider keys. The second migration copies existing project keys to their owners and removes the old project-scoped table.

### Realtime collaboration

Create a Liveblocks project and add its server secret as `LIVEBLOCKS_SECRET_KEY`.
Authorized project owners and admins opening the same `/editor?projectId=...` URL
share the builder document in realtime, including active collaborator presence.

Apply `supabase/migrations/20260911000000_add_project_collaboration.sql` to enable
project invitations and accepted collaborator access. Project owners can invite
registered users from the project menu; invitees accept or decline from their
dashboard, and accepted projects then appear in their project list.

### Multi-tenant publishing

Apply `supabase/migrations/20260825000000_add_site_slug.sql` to add the unique site subdomain column. Add a wildcard DNS record for `*.luniobuilder.com` pointing to the deployed application, and configure the same wildcard domain in the hosting provider. Users can then choose a subdomain in the editor's **Publish > Publish to LUNIO** menu; published sites are available at `https://projectname.luniobuilder.com`.


## Run Locally

Clone the project

```bash
  git clone https://github.com/MiguelDZ123/luniobuilder.git
```

Go to the project directory

```bash
  cd my-project
```

Install dependencies

```bash
  npm install
```

Start the server

```bash
  npm run dev
```


## Features

- Next-Auth
- NextJS/Tailwind


## Contributing

Contributions are always welcome!

See `contributing.md` for ways to get started.

Please adhere to this project's `code of conduct`.


## Support

For support, contact us via https://www.luniostudios.com/.


## Authors

- [@LUNIO Studios](https://github.com/luniostudios)


## License

[MIT](https://choosealicense.com/licenses/mit/)

