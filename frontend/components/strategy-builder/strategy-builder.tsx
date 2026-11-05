"use client";

import {
  addEdge,
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
  ReactFlow,
  ReactFlowProvider,
  reconnectEdge,
  useEdgesState,
  useNodesState,
  useReactFlow,
  type Connection,
  type Edge,
  type XYPosition,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { CheckCircle2, Trash2, X } from "lucide-react";
import Link from "next/link";
import { useCallback, useRef, useState, type DragEvent, type KeyboardEvent } from "react";
import { buttonClass } from "@/components/ui";
import { createStrategy } from "@/lib/strategies";
import { inputClass, MetadataFields, NodeConfig } from "./config-panel";
import { LIBRARY, NODE_META, nodeTypes, type LibraryItem } from "./nodes";
import { canConnect, emptyMetadata, reaches, validateStrategy, type MetadataForm, type SaveStatus, type StrategyNode } from "./schema";

const DRAG_TYPE = "application/stratpool-node";
const libraryItems = LIBRARY.flatMap((group) => group.items);
const deleteKeys = ["Backspace", "Delete"];

type SavedStrategy = { name: string; status: SaveStatus };

function NodeLibrary({ onAdd }: { onAdd: (item: LibraryItem) => void }) {
  return (
    <aside className="flex-none border-b p-3 xl:w-48 xl:overflow-y-auto xl:border-r xl:border-b-0" aria-label="Node library">
      <div className="grid grid-cols-2 gap-x-3 gap-y-4 sm:grid-cols-5 xl:grid-cols-1">
        {LIBRARY.map(({ category, items }) => (
          <div key={category}>
            <h2 className="mb-1.5 text-xs text-subtle">{category}</h2>
            <div className="grid gap-1.5">
              {items.map((item) => {
                const { icon: ItemIcon } = NODE_META[item.template.type];
                return (
                  // A div, not a button: Firefox doesn't reliably start drags from buttons.
                  <div
                    key={item.key}
                    className="flex cursor-grab items-center gap-2 rounded-lg border bg-surface px-2.5 py-1.5 text-sm transition-colors hover:bg-surface-2 active:cursor-grabbing"
                    role="button"
                    tabIndex={0}
                    draggable
                    title="Drag onto the canvas, or click to add"
                    onDragStart={(e) => e.dataTransfer.setData(DRAG_TYPE, item.key)}
                    onClick={() => onAdd(item)}
                    onKeyDown={(e: KeyboardEvent) => {
                      if (e.key !== "Enter" && e.key !== " ") return;
                      e.preventDefault();
                      onAdd(item);
                    }}
                  >
                    <ItemIcon className="size-4 text-subtle" aria-hidden />
                    {item.label}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </aside>
  );
}

function Builder({ onSaved }: { onSaved: (saved: SavedStrategy) => void }) {
  const [nodes, setNodes, onNodesChange] = useNodesState<StrategyNode>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const [metadata, setMetadata] = useState<MetadataForm>(emptyMetadata);
  const [errors, setErrors] = useState<string[]>([]);
  const [saving, setSaving] = useState<SaveStatus | null>(null);
  const { screenToFlowPosition, getNode, getEdges, updateNodeData, deleteElements } = useReactFlow<StrategyNode, Edge>();
  const canvas = useRef<HTMLDivElement>(null);
  const counts = useRef<Record<string, number>>({});

  const nextId = (prefix: string) => {
    counts.current[prefix] = (counts.current[prefix] ?? 0) + 1;
    return `${prefix}_${counts.current[prefix]}`;
  };

  const addNode = (item: LibraryItem, position: XYPosition) => {
    const node = { id: nextId(item.key), position, ...item.template } as StrategyNode;
    setNodes((current) => [...current, node]);
  };

  // Click and keyboard add, for touch screens and anyone who can't drag. Nodes cascade so each label stays readable.
  const addToCanvas = (item: LibraryItem) => {
    const rect = canvas.current?.getBoundingClientRect();
    if (!rect) return;
    const step = nodes.length % 6;
    addNode(item, screenToFlowPosition({ x: rect.left + 24 + step * 32, y: rect.top + 24 + step * 72 }));
  };

  const onDrop = (e: DragEvent) => {
    e.preventDefault();
    const item = libraryItems.find((i) => i.key === e.dataTransfer.getData(DRAG_TYPE));
    if (item) addNode(item, screenToFlowPosition({ x: e.clientX, y: e.clientY }));
  };

  const isValidConnection = useCallback(
    ({ source, target, targetHandle }: Connection | Edge) => {
      const from = getNode(source);
      const to = getNode(target);
      if (!from || !to || !canConnect(from.type, to.type)) return false;

      const current = getEdges();
      if (reaches(current, target, source)) return false;
      // Each condition input takes one indicator, and A and B must differ.
      return to.type !== "condition" || !current.some((e) => e.target === target && (e.targetHandle === targetHandle || e.source === source));
    },
    [getNode, getEdges],
  );

  const onConnect = (connection: Connection) => setEdges((current) => addEdge({ ...connection, id: nextId("edge") }, current));
  const onReconnect = (oldEdge: Edge, connection: Connection) =>
    setEdges((current) => reconnectEdge(oldEdge, connection, current, { shouldReplaceId: false }));

  const save = async (status: SaveStatus) => {
    const result = validateStrategy({ ...metadata, status }, nodes, edges);
    if (!result.ok) return setErrors(result.errors);

    setErrors([]);
    setSaving(status);
    try {
      await createStrategy(result.payload);
      onSaved({ name: result.payload.name, status });
    } catch (e) {
      setErrors([e instanceof Error ? e.message : "Failed to create strategy"]);
      setSaving(null);
    }
  };

  const updateSelectedNode = (id: string, patch: Record<string, unknown>) => {
    updateNodeData(id, patch);
    // Input B disappears for a fixed value, so its connection goes with it.
    if (patch.referenceType === "VALUE") setEdges((current) => current.filter((e) => e.target !== id || e.targetHandle !== "compare"));
  };

  const clearSelection = () => {
    setNodes((current) => current.map((n) => ({ ...n, selected: false })));
    setEdges((current) => current.map((e) => ({ ...e, selected: false })));
  };

  const selectedNode = nodes.find((n) => n.selected);
  const selectedEdge = edges.find((e) => e.selected);

  return (
    <div className="flex flex-col xl:h-[calc(100svh-65px)]">
      <div className="flex flex-wrap items-center gap-2 border-b p-3">
        <input
          className={`${inputClass} min-w-48 flex-1 xl:max-w-md`}
          aria-label="Strategy name"
          placeholder="Strategy name"
          value={metadata.name}
          onChange={(e) => setMetadata((m) => ({ ...m, name: e.target.value }))}
        />
        <div className="ml-auto flex gap-2">
          <button className={`${buttonClass("secondary")} disabled:opacity-60`} type="button" disabled={!!saving} onClick={() => save("DRAFT")}>
            {saving === "DRAFT" ? "Saving…" : "Save as Draft"}
          </button>
          <button className={`${buttonClass()} disabled:opacity-60`} type="button" disabled={!!saving} onClick={() => save("PUBLISHED")}>
            {saving === "PUBLISHED" ? "Publishing…" : "Publish"}
          </button>
        </div>
      </div>

      {errors.length > 0 && (
        <div className="flex max-h-40 flex-none items-start gap-2 overflow-y-auto border-b bg-surface-2 px-4 py-3 text-sm text-red-500" role="alert">
          <ul className="flex-1 list-disc pl-4">
            {errors.map((error) => (
              <li key={error}>{error}</li>
            ))}
          </ul>
          <button className="flex-none text-muted" type="button" aria-label="Dismiss errors" onClick={() => setErrors([])}>
            <X className="size-4" aria-hidden />
          </button>
        </div>
      )}

      <div className="flex min-h-0 flex-1 flex-col xl:flex-row">
        <NodeLibrary onAdd={addToCanvas} />

        <div className="relative h-[60svh] min-w-0 flex-none xl:h-auto xl:flex-1" ref={canvas} onDragOver={(e) => e.preventDefault()} onDrop={onDrop}>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            nodeTypes={nodeTypes}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onReconnect={onReconnect}
            isValidConnection={isValidConnection}
            deleteKeyCode={deleteKeys}
          >
            <Background variant={BackgroundVariant.Lines} gap={32} />
            <Controls />
            <MiniMap pannable zoomable style={{ width: 120, height: 90 }} />
          </ReactFlow>
          {nodes.length === 0 && (
            <p className="pointer-events-none absolute inset-0 grid place-items-center p-6 text-center text-sm text-subtle">
              Drag nodes here to build your flow: Trigger, Indicator, Condition, Logic (optional), Action
            </p>
          )}
        </div>

        <aside className="flex-none border-t p-4 xl:w-80 xl:overflow-y-auto xl:border-t-0 xl:border-l" aria-label="Configuration">
          {selectedNode ? (
            <div className="grid gap-3">
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <h2 className="text-sm">{NODE_META[selectedNode.type].label}</h2>
                  <p className="truncate text-xs text-subtle">{selectedNode.id}</p>
                </div>
                <button className={buttonClass("secondary", "sm")} type="button" onClick={clearSelection}>
                  Strategy details
                </button>
              </div>
              <NodeConfig node={selectedNode} onChange={(patch) => updateSelectedNode(selectedNode.id, patch)} />
              <button
                className={`${buttonClass("secondary", "sm")} justify-self-start`}
                type="button"
                onClick={() => deleteElements({ nodes: [{ id: selectedNode.id }] })}
              >
                <Trash2 className="size-3.5" aria-hidden /> Delete node
              </button>
            </div>
          ) : selectedEdge ? (
            <div className="grid gap-3">
              <h2 className="text-sm">Connection</h2>
              <p className="text-sm break-words text-subtle">
                {selectedEdge.source} to {selectedEdge.target}
              </p>
              <button
                className={`${buttonClass("secondary", "sm")} justify-self-start`}
                type="button"
                onClick={() => deleteElements({ edges: [{ id: selectedEdge.id }] })}
              >
                <Trash2 className="size-3.5" aria-hidden /> Delete connection
              </button>
            </div>
          ) : (
            <div className="grid gap-3">
              <div>
                <h2 className="text-sm">Strategy details</h2>
                <p className="text-xs text-subtle">Select a node on the canvas to configure it.</p>
              </div>
              <MetadataFields value={metadata} onChange={(patch) => setMetadata((m) => ({ ...m, ...patch }))} />
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}

export function StrategyBuilder() {
  const [saved, setSaved] = useState<SavedStrategy | null>(null);

  // Leaving the builder after a save stops a second click from creating a duplicate.
  if (saved) {
    return (
      <div className="grid min-h-[calc(100svh-65px)] place-items-center p-6 text-center" role="status">
        <div>
          <CheckCircle2 className="mx-auto size-8 text-accent" aria-hidden />
          <h1 className="mt-3 text-[24px] tracking-[-.02em] break-words">
            {saved.name} {saved.status === "PUBLISHED" ? "published" : "saved as a draft"}
          </h1>
          <div className="mt-5 flex flex-wrap justify-center gap-2">
            <Link className={buttonClass()} href="/strategies/my">
              View my strategies
            </Link>
            <button className={buttonClass("secondary")} type="button" onClick={() => setSaved(null)}>
              Create another
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <ReactFlowProvider>
      <Builder onSaved={setSaved} />
    </ReactFlowProvider>
  );
}
