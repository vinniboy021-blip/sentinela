'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';

interface NodeData {
  id: string;
  label: string;
  type: string;
}

interface EdgeData {
  id: string;
  source: string;
  target: string;
  label: string;
  confidence: number;
  status: string;
}

interface GraphNode {
  data: NodeData;
}

interface GraphEdge {
  data: EdgeData;
}

type PositionMap = Record<string, { x: number; y: number }>;

const COLS = 6;
const COL_WIDTH = 180;
const ROW_HEIGHT = 100;
const PADDING = 80;

export default function Graph() {
  const [nodes, setNodes] = useState<GraphNode[]>([]);
  const [edges, setEdges] = useState<GraphEdge[]>([]);
  const [investigation, setInvestigation] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!investigation) return;
    setError('');
    setLoading(true);

    fetch(
      `/api/v1/graph?investigation_id=${encodeURIComponent(investigation)}&node_limit=100&edge_limit=250`,
      { credentials: 'include' }
    )
      .then(async (r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((x) => {
        setNodes(x.nodes ?? []);
        setEdges(x.edges ?? []);
      })
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, [investigation]);

  const positions: PositionMap = useMemo(
    () =>
      Object.fromEntries(
        nodes.map((n, i) => [
          n.data.id,
          {
            x: PADDING + (i % COLS) * COL_WIDTH,
            y: PADDING + Math.floor(i / COLS) * ROW_HEIGHT,
          },
        ])
      ),
    [nodes]
  );

  const svgHeight = Math.max(400, Math.ceil(nodes.length / COLS) * ROW_HEIGHT + PADDING * 2);

  function exportJson() {
    const blob = new Blob([JSON.stringify({ nodes, edges }, null, 2)], {
      type: 'application/json',
    });
    const anchor = document.createElement('a');
    anchor.href = URL.createObjectURL(blob);
    anchor.download = 'osint-graph.json';
    anchor.click();
    URL.revokeObjectURL(anchor.href);
  }

  return (
    <div className="shell">
      <aside className="side">
        <Link href="/dashboard">← Dashboard</Link>
      </aside>
      <main className="main">
        <h1>Grafo de correlações</h1>
        <p className="muted">Mostra somente relações persistidas e revisadas.</p>

        <div className="card">
          <label>
            ID da investigação
            <br />
            <input
              value={investigation}
              onChange={(e) => setInvestigation(e.target.value)}
              placeholder="Cole o ID da investigação"
            />
          </label>
          <button onClick={exportJson} disabled={nodes.length === 0}>
            Exportar JSON
          </button>
          {loading && <p className="muted">Carregando…</p>}
          {error && <p role="alert" className="error">{error}</p>}
        </div>

        <div className="card" style={{ overflow: 'auto' }}>
          <svg
            width="1100"
            height={svgHeight}
            role="img"
            aria-label="Grafo de entidades e relações"
          >
            {edges.map((e) => {
              const a = positions[e.data.source];
              const b = positions[e.data.target];
              if (!a || !b) return null;
              return (
                <g key={e.data.id}>
                  <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke="#64748b" />
                  <text
                    x={(a.x + b.x) / 2}
                    y={(a.y + b.y) / 2}
                    fill="#94a3b8"
                    fontSize="10"
                  >
                    {e.data.status}
                  </text>
                </g>
              );
            })}
            {nodes.map((n) => {
              const p = positions[n.data.id];
              if (!p) return null;
              return (
                <g key={n.data.id}>
                  <circle cx={p.x} cy={p.y} r="24" fill="#2563eb" />
                  <text
                    x={p.x}
                    y={p.y + 42}
                    textAnchor="middle"
                    fill="#e2e8f0"
                    fontSize="11"
                  >
                    {(n.data.label || n.data.id).slice(0, 24)}
                  </text>
                </g>
              );
            })}
          </svg>
          {nodes.length === 0 && !loading && (
            <p className="muted">Informe uma investigação para carregar relações reais.</p>
          )}
        </div>
      </main>
    </div>
  );
}
