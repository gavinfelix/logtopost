# GitToPost.ai

Turn commits, bug fixes, and build logs into publish-ready posts for X and LinkedIn.

You can paste a development log directly or import one from a public GitHub commit URL.

## Getting started

```bash
npm install
cp .env.example .env.local
```

Add your Vercel AI Gateway key to `.env.local`, then run:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The model defaults to `openai/gpt-5-mini` through Vercel AI Gateway and can be changed server-side with `AI_GATEWAY_MODEL`.

Public commit imports work without GitHub authentication. Set the optional server-side `GITHUB_TOKEN` when you need higher GitHub API request limits.

Vercel deployments can authenticate to AI Gateway with OIDC, so a separate provider API key is not required in production.
