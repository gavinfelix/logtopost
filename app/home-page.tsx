'use client';

import { useRef, useState } from 'react';
import { ArrowRight, Check, Copy, Sparkles } from 'lucide-react';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { Textarea } from '@/components/ui/textarea';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';

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
    <main className="flex h-dvh flex-col overflow-hidden bg-background text-foreground">
      <div className="mx-auto flex h-full w-full max-w-7xl flex-col px-4 sm:px-6">
        <header className="flex h-12 shrink-0 items-center justify-between border-b">
          <div className="flex items-center gap-2.5">
            <div className="flex size-8 items-center justify-center rounded-lg bg-primary text-sm font-bold text-primary-foreground">
              G
            </div>
            <span className="text-base font-semibold tracking-tight">
              GitToPost<span className="text-muted-foreground">.ai</span>
            </span>
          </div>
          <Badge variant="outline" className="font-mono text-[10px]">
            MVP · v0.1
          </Badge>
        </header>

        <section className="flex min-h-0 flex-1 flex-col gap-3 py-3">
          <div className="shrink-0 space-y-1">
            <Badge variant="secondary" className="font-mono text-[10px] uppercase tracking-widest">
              From dev log to social post
            </Badge>
            <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
              Ship the code. Share the story.
            </h1>
            <p className="max-w-xl text-sm text-muted-foreground">
              Turn commits, bug fixes, and build notes into a post that is ready to publish.
            </p>
          </div>

          <div className="grid min-h-0 flex-1 grid-cols-1 gap-3 lg:grid-cols-2">
            <Card className="flex min-h-0 flex-col py-3 [--card-spacing:--spacing(3)]">
              <CardHeader className="pb-0">
                <CardTitle>Development log</CardTitle>
                <CardDescription>Paste a commit, bug fix, or build update</CardDescription>
                <CardAction>
                  <span className="font-mono text-[10px] text-muted-foreground">
                    {inputLog.length.toLocaleString()} / 12,000
                  </span>
                </CardAction>
              </CardHeader>

              <CardContent className="flex min-h-0 flex-1 flex-col gap-3">
                <Textarea
                  aria-label="Development log"
                  value={inputLog}
                  maxLength={12000}
                  onChange={(event) => setInputLog(event.target.value)}
                  placeholder={
                    'feat: added streaming generation to the post editor\n\n- connected the AI route\n- handled loading and error states\n- added one-click copy'
                  }
                  className="min-h-0 flex-1 resize-none font-mono text-xs leading-5 field-sizing-fixed"
                />

                <div className="space-y-2">
                  <Label className="text-xs uppercase tracking-wider text-muted-foreground">
                    Publish to
                  </Label>
                  <ToggleGroup
                    value={[platform]}
                    onValueChange={(values) => {
                      const next = values[0];
                      if (next === 'x' || next === 'linkedin') setPlatform(next);
                    }}
                    variant="outline"
                    className="grid w-full grid-cols-2"
                  >
                    {platforms.map((item) => (
                      <ToggleGroupItem
                        key={item.id}
                        value={item.id}
                        className="h-auto flex-col items-start gap-0.5 px-3 py-2"
                      >
                        <span className="text-sm font-medium">
                          {item.id === 'x' ? '𝕏' : 'in'}&nbsp;&nbsp;{item.label}
                        </span>
                        <span className="text-[10px] font-normal text-muted-foreground">
                          {item.hint}
                        </span>
                      </ToggleGroupItem>
                    ))}
                  </ToggleGroup>
                </div>

                <Button
                  type="button"
                  onClick={handleGenerate}
                  disabled={loading || !inputLog.trim()}
                  className="h-9 w-full"
                  size="lg"
                >
                  {loading ? <Spinner /> : null}
                  {loading ? 'Writing your post…' : 'Generate post'}
                  {!loading ? <ArrowRight data-icon="inline-end" /> : null}
                </Button>
              </CardContent>
            </Card>

            <Card className="flex min-h-0 flex-col py-3 [--card-spacing:--spacing(3)]">
              <CardHeader className="pb-0">
                <CardTitle>Post preview</CardTitle>
                <CardDescription>
                  {platform === 'x' ? 'X post' : 'LinkedIn post'} · Default builder voice
                </CardDescription>
                {loading ? (
                  <CardAction>
                    <Badge variant="secondary" className="gap-1.5">
                      <span className="size-1.5 animate-pulse rounded-full bg-primary" />
                      Streaming
                    </Badge>
                  </CardAction>
                ) : null}
              </CardHeader>

              <CardContent className="flex min-h-0 flex-1 flex-col gap-3">
                <div
                  aria-live="polite"
                  className="relative flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg border border-dashed bg-muted/30 p-3 text-sm leading-6 whitespace-pre-wrap"
                >
                  {output ? (
                    <p className="min-h-0 flex-1 overflow-hidden">
                      {output}
                      {loading ? (
                        <span className="ml-0.5 inline-block h-4 w-0.5 animate-pulse bg-primary align-middle" />
                      ) : null}
                    </p>
                  ) : (
                    <div className="flex flex-1 flex-col items-center justify-center gap-2 text-center text-sm text-muted-foreground">
                      <div className="flex size-8 items-center justify-center rounded-full border bg-muted">
                        <Sparkles className="size-3.5" />
                      </div>
                      {placeholders[platform]}
                    </div>
                  )}
                </div>

                {error ? (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                ) : null}

                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCopy}
                  disabled={!output || loading}
                  className="h-9 w-full"
                  size="lg"
                >
                  {copied ? <Check data-icon="inline-start" /> : <Copy data-icon="inline-start" />}
                  {copied ? 'Copied' : 'Copy post'}
                </Button>
              </CardContent>
            </Card>
          </div>
        </section>

        <footer className="shrink-0 border-t py-2 text-center font-mono text-[10px] text-muted-foreground">
          Built for developers who ship.
        </footer>
      </div>
    </main>
  );
}
