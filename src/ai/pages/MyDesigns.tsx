import { useEffect, useMemo, useState, type ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertCircle,
  ArrowUpRight,
  BadgeCheck,
  ChevronLeft,
  ChevronRight,
  Download,
  ExternalLink,
  Filter,
  Image as ImageIcon,
  Layers3,
  Loader2,
  RefreshCw,
  Search,
  Sparkles,
  X,
} from "lucide-react";

import { getToken } from "@/api/apiClient";
import {
  fetchHistory,
  getApiErrorMessage,
  type HistoryItem,
  type HistoryResponse,
  type HistorySourceFilter,
} from "@/api/historyApi";

const SOURCE_OPTIONS: Array<{ label: string; value: HistorySourceFilter }> = [
  { label: "All", value: "all" },
  { label: "AI", value: "ai" },
  { label: "Gemini", value: "gemini" },
];

const PAGE_SIZE_OPTIONS = [12, 20, 40];

const formatDateTime = (value: string | null) => {
  if (!value) return "Unknown time";

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(parsed);
};

const formatSourceLabel = (source: string) => {
  const normalized = source.toLowerCase();

  if (normalized.includes("gemini")) return "Gemini";
  if (normalized.includes("ai")) return "AI";
  const label = source.replace(/_/g, " ").trim();
  if (!label) return "History";
  return label.charAt(0).toUpperCase() + label.slice(1);
};

const formatBadgeLabel = (value: string | null, fallback = "Unknown") => {
  if (!value) return fallback;
  return value.replace(/_/g, " ");
};

const formatPromptSummary = (item: HistoryItem) => {
  return item.prompt || item.input_prompt || item.final_prompt || "No prompt was returned for this record.";
};

const getImageDownloadName = (item: HistoryItem) => {
  const safeStyle = (item.style || "history").replace(/[^a-z0-9-_]+/gi, "-").toLowerCase();
  const safeId = String(item.id || "item").replace(/[^a-z0-9-_]+/gi, "-").toLowerCase();
  return `${safeStyle}-${safeId}.png`;
};

