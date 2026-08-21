# Fyreakenspace GitHub Pages Chat — setup

This version is designed for GitHub Pages. GitHub Pages serves the HTML/CSS/JS, while Supabase supplies authentication, the database and realtime updates.

## 1. Create a Supabase project

Create a project at https://supabase.com/

You do not need Node.js or npm.

## 2. Create the database

In Supabase, open **SQL Editor**, create a new query, paste the entire contents of `setup.sql`, and run it.

## 3. Configure username/password authentication

This version intentionally uses usernames rather than asking users for an email address.

The JavaScript converts a username into an internal email-shaped identifier such as:

`timmy@chat.local`

In Supabase Authentication settings, turn **off email confirmation** for this project. Otherwise users would be asked to confirm an address they do not actually own.

Do not expose any service-role/secret key in your website. Only use the browser-safe publishable key.

## 4. Create fyreakenspace

Open your website after the SQL has been run.

Click **Create an account** and create:

Username:
`fyreakenspace`

Password:
`universe2Q!@@`

Then open Supabase → SQL Editor and run:

`update public.profiles set is_admin = true where username = 'fyreakenspace';`

That gives the account the admin controls.

## 5. Put your Supabase details into app.js

Open `app.js` and find:

`const SUPABASE_URL = "PASTE_YOUR_SUPABASE_PROJECT_URL_HERE";`
`const SUPABASE_PUBLISHABLE_KEY = "PASTE_YOUR_SUPABASE_PUBLISHABLE_KEY_HERE";`

Replace those placeholders with your project's URL and publishable key.

The publishable key is intended for browser applications. Never put a Supabase service-role/secret key in `app.js`.

## 6. Upload to GitHub

Put these files in the repository that GitHub Pages publishes:

- index.html
- style.css
- app.js
- setup.sql
- README-SETUP.md

You can upload them directly through GitHub's website; no software needs to be installed on your computer.

Then go to your repository:

Settings → Pages

Choose your publishing branch and `/ (root)` if the files are in the root.

GitHub Pages will publish the site.

## 7. Test

Open the site in two browser windows.

Create/log into two different accounts and send messages. Messages should appear in both windows.

Log in as `fyreakenspace` and select:

- green = `fyreakenspace online`
- red = `fyreakenspace offline`

Everyone should see that status change immediately.

## Security

- Supabase Auth handles passwords.
- The site never reads or stores users' plaintext passwords.
- Row Level Security protects database operations.
- Do not put a Supabase service-role/secret key in the public website.
- GitHub Pages is public web hosting, so never put private database credentials or passwords in the repository.

## Note about the requested admin password

The requested password is used to create the fyreakenspace account, but it is not written into the website source code. Supabase handles the password securely.

If this site is going to be publicly accessible, consider changing the admin password after initial setup.