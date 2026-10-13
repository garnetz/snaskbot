# SNASKBOT on Vercel

This folder is a complete Vercel project. The pages in `public/` are static, and `api/chat.js` is the serverless function that holds the API key and calls Claude.

## Deploy

1. Get a Claude API key at https://platform.claude.com (Settings > API keys), add some credit under Billing, and set a monthly spend limit.
2. This repo is ready to import as is.
3. In Vercel, click **Add New > Project**, import the repo and keep the default settings ("Other" framework, no build command).
4. Under **Environment Variables**, add `ANTHROPIC_API_KEY` with your key. Optional: `SNASK_MODEL=claude-haiku-5-5` for a much cheaper bot. Leave `BRIEF_WEBHOOK_URL` unset for now (see below).
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
- The bot's voice and facts live in `persona.md`, the card and image rules in `rich-rules.md`, the mode buttons in `modes.json`, and the 102 cases and fallback shop in `catalog.json`. `api/_generated.js` and `public/chat.html` are generated from them, so ask Claude in the project to rebuild after editing any of them.
- Answers stream in word by word from `api/chat.js`. Visitors can attach a logo or screenshot (shrunk to 1024px in the browser) to get it roasted, and any answer can be saved as a pink poster image.
- The shop is live: `api/catalog.js` reads products and prices from snask.com's public WooCommerce Store API and new cases from the Our Work page, caches them for six hours, and falls back to `catalog.json` if snask.com doesn't answer.

## Calling the Recruitment Officer

The phone icon (marked β) in the input field opens a voice call with a parody of the joke on SNASK's contact page. It uses the browser's own speech recognition and voices, so it's free but sounds different on every device. Where the browser can't listen (Firefox, or a blocked mic) the visitor types and he answers out loud. The character never claims to be the real George Michael and doesn't imitate his voice. Its instructions are the hidden `officer` entry in `modes.json`.

## Seeing what visitors ask (off by default)

Set `SNASK_LOG_QUESTIONS=1` in Vercel and every question shows up in the project's **Logs** tab as a line like `{"event":"question","mode":"classic","turn":1,"q":"Is beige a crime?"}`. It logs only the question text, the mode and the turn number, never IP addresses. Vercel keeps logs for a short time, so copy out anything you want to keep. If this runs on snask.com, mention it in their privacy policy.

## The brief form (delivery is OFF)

When someone has a real project, the bot can show a "Got a real project?" form. Right now `api/brief.js` validates it but sends it nowhere, and the visitor is asked to copy it and email help@snask.com instead.

Only turn delivery on once SNASK has said yes. Then set `BRIEF_WEBHOOK_URL` in Vercel to a webhook that SNASK controls (a Slack incoming webhook, Zapier, Make, and so on). The function POSTs `{text, name, email, company, budget, project}` to it. The form has a hidden honeypot field and a limit of 5 briefs per visitor per 10 minutes.