const matchesSearch = (item: HistoryItem, query: string) => {
  const needle = query.trim().toLowerCase();
  if (!needle) return true;

  const haystack = [
    item.source,
    item.prompt,
    item.input_prompt,
    item.final_prompt,
    item.style,
    item.aspect_ratio,
    item.model,
    item.prompt_model,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  return haystack.includes(needle);
};

export default function MyDesigns() {
  const token = getToken() || localStorage.getItem("token");
  const hasAuth = Boolean(token);
  const [history, setHistory] = useState<HistoryResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sourceFilter, setSourceFilter] = useState<HistorySourceFilter>("all");
  const [styleFilter, setStyleFilter] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [pageSize, setPageSize] = useState(20);
  const [page, setPage] = useState(0);
  const [refreshIndex, setRefreshIndex] = useState(0);
  const [previewItem, setPreviewItem] = useState<HistoryItem | null>(null);

  useEffect(() => {
    if (!hasAuth) {
      setHistory(null);
      setError("Please sign in to view your generation history.");
      setLoading(false);
      return;
    }

    let active = true;

    const loadHistory = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetchHistory({
          source: sourceFilter,
          style: styleFilter.trim() || undefined,
          limit: pageSize,
          offset: page * pageSize,
        });

        if (!active) return;
        setHistory(response);
      } catch (err) {
        if (!active) return;
        setHistory(null);
        setError(getApiErrorMessage(err));
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    void loadHistory();

    return () => {
      active = false;
    };
  }, [hasAuth, page, pageSize, refreshIndex, sourceFilter, styleFilter, token]);

  const visibleItems = useMemo(() => {
    return (history?.data || []).filter((item) => matchesSearch(item, searchQuery));
  }, [history, searchQuery]);

  const totalItems = history?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const currentPage = totalItems === 0 ? 0 : Math.min(page + 1, totalPages);
  const showingStart = totalItems === 0 ? 0 : page * pageSize + 1;
  const showingEnd = totalItems === 0 ? 0 : Math.min(page * pageSize + (history?.data.length ?? 0), totalItems);

  const downloadImage = async (item: HistoryItem) => {
    const url = item.image_url;
    if (!url) return;

    if (/^(data:|blob:)/i.test(url)) {
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = getImageDownloadName(item);
      anchor.rel = "noreferrer";
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      return;
    }

    const response = await fetch(url, {
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    });

    if (!response.ok) {
      throw new Error(`Download failed (${response.status}).`);
    }

    const blob = await response.blob();
    const blobUrl = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = blobUrl;
    anchor.download = getImageDownloadName(item);
    anchor.rel = "noreferrer";
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    window.setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
  };

  const previewUrl = previewItem ? previewItem.image_url : "";
  const handleSourceChange = (value: HistorySourceFilter) => {
    setPage(0);
    setSourceFilter(value);
  };
  const handleStyleChange = (value: string) => {
    setPage(0);
    setStyleFilter(value);
  };
  const handlePageSizeChange = (value: number) => {
    setPage(0);
    setPageSize(value);
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#0b0d10] text-white">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-[-8%] top-[-10%] h-[460px] w-[460px] rounded-full bg-[#E11D2E]/12 blur-[150px]" />
        <div className="absolute right-[-8%] top-[10%] h-[380px] w-[380px] rounded-full bg-white/6 blur-[140px]" />
        <div className="absolute bottom-[-15%] left-[20%] h-[440px] w-[440px] rounded-full bg-[#3B82F6]/10 blur-[170px]" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:84px_84px] opacity-[0.08]" />
      </div>

      <div className="relative z-10 mx-auto flex max-w-[1520px] flex-col gap-8 px-4 py-6 md:px-6 md:py-8">
        <section className="overflow-hidden rounded-[32px] border border-white/10 bg-[#12151b]/90 p-5 shadow-[0_24px_90px_rgba(0,0,0,0.3)] backdrop-blur-xl md:p-7">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl space-y-4">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.35em] text-[#A1A8B3]">
                <Sparkles className="h-3.5 w-3.5 text-[#E11D2E]" />
                RDC AI Studio / Gallery
              </div>
              <div>
                <h1 className="text-4xl font-extrabold tracking-tight md:text-6xl">My Designs</h1>
                <p className="mt-3 max-w-2xl text-sm leading-7 text-[#A1A8B3] md:text-base">
                  Browse AI and Gemini generations from the subscription-service history endpoint.
                  Filter by source and style, review the final prompt, and open or download any record.
                </p>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-3 lg:min-w-[420px] lg:grid-cols-1 xl:grid-cols-3">
              <MetricCard label="Records" value={String(totalItems)} icon={<Layers3 className="h-4 w-4" />} />
              <MetricCard label="Page" value={`${currentPage || 0}/${totalPages}`} icon={<ImageIcon className="h-4 w-4" />} />
              <MetricCard label="Source" value={formatSourceLabel(sourceFilter)} icon={<BadgeCheck className="h-4 w-4" />} />
            </div>
          </div>

          <div className="mt-6 grid gap-4 rounded-[28px] border border-white/10 bg-white/[0.03] p-4 xl:grid-cols-[1.3fr_0.6fr_0.9fr_0.6fr_auto]">
            <label className="grid gap-2">
              <span className="text-[10px] font-semibold uppercase tracking-[0.25em] text-[#6B7280]">
                Search current page
              </span>
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#6B7280]" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="Search prompt, style, or model"
                  className="h-11 w-full rounded-2xl border border-white/10 bg-[#0c0f14] pl-10 pr-4 text-sm text-white outline-none transition placeholder:text-[#6B7280] focus:border-[#E11D2E]/40"
                />
              </div>
            </label>

            <label className="grid gap-2">
              <span className="text-[10px] font-semibold uppercase tracking-[0.25em] text-[#6B7280]">
                Source
              </span>
              <div className="relative">
                <Filter className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#6B7280]" />
                <select
                  value={sourceFilter}
                  onChange={(event) => handleSourceChange(event.target.value as HistorySourceFilter)}
                  className="h-11 w-full appearance-none rounded-2xl border border-white/10 bg-[#0c0f14] pl-10 pr-4 text-sm text-white outline-none transition focus:border-[#E11D2E]/40"
                >
                  {SOURCE_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value} className="bg-[#0c0f14]">
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </label>

            <label className="grid gap-2">
              <span className="text-[10px] font-semibold uppercase tracking-[0.25em] text-[#6B7280]">
                Style
              </span>
              <input
                type="text"
                value={styleFilter}
                onChange={(event) => handleStyleChange(event.target.value)}
                placeholder="floral, paisley, abstract..."
                className="h-11 w-full rounded-2xl border border-white/10 bg-[#0c0f14] px-4 text-sm text-white outline-none transition placeholder:text-[#6B7280] focus:border-[#E11D2E]/40"
              />
            </label>

            <label className="grid gap-2">
              <span className="text-[10px] font-semibold uppercase tracking-[0.25em] text-[#6B7280]">
                Per page
              </span>
              <select
                value={pageSize}
                onChange={(event) => handlePageSizeChange(Number(event.target.value))}
                className="h-11 w-full appearance-none rounded-2xl border border-white/10 bg-[#0c0f14] px-4 text-sm text-white outline-none transition focus:border-[#E11D2E]/40"
              >
                {PAGE_SIZE_OPTIONS.map((option) => (
                  <option key={option} value={option} className="bg-[#0c0f14]">
                    {option}
                  </option>
                ))}
              </select>
            </label>

            <div className="flex items-end gap-2">
              <button
                type="button"
                onClick={() => setRefreshIndex((value) => value + 1)}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.03] px-4 text-sm font-semibold text-white transition hover:border-[#E11D2E]/40 hover:bg-white/[0.06]"
              >
                <RefreshCw className="h-4 w-4" />
                Refresh
              </button>
            </div>
          </div>

          {!hasAuth && (
            <div className="mt-4 flex items-start gap-3 rounded-2xl border border-[#E11D2E]/25 bg-[#E11D2E]/10 px-4 py-3 text-sm text-[#ffb4b9]">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>Sign in to load history from the subscription-service backend.</span>
            </div>
          )}

          {error && hasAuth && (
            <div className="mt-4 flex items-start gap-3 rounded-2xl border border-[#E11D2E]/25 bg-[#E11D2E]/10 px-4 py-3 text-sm text-[#ffb4b9]">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </section>

        <section className="space-y-5">
          {loading ? (
            <div className="flex min-h-[420px] items-center justify-center rounded-[30px] border border-white/10 bg-white/[0.03]">
              <div className="flex flex-col items-center gap-3 text-center">
                <Loader2 className="h-8 w-8 animate-spin text-[#E11D2E]" />
                <p className="text-sm text-[#A1A8B3]">Loading design history...</p>
              </div>
            </div>
          ) : visibleItems.length > 0 ? (
            <>
              <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
                {visibleItems.map((item) => {
                  const imageUrl = item.image_url;
                  const sourceLabel = formatSourceLabel(item.source);
                  const title = formatPromptSummary(item);

                  return (
                    <motion.article
                      key={String(item.id)}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      whileHover={{ y: -4 }}
                      className="overflow-hidden rounded-[28px] border border-white/10 bg-[#0f1217]/92 shadow-[0_20px_70px_rgba(0,0,0,0.28)] transition hover:border-[#E11D2E]/35"
                    >
                      <button
                        type="button"
                        onClick={() => setPreviewItem(item)}
                        className="group block w-full overflow-hidden text-left"
                      >
                        <div className="relative aspect-[4/5] overflow-hidden bg-[#090b0f]">
                          {imageUrl ? (
                            <img
                              src={imageUrl}
                              alt={title}
                              className="h-full w-full object-cover transition duration-700 group-hover:scale-[1.03]"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center bg-[radial-gradient(circle_at_top,rgba(225,29,46,0.12),transparent_65%)]">
                              <div className="space-y-2 text-center">
                                <ImageIcon className="mx-auto h-11 w-11 text-[#E11D2E]" />
                                <p className="text-sm text-[#A1A8B3]">No preview image</p>
                              </div>
                            </div>
                          )}

                          <div className="absolute inset-x-0 top-0 flex items-start justify-between gap-2 p-3">
                            <span
                              className={`rounded-full border px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.22em] ${
                                sourceLabel === "Gemini"
                                  ? "border-emerald-500/25 bg-emerald-500/10 text-emerald-100"
                                  : "border-[#E11D2E]/30 bg-[#E11D2E]/12 text-[#ffb4b9]"
                              }`}
                            >
                              {sourceLabel}
                            </span>
                            <span className="rounded-full border border-white/10 bg-black/60 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-white">
                              {formatDateTime(item.created_at)}
                            </span>
                          </div>
                        </div>
                      </button>

                      <div className="space-y-4 p-4">
                        <div className="flex flex-wrap gap-2">
                          <TagPill label={`Style: ${formatBadgeLabel(item.style)}`} />
                          <TagPill label={`Aspect: ${formatBadgeLabel(item.aspect_ratio)}`} />
                        </div>

                        <div className="space-y-2">
                          <h3 className="text-base font-semibold leading-6 text-white">{title}</h3>
                          {item.input_prompt && item.input_prompt !== item.prompt && (
                            <p className="text-sm leading-6 text-[#8F96A3]">
                              Input: {item.input_prompt}
                            </p>
                          )}
                        </div>

                        {item.final_prompt && (
                          <details className="rounded-2xl border border-white/10 bg-white/[0.03] p-3">
                            <summary className="cursor-pointer list-none text-[10px] font-semibold uppercase tracking-[0.28em] text-[#A1A8B3]">
                              Final prompt
                            </summary>
                            <p className="mt-3 text-sm leading-6 text-[#D1D5DB]">{item.final_prompt}</p>
                          </details>
                        )}

                        <div className="flex flex-wrap gap-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#A1A8B3]">
                          {item.model && <TagPill label={item.model} />}
                          {item.prompt_model && <TagPill label={`Prompt: ${item.prompt_model}`} />}
                          {item.prompt_enhanced && <TagPill label="Prompt enhanced" />}
                          {item.fallback_used && <TagPill label="Fallback used" />}
                        </div>

                        <div className="flex items-center justify-between gap-3 border-t border-white/10 pt-3">
                          <button
                            type="button"
                            onClick={() => setPreviewItem(item)}
                            className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-white transition hover:border-[#E11D2E]/40 hover:bg-white/[0.06]"
                          >
                            <ExternalLink className="h-3.5 w-3.5" />
                            Open
                          </button>
                          <button
                            type="button"
                            disabled={!imageUrl}
                            onClick={() => {
                              void downloadImage(item);
                            }}
                            className="inline-flex items-center gap-2 rounded-full border border-[#E11D2E]/25 bg-[#E11D2E]/10 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#ffb4b9] transition hover:border-[#E11D2E]/45 hover:bg-[#E11D2E]/18 disabled:cursor-not-allowed disabled:opacity-45"
                          >
                            <Download className="h-3.5 w-3.5" />
                            Download
                          </button>
                        </div>
                      </div>
                    </motion.article>
                  );
                })}
              </div>

              <div className="flex flex-col gap-3 rounded-[28px] border border-white/10 bg-white/[0.03] p-4 md:flex-row md:items-center md:justify-between">
                <div className="space-y-1 text-sm text-[#A1A8B3]">
                  <p>
                    {searchQuery.trim()
                      ? `Showing ${visibleItems.length} filtered record${visibleItems.length === 1 ? "" : "s"} from the current page`
                      : `Showing ${showingStart}-${showingEnd} of ${totalItems} records`}
                  </p>
                  <p className="text-xs text-[#6B7280]">
                    Client-side search is applied to the loaded page only.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setPage((current) => Math.max(current - 1, 0))}
                    disabled={page <= 0}
                    className="inline-flex h-10 items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-4 text-sm font-semibold text-white transition hover:border-[#E11D2E]/40 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Prev
                  </button>
                  <div className="rounded-xl border border-white/10 bg-[#0c0f14] px-4 py-2 text-sm text-[#D1D5DB]">
                    Page {currentPage || 0} of {totalPages}
                  </div>
                  <button
                    type="button"
                    onClick={() => setPage((current) => (current + 1 < totalPages ? current + 1 : current))}
                    disabled={(page + 1) * pageSize >= totalItems}
                    className="inline-flex h-10 items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-4 text-sm font-semibold text-white transition hover:border-[#E11D2E]/40 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Next
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex min-h-[420px] items-center justify-center rounded-[30px] border border-white/10 bg-white/[0.03] px-6 text-center">
              <div className="max-w-md space-y-3">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.05]">
                  <ImageIcon className="h-6 w-6 text-[#E11D2E]" />
                </div>
                <h2 className="text-xl font-semibold text-white">No designs found</h2>
                <p className="text-sm leading-6 text-[#A1A8B3]">
                  Try a different source, clear the style filter, or refresh the history list.
                </p>
              </div>
            </div>
          )}
        </section>
      </div>

      <AnimatePresence>
        {previewItem && (
          <motion.div
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/92 p-4 backdrop-blur-xl md:p-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setPreviewItem(null)}
          >
            <motion.div
              className="relative flex h-full w-full max-w-7xl flex-col gap-4"
              initial={{ scale: 0.98, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.98, opacity: 0 }}
              transition={{ duration: 0.18 }}
              onClick={(event) => event.stopPropagation()}
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-white">History Preview</p>
                  <p className="text-xs text-[#A1A8B3]">
                    {formatSourceLabel(previewItem.source)} - {formatDateTime(previewItem.created_at)}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {previewUrl && (
                    <a
                      href={previewUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex h-10 items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-4 text-xs font-semibold uppercase tracking-[0.2em] text-white transition hover:border-[#E11D2E]/40"
                    >
                      <ArrowUpRight className="h-4 w-4" />
                      Open
                    </a>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      void downloadImage(previewItem);
                    }}
                    className="inline-flex h-10 items-center gap-2 rounded-xl border border-[#E11D2E]/25 bg-[#E11D2E]/15 px-4 text-xs font-semibold uppercase tracking-[0.2em] text-white transition hover:bg-[#E11D2E]/25"
                  >
                    <Download className="h-4 w-4" />
                    Download
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreviewItem(null)}
                    className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-white transition hover:border-[#E11D2E]/40"
                    aria-label="Close preview"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>

              <div className="grid min-h-0 flex-1 gap-4 lg:grid-cols-[minmax(0,1.4fr)_minmax(340px,0.6fr)]">
                <div className="overflow-hidden rounded-[28px] border border-white/10 bg-[#090b0f]">
                  {previewUrl ? (
                    <img src={previewUrl} alt="History preview" className="h-full w-full object-contain" />
                  ) : (
                    <div className="flex h-full min-h-[520px] items-center justify-center text-[#A1A8B3]">
                      No preview available
                    </div>
                  )}
                </div>

                <div className="rounded-[28px] border border-white/10 bg-[#10141a]/95 p-5">
                  <div className="flex flex-wrap gap-2">
                    <TagPill label={`Style: ${formatBadgeLabel(previewItem.style)}`} />
                    <TagPill label={`Aspect: ${formatBadgeLabel(previewItem.aspect_ratio)}`} />
                    <TagPill label={formatSourceLabel(previewItem.source)} />
                  </div>

                  <div className="mt-4 space-y-4">
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-[#6B7280]">
                        Prompt
                      </p>
                      <p className="mt-2 text-sm leading-6 text-white">{formatPromptSummary(previewItem)}</p>
                    </div>

                    {previewItem.input_prompt && (
                      <div>
                        <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-[#6B7280]">
                          Input prompt
                        </p>
                        <p className="mt-2 text-sm leading-6 text-[#D1D5DB]">{previewItem.input_prompt}</p>
                      </div>
                    )}

                    {previewItem.final_prompt && (
                      <div>
                        <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-[#6B7280]">
                          Final prompt
                        </p>
                        <p className="mt-2 rounded-2xl border border-white/10 bg-white/[0.03] p-3 text-sm leading-6 text-[#D1D5DB]">
                          {previewItem.final_prompt}
                        </p>
                      </div>
                    )}

                    <div className="grid gap-3 sm:grid-cols-2">
                      <InfoCard label="Model" value={previewItem.model || "Unknown"} />
                      <InfoCard label="Prompt model" value={previewItem.prompt_model || "Unknown"} />
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2">
                      <InfoCard label="Prompt enhanced" value={previewItem.prompt_enhanced ? "Yes" : "No"} />
                      <InfoCard label="Fallback used" value={previewItem.fallback_used ? "Yes" : "No"} />
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3 text-sm text-[#A1A8B3]">
                      Created at {formatDateTime(previewItem.created_at)}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function MetricCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon: ReactNode;
}) {
  return (
    <div className="flex items-center gap-3 rounded-3xl border border-white/10 bg-white/[0.03] p-3">
      <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-[#E11D2E]/20 bg-[#E11D2E]/10 text-[#E11D2E]">
        {icon}
      </div>
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-[#6B7280]">{label}</p>
        <p className="mt-1 text-sm font-semibold text-white">{value}</p>
      </div>
    </div>
  );
}

function TagPill({ label }: { label: string }) {
  return (
    <span className="inline-flex rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#A1A8B3]">
      {label}
    </span>
  );
}

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3">
      <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-[#6B7280]">{label}</p>
      <p className="mt-2 break-words text-sm text-white">{value}</p>
    </div>
  );
}
