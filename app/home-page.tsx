'use client';

import { useRef, useState } from 'react';

type Platform = 'x' | 'linkedin';

const platforms: Array<{ id: Platform; label: string; hint: string }> = [
  { id: 'x', label: 'X', hint: 'Short & sharp' },
  { id: 'linkedin', label: 'LinkedIn', hint: 'Detailed & professional' },
];

const placeholders: Record<Platform, string> = {
  x: 'Your publish-ready post will appear here.',
  linkedin: 'Your publish-ready LinkedIn post will appear here.',
};

export default function HomePage() {
  const [inputLog, setInputLog] = useState('');
  const [platform, setPlatform] = useState<Platform>('x');
  const [output, setOutput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const abortController = useRef<AbortController | null>(null);

  async function handleGenerate() {
    const log = inputLog.trim();
    if (!log || loading) return;

    abortController.current?.abort();
    const controller = new AbortController();
    abortController.current = controller;
    setLoading(true);
    setOutput('');
    setError('');
    setCopied(false);

    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ log, platform }),
        signal: controller.signal,
      });

      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(body?.error ?? 'Generation failed. Please try again.');
      }
      if (!response.body) throw new Error('The response stream is unavailable.');

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        setOutput((current) => current + decoder.decode(value, { stream: true }));
      }
    } catch (caughtError) {
      if ((caughtError as Error).name !== 'AbortError') {
        setError(caughtError instanceof Error ? caughtError.message : 'Generation failed. Please try again.');
      }
    } finally {
      if (abortController.current === controller) {
        setLoading(false);
        abortController.current = null;
      }
    }
  }

  async function handleCopy() {
    if (!output) return;
    try {
      await navigator.clipboard.writeText(output);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setError('Could not access your clipboard. Please copy the post manually.');
    }
  }

  return (
    <main className="min-h-screen bg-[#08090b] text-neutral-100 selection:bg-violet-500/30">
      <div className="mx-auto flex min-h-screen w-full max-w-7xl flex-col px-5 sm:px-8">
        <header className="flex h-20 items-center justify-between border-b border-white/[0.07]">
          <div className="flex items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 text-sm font-bold text-white shadow-lg shadow-violet-500/15">G</div>
            <span className="text-lg font-semibold tracking-tight">GitToPost<span className="text-violet-400">.ai</span></span>
          </div>
          <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 font-mono text-[11px] text-neutral-400">MVP · v0.1</span>
        </header>

        <section className="flex flex-1 flex-col py-12 lg:py-16">
          <div className="mb-10 max-w-2xl">
            <p className="mb-4 font-mono text-xs uppercase tracking-[0.22em] text-violet-400">From dev log to social post</p>
            <h1 className="text-4xl font-semibold tracking-[-0.04em] text-white sm:text-5xl">Ship the code. Share the story.</h1>
            <p className="mt-4 max-w-xl text-base leading-7 text-neutral-400">Turn commits, bug fixes, and build notes into a post that is ready to publish.</p>
          </div>

          <div className="grid flex-1 grid-cols-1 gap-5 lg:grid-cols-2">
            <section className="flex min-h-[470px] flex-col rounded-2xl border border-white/[0.08] bg-white/[0.035] p-5 sm:p-6">
              <div className="mb-5 flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-neutral-100">Development log</p>
                  <p className="mt-1 text-xs text-neutral-500">Paste a commit, bug fix, or build update</p>
                </div>
                <span className="font-mono text-[11px] text-neutral-600">{inputLog.length.toLocaleString()} / 12,000</span>
              </div>

              <textarea
                aria-label="Development log"
                value={inputLog}
                maxLength={12000}
                onChange={(event) => setInputLog(event.target.value)}
                placeholder={'feat: added streaming generation to the post editor\n\n- connected the AI route\n- handled loading and error states\n- added one-click copy'}
                className="min-h-64 flex-1 resize-none rounded-xl border border-white/[0.08] bg-black/25 p-4 font-mono text-[13px] leading-6 text-neutral-300 outline-none transition placeholder:text-neutral-700 focus:border-violet-500/50 focus:ring-2 focus:ring-violet-500/10"
              />

              <fieldset className="mt-5">
                <legend className="mb-3 text-xs font-medium uppercase tracking-wider text-neutral-500">Publish to</legend>
                <div className="grid grid-cols-2 gap-3">
                  {platforms.map((item) => {
                    const selected = platform === item.id;
                    return (
                      <button key={item.id} type="button" aria-pressed={selected} onClick={() => setPlatform(item.id)} className={`rounded-xl border px-4 py-3 text-left transition ${selected ? 'border-violet-500/60 bg-violet-500/10 text-white' : 'border-white/[0.08] bg-white/[0.025] text-neutral-400 hover:border-white/15 hover:bg-white/[0.05]'}`}>
                        <span className="block text-sm font-medium">{item.id === 'x' ? '𝕏' : 'in'}&nbsp;&nbsp;{item.label}</span>
                        <span className="mt-1 block text-[11px] text-neutral-500">{item.hint}</span>
                      </button>
                    );
                  })}
                </div>
              </fieldset>

              <button type="button" onClick={handleGenerate} disabled={loading || !inputLog.trim()} className="mt-5 flex h-12 items-center justify-center gap-2 rounded-xl bg-white text-sm font-semibold text-neutral-950 transition hover:bg-neutral-200 active:scale-[0.995] disabled:cursor-not-allowed disabled:bg-neutral-800 disabled:text-neutral-500">
                {loading && <span className="size-4 animate-spin rounded-full border-2 border-neutral-500 border-t-neutral-950" />}
                {loading ? 'Writing your post…' : 'Generate post'}
                {!loading && <span aria-hidden="true">→</span>}
              </button>
            </section>

            <section className="flex min-h-[470px] flex-col rounded-2xl border border-white/[0.08] bg-white/[0.02] p-5 sm:p-6">
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-neutral-100">Post preview</p>
                  <p className="mt-1 text-xs text-neutral-500">{platform === 'x' ? 'X post' : 'LinkedIn post'} · Default builder voice</p>
                </div>
                {loading && <span className="flex items-center gap-2 text-xs text-violet-400"><span className="size-1.5 animate-pulse rounded-full bg-violet-400" />Streaming</span>}
              </div>

              <div aria-live="polite" className="relative min-h-72 flex-1 rounded-xl border border-dashed border-white/[0.09] bg-black/20 p-5 text-[15px] leading-7 text-neutral-300 whitespace-pre-wrap">
                {output || <div className="flex h-full min-h-60 items-center justify-center text-center text-sm text-neutral-600"><div><div className="mx-auto mb-3 flex size-10 items-center justify-center rounded-full border border-white/[0.08] bg-white/[0.03] text-neutral-500">✦</div>{placeholders[platform]}</div></div>}
                {loading && output && <span className="ml-0.5 inline-block h-4 w-0.5 animate-pulse bg-violet-400 align-middle" />}
              </div>

              {error && <p role="alert" className="mt-3 rounded-lg border border-red-500/15 bg-red-500/[0.07] px-3 py-2 text-xs text-red-300">{error}</p>}

              <button type="button" onClick={handleCopy} disabled={!output || loading} className="mt-5 flex h-12 items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] text-sm font-medium text-neutral-200 transition hover:border-white/20 hover:bg-white/[0.07] disabled:cursor-not-allowed disabled:text-neutral-600 disabled:hover:border-white/10 disabled:hover:bg-white/[0.04]">
                <span aria-hidden="true">{copied ? '✓' : '▣'}</span>
                {copied ? 'Copied' : 'Copy post'}
              </button>
            </section>
          </div>
        </section>

        <footer className="border-t border-white/[0.06] py-6 text-center font-mono text-[11px] text-neutral-700">Built for developers who ship.</footer>
      </div>
    </main>
  );
}
