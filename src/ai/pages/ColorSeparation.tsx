import { useEffect, useState } from "react";
import {
  Download,
  ImageUp,
  Layers3,
  Loader2,
  RefreshCcw,
  Sparkles,
  X,
} from "lucide-react";
import { useColorSeparationTool } from "@/api/aiApi";

export default function ColorSeparationPage() {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [numColors, setNumColors] = useState(5);
  const [mergeSimilarColors, setMergeSimilarColors] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [remainingCredits, setRemainingCredits] = useState<number | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!file) {
      setPreviewUrl(null);
      return undefined;
    }

    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [file]);

  const handleGenerate = async () => {
    if (!file) {
      setError("Please upload artwork before running color separation.");
      return;
    }

    try {
      setIsProcessing(true);
      setError("");

      const response = await useColorSeparationTool({
        file,
        numColors,
        mergeSimilarColors,
      });

      if (!response.success || !response.outputUrl) {
        throw new Error(response.message || "Color separation failed.");
      }

      setResultUrl(response.outputUrl);
      setRemainingCredits(response.remainingCredits ?? null);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Color separation failed."
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownload = async () => {
    if (!resultUrl) return;

    const response = await fetch(resultUrl);
    const blob = await response.blob();
    const objectUrl = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = objectUrl;
    link.download = `color-separation-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(objectUrl);
  };

  const resetWorkspace = () => {
    setFile(null);
    setPreviewUrl(null);
    setResultUrl(null);
    setError("");
  };

  return (
    <div className="min-h-screen bg-[#050505] p-4 text-white md:p-8 lg:p-10">
      <div className="pointer-events-none absolute left-1/2 top-0 h-[320px] w-full -translate-x-1/2 bg-[#ff1a1a]/5 blur-[120px]" />

      <div className="relative z-10 mx-auto max-w-[1450px] space-y-8">
        <header className="flex flex-col gap-5 border-b border-white/10 pb-8 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#ff1a1a]/30 bg-[#ff1a1a]/10 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-[#ff1a1a]">
              <Sparkles className="h-4 w-4" /> Separation Engine
            </div>
            <h1 className="text-5xl font-bold uppercase tracking-tight text-white md:text-6xl">
              Color <span className="font-normal text-gray-600">Separation</span>
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-relaxed text-gray-400">
              Send artwork through the unified AI backend and generate a separated-color output using the new `/api/ai/use` flow.
            </p>
          </div>

          {typeof remainingCredits === "number" && (
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-5 py-4 text-sm font-bold uppercase tracking-[0.18em] text-gray-400">
              Credits Left: <span className="text-white">{remainingCredits}</span>
            </div>
          )}
        </header>

        <div className="grid gap-8 lg:grid-cols-[360px_minmax(0,1fr)]">
          <aside className="rounded-[28px] border border-white/10 bg-white/[0.03] p-6 backdrop-blur">
            <div className="mb-6">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-600">Controls</p>
              <h2 className="mt-2 text-xl font-semibold uppercase tracking-tight text-white">Separation Setup</h2>
            </div>

            <label className="flex min-h-[180px] cursor-pointer flex-col items-center justify-center rounded-[24px] border-2 border-dashed border-white/10 bg-black/30 p-6 text-center transition-colors hover:border-[#ff1a1a]/40 hover:bg-white/[0.03]">
              <input
                type="file"
                accept="image/*"
                hidden
                onChange={(event) => {
                  const nextFile = event.target.files?.[0] || null;
                  setFile(nextFile);
                  setResultUrl(null);
                  setError("");
                }}
              />
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-gray-500">
                <ImageUp className="h-6 w-6" />
              </div>
              <p className="text-sm font-bold text-white">{file ? file.name : "Upload artwork"}</p>
              <p className="mt-2 text-xs uppercase tracking-[0.18em] text-gray-600">PNG, JPG, WEBP supported</p>
            </label>

            <div className="mt-6 space-y-5">
              <div>
                <label className="mb-3 block text-xs font-semibold uppercase tracking-wide text-gray-400">
                  Number Of Colors
                </label>
                <input
                  type="number"
                  min="2"
                  max="20"
                  value={numColors}
                  onChange={(event) => setNumColors(Number(event.target.value || 5))}
                  className="w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white outline-none transition-colors focus:border-[#ff1a1a]/50"
                />
              </div>

              <label className="flex items-center justify-between rounded-2xl border border-white/10 bg-black/30 px-4 py-4">
                <span>
                  <span className="block text-xs font-semibold uppercase tracking-wide text-gray-400">
                    Merge Similar Colors
                  </span>
                  <span className="mt-1 block text-sm text-gray-600">
                    Reduce close shades into fewer grouped outputs.
                  </span>
                </span>
                <input
                  type="checkbox"
                  checked={mergeSimilarColors}
                  onChange={(event) => setMergeSimilarColors(event.target.checked)}
                  className="h-5 w-5 rounded border-white/20 bg-transparent accent-[#ff1a1a]"
                />
              </label>
            </div>

            <div className="mt-8 grid gap-3">
              <button
                type="button"
                onClick={handleGenerate}
                disabled={!file || isProcessing}
                className="inline-flex items-center justify-center gap-3 rounded-2xl bg-[#ff1a1a] px-4 py-4 text-sm font-black uppercase tracking-widest text-white transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {isProcessing ? <Loader2 className="h-5 w-5 animate-spin" /> : <Layers3 className="h-5 w-5" />}
                {isProcessing ? "Processing..." : "Generate Output"}
              </button>

              <button
                type="button"
                onClick={handleDownload}
                disabled={!resultUrl || isProcessing}
                className="inline-flex items-center justify-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-4 text-sm font-black uppercase tracking-widest text-white/70 transition-colors hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
              >
                <Download className="h-5 w-5" />
                Download Result
              </button>

              <button
                type="button"
                onClick={resetWorkspace}
                className="inline-flex items-center justify-center gap-3 rounded-2xl border border-white/10 bg-transparent px-4 py-4 text-sm font-black uppercase tracking-widest text-gray-500 transition-colors hover:bg-white/5 hover:text-white"
              >
                <RefreshCcw className="h-5 w-5" />
                Reset
              </button>
            </div>

            {error && (
              <div className="mt-6 rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                {error}
              </div>
            )}
          </aside>

          <main className="grid gap-6 xl:grid-cols-2">
            <section className="overflow-hidden rounded-[28px] border border-white/10 bg-white/[0.03]">
              <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Source</p>
                  <p className="text-sm text-gray-600">Uploaded artwork preview</p>
                </div>
                {previewUrl && (
                  <button
                    type="button"
                    onClick={() => setFile(null)}
                    className="rounded-full border border-white/10 bg-black/40 p-2 text-white/70 hover:text-white"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>

              <div className="flex min-h-[540px] items-center justify-center bg-[#0a0a0a] p-5">
                {previewUrl ? (
                  <img src={previewUrl} alt="Uploaded artwork" className="max-h-[500px] w-full object-contain" />
                ) : (
                  <div className="text-center">
                    <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-gray-600">
                      <ImageUp className="h-8 w-8" />
                    </div>
                    <p className="text-lg font-semibold uppercase tracking-wide text-gray-500">Awaiting artwork</p>
                  </div>
                )}
              </div>
            </section>

            <section className="overflow-hidden rounded-[28px] border border-white/10 bg-white/[0.03]">
              <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Separated Output</p>
                  <p className="text-sm text-gray-600">Final backend response</p>
                </div>
              </div>

              <div className="flex min-h-[540px] items-center justify-center bg-[#0a0a0a] p-5">
                {isProcessing ? (
                  <div className="text-center">
                    <Loader2 className="mx-auto h-10 w-10 animate-spin text-[#ff1a1a]" />
                    <p className="mt-4 text-sm font-semibold uppercase tracking-[0.18em] text-gray-400">
                      Separating colors
                    </p>
                  </div>
                ) : resultUrl ? (
                  <img src={resultUrl} alt="Separated output" className="max-h-[500px] w-full object-contain" />
                ) : (
                  <div className="text-center">
                    <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-gray-600">
                      <Layers3 className="h-8 w-8" />
                    </div>
                    <p className="text-lg font-semibold uppercase tracking-wide text-gray-500">Output will appear here</p>
                  </div>
                )}
              </div>
            </section>
          </main>
        </div>
      </div>
    </div>
  );
}
