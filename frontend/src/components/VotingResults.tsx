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
        <div className="flex items-center space-x-2">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as "name" | "vote")}
            className="bg-slate-600 text-white text-sm rounded px-2 py-1"
          >
            <option value="vote">Vote</option>
            <option value="name">Name</option>
          </select>
          <button
            type="button"
            onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
            className="bg-slate-600 text-white text-sm px-2 py-1 rounded"
          >
            {sortOrder === "asc" ? "Asc" : "Desc"}
          </button>
          <button
            type="button"
            onClick={() => setViewMode("list")}
            className={`px-2 py-1 text-sm rounded ${
              viewMode === "list"
                ? "bg-slate-500 text-white"
                : "bg-slate-600 text-white/60"
            }`}
          >
            List
          </button>
          <button
            type="button"
            onClick={() => setViewMode("grid")}
            className={`px-2 py-1 text-sm rounded ${
              viewMode === "grid"
                ? "bg-slate-500 text-white"
                : "bg-slate-600 text-white/60"
            }`}
          >
            Grid
          </button>
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
