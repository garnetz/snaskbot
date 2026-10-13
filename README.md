# SNASKBOT on Vercel

This folder is a complete Vercel project. The pages in `public/` are static, and `api/chat.js` is the serverless function that holds the API key and calls Claude.

## Deploy

1. Get a Claude API key at https://platform.claude.com (Settings > API keys), add some credit under Billing, and set a monthly spend limit.
2. This repo is ready to import as is.
3. In Vercel, click **Add New > Project**, import the repo and keep the default settings ("Other" framework, no build command).
4. Under **Environment Variables**, add `ANTHROPIC_API_KEY` with your key. Optional: `SNASK_MODEL=claude-haiku-5-5` for a much cheaper bot.
5. Click **Deploy**. You get a link like `snaskbot.vercel.app`.

If you prefer the CLI, run `npm i -g vercel`, then `vercel` in this folder, `vercel env add ANTHROPIC_API_KEY`, and `vercel --prod`.

## What to share

- `https://snaskbot.vercel.app/` is a fake snask.com page with the pink bubble. Send this to your friends.
- `https://snaskbot.vercel.app/chat` is the chat on its own, full screen.
- For the real site, they add this line before `</body>`:
  `<script src="https://snaskbot.vercel.app/widget.js" defer></script>`

## Notes

- Only snask.com, its subdomains and the Vercel site itself can show the chat. To allow other sites, edit the `frame-ancestors` line in `vercel.json`.
- The 30-messages-per-10-minutes visitor limit is best effort, because Vercel can run several copies of the function. For real protection, add a rate-limit rule under the project's **Firewall** tab and keep the spend limit in the Claude Console.
- The bot's voice and facts live in `persona.md`, and the project and shop cards it can show live in `catalog.json`. `api/_persona.js` and `public/chat.html` are generated from them, so ask Claude in the project to rebuild after editing either file.
