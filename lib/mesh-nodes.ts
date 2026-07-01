import { Frequency } from "@/lib/types";
import { MeshNodeId } from "@/lib/channels/tags";

export interface MeshNodeScan {
  id: MeshNodeId;
  label: string;
  count: number;
  progress: number;
  active: boolean;
}

export interface MeshScanState {
  nodes: MeshNodeScan[];
  totalFound: number;
  activeNode: MeshNodeId;
  scanProgress: number;
}

const NODE_LABELS: Record<MeshNodeId, string> = {
  plex: "PLEX",
  echo: "ECHO",
  void: "VOID",
  soft: "SOFT",
  dark: "DARK"
};

function hash(input: string) {
  let value = 0;
  for (let i = 0; i < input.length; i += 1) {
    value = (value << 5) - value + input.charCodeAt(i);
    value |= 0;
  }
  return Math.abs(value);
}

export function computeMeshScan(frequency: Frequency, elapsedSeconds: number): MeshScanState {
  const seed = hash(`${frequency.id}:${frequency.number}:${elapsedSeconds}`);
  const activeNode = (frequency.meshNode ?? ["plex", "echo", "void", "soft", "dark"][seed % 5]) as MeshNodeId;
  const nodeIds: MeshNodeId[] = ["plex", "echo", "void", "soft", "dark"];

  const nodes = nodeIds.map((id, index) => {
    const base = 80 + ((seed >> (index * 4)) % 620);
    const growth = Math.min(1, elapsedSeconds / 24);
    const count = Math.floor(base + growth * (180 + ((seed >> index) % 140)));
    const progress =
      id === activeNode
        ? Math.min(100, 18 + elapsedSeconds * 7 + (seed % 11))
        : Math.min(92, 8 + ((seed >> (index + 2)) % 70) + growth * 20);

    return {
      id,
      label: NODE_LABELS[id],
      count,
      progress,
      active: id === activeNode
    };
  });

  const totalFound = nodes.reduce((sum, node) => sum + node.count, 0);
  const scanProgress = Math.min(99, Math.round(34 + elapsedSeconds * 4.5 + (seed % 17)));

  return {
    nodes,
    totalFound,
    activeNode,
    scanProgress
  };
}
