import type { StrategyGraph, StrategyNode } from "../../types.js";

export function parseStrategyGraph(graph: StrategyGraph): StrategyNode[] {
  const nodeMap = new Map(graph.nodes.map((node) => [node.id, node]));

  if (nodeMap.size !== graph.nodes.length) {
    throw new Error("Duplicate node IDs");
  }

  const adjacency = new Map<string, string[]>();
  const inDegree = new Map<string, number>();

  for (const node of graph.nodes) {
    adjacency.set(node.id, []);
    inDegree.set(node.id, 0);
  }

  for (const edge of graph.edges) {
    if (!nodeMap.has(edge.source) || !nodeMap.has(edge.target)) {
      throw new Error(`Invalid edge: ${edge.id}`);
    }

    adjacency.get(edge.source)!.push(edge.target);

    inDegree.set(edge.target, inDegree.get(edge.target)! + 1);
  }

  const queue = graph.nodes
    .filter((node) => inDegree.get(node.id) === 0)
    .map((node) => node.id);

  const orderedNodes: StrategyNode[] = [];

  while (queue.length > 0) {
    const id = queue.shift()!;
    orderedNodes.push(nodeMap.get(id)!);

    for (const neighbor of adjacency.get(id)!) {
      const degree = inDegree.get(neighbor)! - 1;
      inDegree.set(neighbor, degree);

      if (degree === 0) {
        queue.push(neighbor);
      }
    }
  }

  if (orderedNodes.length !== graph.nodes.length) {
    throw new Error("Cycle detected in strategy graph");
  }

  return orderedNodes;
}
