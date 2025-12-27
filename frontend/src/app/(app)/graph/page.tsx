"use client";

import { useCallback, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ReactFlow,
  Node,
  Edge,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  ConnectionMode,
  Panel,
  type NodeTypes,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { FileText, Loader2, Network, RefreshCw } from "lucide-react";
import { useNotes } from "@/lib/queries";
import { useNotesStore } from "@/lib/stores";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Note } from "@/lib/api";

// Custom node component for notes
function NoteNode({ data }: { data: { label: string; note: Note } }) {
  const hasLinks = data.note.forward_links.length > 0 || data.note.backlinks.length > 0;

  return (
    <div
      className={cn(
        "px-4 py-2 rounded-lg border-2 bg-background shadow-sm transition-all",
        "hover:shadow-md hover:border-primary/50 cursor-pointer",
        hasLinks ? "border-primary/30" : "border-border",
        data.note.is_pinned && "ring-2 ring-yellow-500/50"
      )}
    >
      <div className="flex items-center gap-2">
        <FileText className={cn(
          "h-4 w-4",
          hasLinks ? "text-primary" : "text-muted-foreground"
        )} />
        <span className="text-sm font-medium max-w-[150px] truncate">
          {data.label || "Untitled"}
        </span>
      </div>
      {data.note.tags.length > 0 && (
        <div className="mt-1 flex gap-1 flex-wrap">
          {data.note.tags.slice(0, 2).map((tag) => (
            <span
              key={tag}
              className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground"
            >
              {tag}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

const nodeTypes: NodeTypes = {
  note: NoteNode,
};

// Force-directed layout simulation
function calculateLayout(notes: Note[]): { nodes: Node[]; edges: Edge[] } {
  const nodes: Node[] = [];
  const edges: Edge[] = [];
  const noteMap = new Map(notes.map((n) => [n.id, n]));

  // Create a map of connections for layout weight
  const connectionCount = new Map<string, number>();
  notes.forEach((note) => {
    const count = note.forward_links.length + note.backlinks.length;
    connectionCount.set(note.id, count);
  });

  // Sort by connection count (most connected in center)
  const sortedNotes = [...notes].sort(
    (a, b) => (connectionCount.get(b.id) || 0) - (connectionCount.get(a.id) || 0)
  );

  // Calculate positions using circular layout with connected nodes closer
  const totalNotes = sortedNotes.length;
  const centerX = 400;
  const centerY = 300;

  sortedNotes.forEach((note, index) => {
    const connections = connectionCount.get(note.id) || 0;
    // More connections = closer to center
    const radius = connections > 0
      ? 150 + (150 * (1 - connections / Math.max(...connectionCount.values(), 1)))
      : 300 + Math.random() * 100;

    const angle = (2 * Math.PI * index) / totalNotes;
    const x = centerX + radius * Math.cos(angle);
    const y = centerY + radius * Math.sin(angle);

    nodes.push({
      id: note.id,
      type: "note",
      position: { x, y },
      data: { label: note.title, note },
    });
  });

  // Create edges from forward_links
  const edgeSet = new Set<string>();
  notes.forEach((note) => {
    note.forward_links.forEach((link) => {
      if (noteMap.has(link.id)) {
        // Create unique edge id (avoid duplicates for bidirectional links)
        const edgeId = [note.id, link.id].sort().join("-");
        if (!edgeSet.has(edgeId)) {
          edgeSet.add(edgeId);
          edges.push({
            id: edgeId,
            source: note.id,
            target: link.id,
            animated: false,
            style: { stroke: "hsl(var(--primary))", strokeWidth: 2, opacity: 0.5 },
          });
        }
      }
    });
  });

  return { nodes, edges };
}

export default function GraphPage() {
  const router = useRouter();
  const { setSelectedNoteId } = useNotesStore();
  const { data: notesData, isLoading, refetch, isRefetching } = useNotes({ page_size: 100 });

  const notes = notesData?.items || [];

  // Calculate layout when notes change
  const { initialNodes, initialEdges, stats } = useMemo(() => {
    if (notes.length === 0) {
      return { initialNodes: [], initialEdges: [], stats: { total: 0, linked: 0, connections: 0 } };
    }

    const { nodes, edges } = calculateLayout(notes);
    const linkedNotes = notes.filter(
      (n) => n.forward_links.length > 0 || n.backlinks.length > 0
    ).length;

    return {
      initialNodes: nodes,
      initialEdges: edges,
      stats: {
        total: notes.length,
        linked: linkedNotes,
        connections: edges.length,
      },
    };
  }, [notes]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  // Update nodes when data changes
  useMemo(() => {
    setNodes(initialNodes);
    setEdges(initialEdges);
  }, [initialNodes, initialEdges, setNodes, setEdges]);

  const onNodeClick = useCallback(
    (_: React.MouseEvent, node: Node) => {
      setSelectedNoteId(node.id);
      router.push("/notes");
    },
    [router, setSelectedNoteId]
  );

  if (isLoading) {
    return (
      <div className="h-full flex flex-col items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        <p className="mt-4 text-muted-foreground">Loading knowledge graph...</p>
      </div>
    );
  }

  if (notes.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center bg-muted/20">
        <div className="flex flex-col items-center gap-4 text-center p-8">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <Network className="h-8 w-8" />
          </div>
          <h1 className="text-2xl font-semibold">Knowledge Graph</h1>
          <p className="text-muted-foreground max-w-md">
            Your knowledge graph is empty. Create some notes and link them
            together using [[wikilinks]] to see your ideas visualized.
          </p>
          <Button onClick={() => router.push("/notes")}>
            Create Your First Note
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full w-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={onNodeClick}
        nodeTypes={nodeTypes}
        connectionMode={ConnectionMode.Loose}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        minZoom={0.1}
        maxZoom={2}
        attributionPosition="bottom-left"
      >
        <Background color="hsl(var(--muted-foreground))" gap={20} size={1} />
        <Controls />
        <MiniMap
          nodeColor={(node) => {
            const note = (node.data as { note: Note }).note;
            return note.forward_links.length > 0 || note.backlinks.length > 0
              ? "hsl(var(--primary))"
              : "hsl(var(--muted-foreground))";
          }}
          maskColor="hsl(var(--background) / 0.8)"
        />

        {/* Stats Panel */}
        <Panel position="top-left" className="bg-background/95 backdrop-blur rounded-lg border p-4 shadow-lg">
          <div className="flex items-center gap-2 mb-3">
            <Network className="h-5 w-5 text-primary" />
            <h2 className="font-semibold">Knowledge Graph</h2>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 ml-auto"
              onClick={() => refetch()}
              disabled={isRefetching}
            >
              <RefreshCw className={cn("h-4 w-4", isRefetching && "animate-spin")} />
            </Button>
          </div>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-primary">{stats.total}</p>
              <p className="text-xs text-muted-foreground">Notes</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-primary">{stats.linked}</p>
              <p className="text-xs text-muted-foreground">Linked</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-primary">{stats.connections}</p>
              <p className="text-xs text-muted-foreground">Connections</p>
            </div>
          </div>
        </Panel>

        {/* Legend */}
        <Panel position="bottom-right" className="bg-background/95 backdrop-blur rounded-lg border p-3 shadow-lg">
          <p className="text-xs font-medium mb-2">Legend</p>
          <div className="space-y-1.5 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded border-2 border-primary/30 bg-background" />
              <span className="text-muted-foreground">Linked note</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded border-2 border-border bg-background" />
              <span className="text-muted-foreground">Unlinked note</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-0.5 bg-primary/50" />
              <span className="text-muted-foreground">Connection</span>
            </div>
          </div>
        </Panel>
      </ReactFlow>
    </div>
  );
}
