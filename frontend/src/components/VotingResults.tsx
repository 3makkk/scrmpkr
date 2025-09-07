import { useMemo, useState } from "react";
import { useRoom } from "../hooks/useRoom";
import Card from "./Card";
import { useVotingStats } from "../hooks/useVotingStats";

export default function VotingResults() {
  const { revealed, roomState } = useRoom();
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");
  const [sortBy, setSortBy] = useState<"name" | "vote">("vote");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  const { average, hasConsensus, showMostCommon, mostCommon } =
    useVotingStats(revealed);

  const participants = roomState?.participants || [];

  const results = useMemo(() => {
    if (!revealed) return [];

    const mapped = revealed.map((r) => ({
      ...r,
      name: participants.find((p) => p.id === r.id)?.name || r.id,
    }));

    mapped.sort((a, b) => {
      if (sortBy === "name") {
        const nameComp = a.name.localeCompare(b.name);
        return sortOrder === "asc" ? nameComp : -nameComp;
      }

      const aVal = typeof a.value === "number" ? a.value : null;
      const bVal = typeof b.value === "number" ? b.value : null;
      if (aVal === null && bVal === null) return 0;
      if (aVal === null) return 1;
      if (bVal === null) return -1;
      return sortOrder === "asc" ? aVal - bVal : bVal - aVal;
    });

    return mapped;
  }, [revealed, participants, sortBy, sortOrder]);

  if (!revealed) return null;

  return (
    <Card className="animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-light text-white">Voting Results</h2>
        <div className="flex items-center gap-3">
          {/* Sort By segmented */}
          <div className="flex items-center bg-white/5 border border-white/10 rounded-lg p-1">
            <button
              type="button"
              aria-pressed={sortBy === "vote"}
              onClick={() => setSortBy("vote")}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md transition-colors ${
                sortBy === "vote"
                  ? "bg-slate-500/60 text-white shadow-sm"
                  : "text-white/70 hover:text-white hover:bg-white/5"
              }`}
              title="Sort by vote"
            >
              <SortNumericIcon className="w-4 h-4" />
              Vote
            </button>
            <button
              type="button"
              aria-pressed={sortBy === "name"}
              onClick={() => setSortBy("name")}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md transition-colors ${
                sortBy === "name"
                  ? "bg-slate-500/60 text-white shadow-sm"
                  : "text-white/70 hover:text-white hover:bg-white/5"
              }`}
              title="Sort by name"
            >
              <SortAlphaIcon className="w-4 h-4" />
              Name
            </button>
          </div>

          {/* Sort order toggle */}
          <button
            type="button"
            onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
            className="inline-flex items-center justify-center w-9 h-9 rounded-lg bg-white/5 border border-white/10 text-white/80 hover:text-white hover:bg-white/10 transition-colors"
            title={sortOrder === "asc" ? "Ascending" : "Descending"}
            aria-label="Toggle sort order"
          >
            {sortOrder === "asc" ? (
              <ArrowUpIcon className="w-4 h-4" />
            ) : (
              <ArrowDownIcon className="w-4 h-4" />
            )}
          </button>

          {/* View mode segmented */}
          <div className="flex items-center bg-white/5 border border-white/10 rounded-lg p-1">
            <button
              type="button"
              aria-pressed={viewMode === "list"}
              onClick={() => setViewMode("list")}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md transition-colors ${
                viewMode === "list"
                  ? "bg-slate-500/60 text-white shadow-sm"
                  : "text-white/70 hover:text-white hover:bg-white/5"
              }`}
              title="List view"
            >
              <ListIcon className="w-4 h-4" />
              List
            </button>
            <button
              type="button"
              aria-pressed={viewMode === "grid"}
              onClick={() => setViewMode("grid")}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md transition-colors ${
                viewMode === "grid"
                  ? "bg-slate-500/60 text-white shadow-sm"
                  : "text-white/70 hover:text-white hover:bg-white/5"
              }`}
              title="Grid view"
            >
              <GridIcon className="w-4 h-4" />
              Grid
            </button>
          </div>
        </div>
      </div>
      {viewMode === "list" ? (
        <div className="space-y-3">
          {results.map((r) => (
            <div
              key={r.id}
              className="flex items-center justify-between bg-slate-500/20 rounded-lg p-4"
            >
              <div className="text-white/80 text-sm">{r.name}</div>
              <div className="text-3xl font-bold text-white">{r.value}</div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {results.map((r) => (
            <div
              key={r.id}
              className="bg-slate-500/20 rounded-lg p-4 text-center transition-all duration-300 hover:bg-slate-500/30"
            >
              <div className="text-white/80 text-sm mb-2">{r.name}</div>
              <div className="text-3xl font-bold text-white">{r.value}</div>
            </div>
          ))}
        </div>
      )}

      {/* Statistics */}
      <div className="mt-6 pt-6 border-t border-slate-500/30">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-slate-300 text-sm font-light">Average</div>
            <div className="text-lg font-medium text-white">{average}</div>
          </div>
          {showMostCommon && (
            <div>
              <div className="text-slate-300 text-sm font-light">
                Most Common
              </div>
              <div className="text-lg font-medium text-white">{mostCommon}</div>
            </div>
          )}
          <div>
            <div className="text-slate-300 text-sm font-light">Consensus</div>
            <div className="text-lg font-medium text-white">
              {hasConsensus ? "Yes" : "No"}
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}

function ArrowUpIcon({ className = "" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 19V5" />
      <path d="M5 12l7-7 7 7" />
    </svg>
  );
}

function ArrowDownIcon({ className = "" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 5v14" />
      <path d="M19 12l-7 7-7-7" />
    </svg>
  );
}

function ListIcon({ className = "" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M8 6h13" />
      <path d="M8 12h13" />
      <path d="M8 18h13" />
      <circle cx="3" cy="6" r="1" />
      <circle cx="3" cy="12" r="1" />
      <circle cx="3" cy="18" r="1" />
    </svg>
  );
}

function GridIcon({ className = "" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
    </svg>
  );
}

function SortNumericIcon({ className = "" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M10 6h11" />
      <path d="M10 12h11" />
      <path d="M10 18h11" />
      <path d="M3 17V7l3 3" />
    </svg>
  );
}

function SortAlphaIcon({ className = "" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M4 18h8" />
      <path d="M8 6l-4 10" />
      <path d="M8 6l4 10" />
      <path d="M17 6h4" />
      <path d="M19 6v12" />
    </svg>
  );
}
