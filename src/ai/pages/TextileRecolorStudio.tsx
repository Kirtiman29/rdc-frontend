import { useEffect, useState } from "react";
import {
  ArrowRight,
  Download,
  Image as ImageIcon,
  Loader2,
  Palette,
  RefreshCcw,
  Upload,
  X,
} from "lucide-react";
import { useColorwayTool } from "@/api/aiApi";

export default function TextileRecolorStudio() {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [sourceColor, setSourceColor] = useState("#ff0000");
  const [targetColor, setTargetColor] = useState("#0f766e");
  const [strength, setStrength] = useState(0.7);
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

  const handleDownload = async () => {
    if (!resultUrl) return;

    const response = await fetch(resultUrl);
    const blob = await response.blob();
    const downloadUrl = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = downloadUrl;
    link.download = `colorway-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(downloadUrl);
  };

  const handleGenerate = async () => {
    if (!file) {
      setError("Please upload an image before applying colorway.");
      return;
    }

    try {
      setIsProcessing(true);
      setError("");

      const response = await useColorwayTool({
        file,
        sourceColorHex: sourceColor,
        targetColorHex: targetColor,
        strength,
      });

      if (!response.success || !response.outputUrl) {
        throw new Error(response.message || "Colorway generation failed.");
      }

      setResultUrl(response.outputUrl);
      setRemainingCredits(response.remainingCredits ?? null);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Colorway generation failed.");
    } finally {
      setIsProcessing(false);
    }
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
              <Palette className="h-4 w-4" /> AI Recolor Engine
            </div>
            <h1 className="text-5xl font-bold uppercase tracking-tight text-white md:text-6xl">
              Recolor <span className="font-normal text-gray-600">Studio</span>
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-relaxed text-gray-400">
              Apply production-ready colorway changes through the unified AI backend using one upload and one final output.
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
              <h2 className="mt-2 text-xl font-semibold uppercase tracking-tight text-white">Colorway Settings</h2>
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
                <Upload className="h-6 w-6" />
              </div>
              <p className="text-sm font-bold text-white">{file ? file.name : "Upload source artwork"}</p>
              <p className="mt-2 text-xs uppercase tracking-[0.18em] text-gray-600">PNG, JPG, WEBP supported</p>
            </label>

            <div className="mt-6 space-y-5">
              <div>
                <label className="mb-3 block text-xs font-semibold uppercase tracking-wide text-gray-400">
                  Source Color
                </label>
                <input
                  type="color"
                  value={sourceColor}
                  onChange={(event) => setSourceColor(event.target.value)}
                  className="h-14 w-full cursor-pointer rounded-2xl border border-white/10 bg-transparent"
                />
              </div>

              <div>
                <label className="mb-3 block text-xs font-semibold uppercase tracking-wide text-gray-400">
                  Target Color
                </label>
                <input
                  type="color"
                  value={targetColor}
                  onChange={(event) => setTargetColor(event.target.value)}
                  className="h-14 w-full cursor-pointer rounded-2xl border border-white/10 bg-transparent"
                />
              </div>

              <div>
                <div className="mb-3 flex items-center justify-between text-xs font-semibold uppercase tracking-wide text-gray-400">
                  <span>Strength</span>
                  <span className="text-[#ff1a1a]">{strength.toFixed(2)}</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={strength}
                  onChange={(event) => setStrength(Number(event.target.value))}
                  className="h-2 w-full cursor-pointer appearance-none rounded-full bg-white/10"
                  style={{
                    background: `linear-gradient(to right, #ff1a1a 0%, #ff1a1a ${strength * 100}%, #ffffff20 ${strength * 100}%, #ffffff20 100%)`,
                  }}
                />
              </div>
            </div>

            <div className="mt-8 grid gap-3">
              <button
                type="button"
                onClick={handleGenerate}
                disabled={!file || isProcessing}
                className="inline-flex items-center justify-center gap-3 rounded-2xl bg-[#ff1a1a] px-4 py-4 text-sm font-black uppercase tracking-widest text-white transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {isProcessing ? <Loader2 className="h-5 w-5 animate-spin" /> : <Palette className="h-5 w-5" />}
                {isProcessing ? "Processing..." : "Apply Colorway"}
              </button>

              <button
                type="button"
                onClick={handleDownload}
                disabled={!resultUrl || isProcessing}
                className="inline-flex items-center justify-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-4 text-sm font-black uppercase tracking-widest text-white/70 transition-colors hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
              >
                <Download className="h-5 w-5" />
                Download Output
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
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Before</p>
                  <p className="text-sm text-gray-600">Source artwork preview</p>
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
                  <img src={previewUrl} alt="Original artwork" className="max-h-[500px] w-full object-contain" />
                ) : (
                  <div className="text-center">
                    <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-gray-600">
                      <ImageIcon className="h-8 w-8" />
                    </div>
                    <p className="text-lg font-semibold uppercase tracking-wide text-gray-500">Awaiting artwork</p>
                  </div>
                )}
              </div>
            </section>

            <section className="overflow-hidden rounded-[28px] border border-white/10 bg-white/[0.03]">
              <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">After</p>
                  <p className="text-sm text-gray-600">Backend colorway output</p>
                </div>
                {resultUrl && <ArrowRight className="h-4 w-4 text-[#ff1a1a]" />}
              </div>

              <div className="flex min-h-[540px] items-center justify-center bg-[#0a0a0a] p-5">
                {isProcessing ? (
                  <div className="text-center">
                    <Loader2 className="mx-auto h-10 w-10 animate-spin text-[#ff1a1a]" />
                    <p className="mt-4 text-sm font-semibold uppercase tracking-[0.18em] text-gray-400">
                      Generating colorway
                    </p>
                  </div>
                ) : resultUrl ? (
                  <img src={resultUrl} alt="Colorway result" className="max-h-[500px] w-full object-contain" />
                ) : (
                  <div className="text-center">
                    <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-gray-600">
                      <Palette className="h-8 w-8" />
                    </div>
                    <p className="text-lg font-semibold uppercase tracking-wide text-gray-500">Result will appear here</p>
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
