
# LUNIO No-Code Drag & Drop Website Builder

LUNIO Builder is a NO-CODE drag & drop website builder that allows you to create stunning websites with ease. With its intuitive drag-and-drop interface, you can design and publish your website in minutes, without any coding knowledge.

## Demo

https://www.luniobuilder.com

## Screenshots

![App Screenshot](https://i.ibb.co/MxncYCXh/luniobui.png)
![App Screenshot](https://i.ibb.co/Q3FpjQCP/luniobuil.png)
![App Screenshot](https://i.ibb.co/Xrt6T2nd/luniobuild.png)

## Environment Variables

To run this project, you will need to add the following environment variables to your .env file

`AUTH_SECRET`

`AUTH_GOOGLE_ID`

`AUTH_GOOGLE_SECRET`

`SUPABASE_URL`
 
 `SUPABASE_SERVICE_ROLE_KEY`

`NEXT_PUBLIC_ROOT_DOMAIN` (optional, defaults to `luniobuilder.com`)

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

