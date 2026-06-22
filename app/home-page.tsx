'use client';

import { useRef, useState } from 'react';
import { ArrowRight, Check, Copy, Sparkles } from 'lucide-react';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { Textarea } from '@/components/ui/textarea';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { cn } from '@/lib/utils';

type Platform = 'x' | 'linkedin';

const platforms: Array<{ id: Platform; label: string; hint: string }> = [
  { id: 'x', label: 'X', hint: 'Short & sharp' },
  { id: 'linkedin', label: 'LinkedIn', hint: 'Detailed & professional' },
];

const placeholders: Record<Platform, string> = {
  x: 'Your publish-ready post will appear here.',
  linkedin: 'Your publish-ready LinkedIn post will appear here.',
};

const panelClassName =
  'flex min-h-0 flex-col rounded-2xl border border-white/[0.08] p-5 sm:p-6';

export default function HomePage() {
  const [inputLog, setInputLog] = useState('');
  const [platform, setPlatform] = useState<Platform>('x');
  const [output, setOutput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [inputFocused, setInputFocused] = useState(false);
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
    <main className="relative flex h-dvh flex-col overflow-hidden bg-background text-foreground selection:bg-violet-500/30">
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/3 size-[480px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-indigo-500/8 blur-[120px]" />
        <div className="absolute right-1/4 bottom-1/3 size-[360px] translate-x-1/4 rounded-full bg-violet-500/8 blur-[100px]" />
      </div>

      <div className="relative mx-auto flex h-full w-full max-w-7xl flex-col px-5 sm:px-8">
        <header className="flex h-14 shrink-0 items-center justify-between border-b border-white/[0.07] sm:h-16">
          <div className="flex items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 text-sm font-bold text-white shadow-lg shadow-violet-500/20">
              G
            </div>
            <span className="text-lg font-semibold tracking-tight">
              GitToPost<span className="text-violet-400">.ai</span>
            </span>
          </div>
          <Badge variant="outline" className="border-white/10 bg-white/[0.04] font-mono text-[11px] text-neutral-400">
            MVP - v0.1
          </Badge>
        </header>

        <section className="flex min-h-0 flex-1 flex-col py-4 sm:py-5">
          <div className="mb-5 max-w-2xl shrink-0 space-y-2 sm:mb-6">
            <p className="font-mono text-xs uppercase tracking-[0.22em] text-violet-400">
              From dev log to social post
            </p>
            <h1 className="text-3xl font-semibold tracking-[-0.04em] text-white sm:text-4xl">
              Ship the code. Share the story.
            </h1>
            <p className="max-w-xl text-sm leading-6 text-neutral-400 sm:text-base sm:leading-7">
              Turn commits, bug fixes, and build notes into a post that is ready to publish.
            </p>
          </div>

          <div className="grid min-h-0 flex-1 grid-cols-1 gap-5 lg:grid-cols-2">
            <section className={`${panelClassName} bg-white/[0.035]`}>
              <div className="mb-4 flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-neutral-100">Development log</p>
                  <p className="mt-1 text-xs text-neutral-500">
                    Paste a commit, bug fix, or build update
                  </p>
                </div>
                <span className="shrink-0 font-mono text-[11px] text-neutral-600">
                  {inputLog.length.toLocaleString()} / 12,000
                </span>
              </div>

              <Textarea
                aria-label="Development log"
                value={inputLog}
                maxLength={12000}
                onChange={(event) => setInputLog(event.target.value)}
                onFocus={() => setInputFocused(true)}
                onBlur={() => setInputFocused(false)}
                placeholder={
                  'feat: added streaming generation to the post editor\n\n- connected the AI route\n- handled loading and error states\n- added one-click copy'
                }
                className={cn(
                  'min-h-0 flex-1 resize-none rounded-xl bg-black/25 p-4 font-mono text-[13px] leading-6 text-neutral-300 field-sizing-fixed placeholder:text-neutral-700 transition-[border-color,box-shadow]',
                  inputLog.length > 0 || inputFocused
                    ? 'border-violet-500/60 shadow-[0_0_28px_rgba(139,92,246,0.14)] focus-visible:border-violet-500/70 focus-visible:ring-violet-500/20'
                    : 'border-white/[0.08] focus-visible:border-violet-500/50 focus-visible:ring-violet-500/15',
                )}
              />

              <fieldset className="mt-4 shrink-0">
                <legend className="mb-3 text-xs font-medium uppercase tracking-wider text-neutral-500">
                  Publish to
                </legend>
                <ToggleGroup
                  value={[platform]}
                  onValueChange={(values) => {
                    const next = values[0];
                    if (next === 'x' || next === 'linkedin') setPlatform(next);
                  }}
                  variant="outline"
                  className="grid w-full grid-cols-2 gap-3"
                  spacing={0}
                >
                  {platforms.map((item) => (
                    <ToggleGroupItem
                      key={item.id}
                      value={item.id}
                      className="h-auto flex-col items-start gap-1 rounded-xl border-white/[0.08] bg-white/[0.025] px-4 py-3 text-left hover:border-white/15 hover:bg-white/[0.05] aria-pressed:border-violet-500 aria-pressed:bg-violet-500/15 aria-pressed:text-white aria-pressed:shadow-[0_0_28px_rgba(139,92,246,0.18)]"
                    >
                      <span className="text-sm font-medium">
                        {item.id === 'x' ? '𝕏' : 'in'}&nbsp;&nbsp;{item.label}
                      </span>
                      <span className="text-[11px] font-normal text-neutral-500">
                        {item.hint}
                      </span>
                    </ToggleGroupItem>
                  ))}
                </ToggleGroup>
              </fieldset>

              <Button
                type="button"
                onClick={handleGenerate}
                disabled={loading || !inputLog.trim()}
                className={cn(
                  'mt-4 h-11 w-full shrink-0 text-sm font-semibold sm:h-12',
                  inputLog.trim() && !loading
                    ? 'border-transparent bg-white text-neutral-950 shadow-[0_0_32px_rgba(139,92,246,0.2)] hover:bg-neutral-200'
                    : 'border-white/10 bg-white/[0.04] text-neutral-500 hover:border-white/20 hover:bg-white/[0.07]',
                )}
                size="lg"
              >
                {loading ? <Spinner /> : null}
                {loading ? 'Writing your post…' : 'Generate post'}
                {!loading ? <ArrowRight data-icon="inline-end" /> : null}
              </Button>
            </section>

            <section className={`${panelClassName} bg-white/[0.02]`}>
              <div className="mb-4 flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-neutral-100">Post preview</p>
                  <p className="mt-1 text-xs text-neutral-500">
                    {platform === 'x' ? 'X post' : 'LinkedIn post'} - Default builder voice
                  </p>
                </div>
                {loading ? (
                  <Badge variant="outline" className="shrink-0 gap-1.5 border-violet-500/20 bg-violet-500/10 text-violet-300">
                    <span className="size-1.5 animate-pulse rounded-full bg-violet-400" />
                    Streaming
                  </Badge>
                ) : null}
              </div>

              <div
                aria-live="polite"
                className={cn(
                  'flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border bg-black/20 p-4 text-[15px] leading-7 text-neutral-300 whitespace-pre-wrap transition-[border-color,box-shadow]',
                  output.length > 0
                    ? 'border-violet-500/60 shadow-[0_0_28px_rgba(139,92,246,0.14)]'
                    : 'border-white/[0.08]',
                )}
              >
                {output ? (
                  <p className="min-h-0 flex-1 overflow-hidden">
                    {output}
                    {loading ? (
                      <span className="ml-0.5 inline-block h-4 w-0.5 animate-pulse bg-violet-400 align-middle" />
                    ) : null}
                  </p>
                ) : (
                  <div className="flex flex-1 flex-col items-center justify-center gap-2 text-center text-sm text-neutral-600">
                    <div className="flex size-10 items-center justify-center rounded-full border border-white/[0.08] bg-white/[0.03] text-neutral-500">
                      <Sparkles className="size-4" />
                    </div>
                    {placeholders[platform]}
                  </div>
                )}
              </div>

              {error ? (
                <Alert variant="destructive" className="mt-3 shrink-0 border-red-500/15 bg-red-500/[0.07]">
                  <AlertDescription className="text-red-300">{error}</AlertDescription>
                </Alert>
              ) : null}

              <Button
                type="button"
                variant="outline"
                onClick={handleCopy}
                disabled={!output || loading}
                className="mt-4 h-11 w-full shrink-0 border-white/10 bg-white/[0.04] text-sm font-medium text-neutral-200 hover:border-white/20 hover:bg-white/[0.07] disabled:text-neutral-600 sm:h-12"
                size="lg"
              >
                {copied ? <Check data-icon="inline-start" /> : <Copy data-icon="inline-start" />}
                {copied ? 'Copied' : 'Copy post'}
              </Button>
            </section>
          </div>
        </section>

        <footer className="shrink-0 border-t border-white/[0.06] py-3 text-center font-mono text-[11px] text-neutral-700">
          Built for developers who ship.
        </footer>
      </div>
    </main>
  );
}
