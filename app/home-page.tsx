'use client';

import { useState } from 'react';

export default function HomePage() {
  const [inputLog, setInputLog] = useState('');
  const [loading, setLoading] = useState(false);
  const [outputTweet, setOutputTweet] = useState('AI 润色后的推文草稿将在这里流式打印出来...');

  const handleGenerate = () => {
    setLoading(true);
    // TODO: 后面对接 Next.js Route Handler 路由 API
    setTimeout(() => {
      setOutputTweet(
        '🚀 Just shipped a major updates!\n\nFixed that annoying hydration error in page.tsx. The workflow is now 10x smoother. \n\n#BuildInPublic #IndieHacker',
      );
      setLoading(false);
    }, 1200);
  };

  return (
    <main className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col justify-between p-6 antialiased selection:bg-indigo-500/30">
      <header className="max-w-6xl w-full mx-auto flex justify-between items-center py-4 border-b border-neutral-800">
        <div className="flex items-center space-x-3">
          <div className="h-8 w-8 bg-gradient-to-tr from-indigo-500 to-violet-500 rounded-lg flex items-center justify-center font-bold text-white shadow-lg shadow-indigo-500/20">
            G
          </div>
          <span className="font-semibold text-lg tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-neutral-100 to-neutral-400">
            GitToPost<span className="text-indigo-400 font-mono text-sm ml-1">.ai</span>
          </span>
        </div>
        <div className="flex items-center space-x-4">
          <span className="text-xs text-neutral-400 bg-neutral-900 border border-neutral-800 px-2.5 py-1 rounded-full font-mono">
            v0.1.0 MVP
          </span>
        </div>
      </header>

      <section className="max-w-6xl w-full mx-auto grid grid-cols-1 md:grid-cols-2 gap-6 my-auto py-8">
        <div className="bg-neutral-900/50 border border-neutral-800 rounded-2xl p-5 flex flex-col space-y-4 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-neutral-300 flex items-center space-x-2">
              <span className="h-2 w-2 rounded-full bg-indigo-400 animate-pulse" />
              <span>Paste Git Log / Commit / Bug Report</span>
            </label>
          </div>
          <textarea
            value={inputLog}
            onChange={(e) => setInputLog(e.target.value)}
            placeholder="e.g., git log -1&#10;commit ae87f6... &#10;fix: resolved page.tsx rendering dynamic hydration failure by adding suppression attributes."
            className="w-full flex-1 min-h-[300px] bg-neutral-950/60 border border-neutral-800 rounded-xl p-4 text-sm font-mono text-neutral-300 placeholder-neutral-600 focus:outline-none focus:border-indigo-500/50 transition-colors resize-none"
          />
          <button
            onClick={handleGenerate}
            disabled={loading || !inputLog}
            className="w-full py-3 bg-neutral-100 hover:bg-neutral-200 disabled:bg-neutral-800 disabled:text-neutral-500 text-neutral-950 font-medium text-sm rounded-xl transition-all shadow-md active:scale-[0.99] flex items-center justify-center space-x-2"
          >
            {loading ? (
              <span className="h-4 w-4 border-2 border-neutral-500 border-t-neutral-900 rounded-full animate-spin" />
            ) : (
              <span>Generate Build-in-Public Post</span>
            )}
          </button>
        </div>

        <div className="bg-neutral-900/30 border border-neutral-800 border-dashed rounded-2xl p-5 flex flex-col space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-neutral-400 flex items-center space-x-2">
              <span>𝕏 Preview Draft</span>
            </span>
          </div>
          <div className="w-full flex-1 min-h-[300px] bg-neutral-950/40 border border-neutral-800 rounded-xl p-5 text-sm text-neutral-300 font-sans whitespace-pre-wrap leading-relaxed shadow-inner">
            {outputTweet}
          </div>
          <div className="flex space-x-3">
            <button className="flex-1 py-2.5 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-300 font-medium text-xs rounded-lg transition-colors">
              Copy to Clipboard
            </button>
            <button className="flex-1 py-2.5 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-400 border border-indigo-500/20 font-medium text-xs rounded-lg transition-colors">
              Publish to 𝕏
            </button>
          </div>
        </div>
      </section>

      <footer className="max-w-6xl w-full mx-auto text-center py-4 text-xs text-neutral-600 font-mono border-t border-neutral-900">
        {'Built in public by a cold developer.'}
      </footer>
    </main>
  );
}
