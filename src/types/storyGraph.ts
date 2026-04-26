/**
 * Types for the story graph feature.
 *
 * Mirrors the `graph_nodes` and `graph_edges` tables in Supabase, populated
 * by the Python pipeline's LLM-based relation extraction (Claude Sonnet 4.6).
 * See plan-story-graph.md in the data repo for the build pipeline.
 */

export interface GraphNode {
  id: number
  type: string // 'character' | 'crew' | 'organization' | 'saga' | 'arc' | ...
  canonical_name: string
  aliases?: string[] | null
  source_table?: string | null
  source_id?: string | null
}

export interface GraphEdge {
  id: number
  subject_id: number
  relation: string
  object_id: number
  evidence_chapter?: number | null
  evidence_text?: string | null
  confidence: number
  source_extraction_id?: number | null
}

export interface StoryGraphData {
  nodes: GraphNode[]
  edges: GraphEdge[]
}
