# Ça va ? Moi ça vax.

A simple bot answering "ça vax" to users who tweet "ça va" (or similar). [see here why](https://www.lalettre.pro/Une-tournee-du-Vaxibus-Ca-va-Ca-vax--avec-Skyrock_a26935.html).

## Getting started

- Copy `.env.dist` to `.env` and complete `.env` file with your credentials.
- Copy `assets/settings.dist.json` to `assets/settings.json`
- Install packages
- Compile TypeScript
- Start `node dist/index.js`

## Misc

### Obtain access token for an account

Set `START_MODE` to `login` instead of `bot` in `.env` to start an interactive login process with PIN code.

### Settings

In `settings.json`, you can set `usernamesWhitelist` to a `string` array containing **lowercases usernames**, filtering the usernames which the bot is allowed to reply to.
