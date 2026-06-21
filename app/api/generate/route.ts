import { streamText } from 'ai';

export const maxDuration = 30;

type Platform = 'x' | 'linkedin';

const platformInstructions: Record<Platform, string> = {
  x: `Write one X post of at most 280 characters.
- Open with the most interesting outcome, insight, or tension.
- Keep it concise and natural; use short paragraphs when useful.
- Use at most one relevant hashtag, and only if it adds discovery value.`,
  linkedin: `Write one LinkedIn post between 500 and 1,200 characters.
- Start with a strong, specific hook.
- Use short paragraphs and a clear progression: context, work, outcome or lesson.
- End with a thoughtful observation; do not force an engagement question.
- Use at most three relevant hashtags.`,
};

function isPlatform(value: unknown): value is Platform {
  return value === 'x' || value === 'linkedin';
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  const { log, platform } = body as { log?: unknown; platform?: unknown };
  if (typeof log !== 'string' || !log.trim()) {
    return Response.json({ error: 'A development log is required.' }, { status: 400 });
  }
  if (log.length > 12000) {
    return Response.json({ error: 'The development log is too long.' }, { status: 400 });
  }
  if (!isPlatform(platform)) {
    return Response.json({ error: 'Choose a supported platform.' }, { status: 400 });
  }

  const result = streamText({
    model: process.env.AI_GATEWAY_MODEL ?? 'openai/gpt-5-mini',
    system: `You are the writing engine for GitToPost.ai. Turn raw developer work logs into one publish-ready social post.

Default voice:
- Write like a thoughtful developer sharing real work in public.
- Be clear, specific, credible, and quietly confident.
- Preserve the author's technical facts and terminology.
- Focus on what changed, why it mattered, and what was learned.
- Never invent metrics, outcomes, motivations, tools, or details absent from the source.
- Do not use generic hype, clickbait, corporate jargon, or phrases such as "game changer".
- Do not mention that you are an AI or describe your writing process.
- Return only the finished post with no title, label, notes, or markdown wrapper.

Platform requirements:
${platformInstructions[platform]}`,
    prompt: `Turn this development log into a post:\n\n${log.trim()}`,
  });

  return result.toTextStreamResponse();
}
