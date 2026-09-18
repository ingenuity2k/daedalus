/**
 * System search — Spansh typeahead for finding systems.
 */
import { useState, useRef, useEffect, useCallback } from "react";
import { searchSystems, type SpanshSystemHit } from "../api/spansh";

interface Props {
  onSelect: (system: SpanshSystemHit) => void;
}

export default function SystemSearch({ onSelect }: Props) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SpanshSystemHit[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [highlightIndex, setHighlightIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  const doSearch = useCallback(async (q: string) => {
    if (q.length < 2) {
      setResults([]);
      setIsOpen(false);
      return;
    }
    setLoading(true);
    try {
      const hits = await searchSystems(q);
      setResults(hits.slice(0, 8));
      setIsOpen(hits.length > 0);
      setHighlightIndex(-1);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setQuery(val);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => doSearch(val), 300);
  };

  const handleSelect = (hit: SpanshSystemHit) => {
    setQuery(hit.name);
    setIsOpen(false);
    onSelect(hit);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightIndex(i => Math.min(i + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightIndex(i => Math.max(i - 1, 0));
    } else if (e.key === "Enter" && highlightIndex >= 0) {
      e.preventDefault();
      handleSelect(results[highlightIndex]);
    } else if (e.key === "Escape") {
      setIsOpen(false);
    }
  };

  // Close on click outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (inputRef.current && !inputRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div style={{ position: "relative", width: "100%", maxWidth: 400 }}>
      <input
        ref={inputRef}
        type="text"
        value={query}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onFocus={() => results.length > 0 && setIsOpen(true)}
        placeholder="Search system name..."
        style={{
          width: "100%",
          padding: "10px 14px",
          background: "#111827",
          border: "1px solid #333",
          borderRadius: 6,
          color: "#eee",
          fontSize: 14,
          fontFamily: "'Segoe UI', system-ui, sans-serif",
          outline: "none",
        }}
      />
      {loading && (
        <div style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", color: "#555", fontSize: 12 }}>
          ...
        </div>
      )}
      {isOpen && results.length > 0 && (
        <div style={{
          position: "absolute", top: "100%", left: 0, right: 0, zIndex: 20,
          background: "#1a1f2e", border: "1px solid #333", borderRadius: 6,
          marginTop: 4, overflow: "hidden",
        }}>
          {results.map((hit, i) => (
            <div
              key={hit.id64}
              onClick={() => handleSelect(hit)}
              style={{
                padding: "8px 14px",
                cursor: "pointer",
                background: i === highlightIndex ? "#252d40" : "transparent",
                color: "#ccc",
                fontSize: 13,
                borderBottom: i < results.length - 1 ? "1px solid #222" : "none",
              }}
              onMouseEnter={() => setHighlightIndex(i)}
            >
              {hit.name}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}