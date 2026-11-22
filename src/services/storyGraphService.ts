import { supabase } from './supabase'
import { logger } from '../utils/logger'
import { GraphEdge, GraphNode, StoryGraphData } from '../types/storyGraph'

/**
 * Supabase REST returns at most 1000 rows per request by default.
 * Page through results to fetch the full table.
 */
async function fetchAllRows<T>(
  table: string,
  select: string,
  pageSize = 1000
): Promise<T[]> {
  if (!supabase) {
    logger.error('Supabase client is not initialized')
    return []
  }
  const out: T[] = []
  let from = 0
  while (true) {
    const { data, error } = await supabase
      .from(table)
      .select(select)
      .range(from, from + pageSize - 1)
    if (error) {
      logger.error(`Error fetching ${table} (range ${from}):`, error)
      throw error
    }
    if (!data || data.length === 0) break
    out.push(...(data as unknown as T[]))
    if (data.length < pageSize) break
    from += pageSize
  }
  return out
}

/**
 * Fetch the full story graph (nodes + edges) from Supabase.
 *
 * ~1,919 nodes, ~19,320 edges. Total payload ~2 MB uncompressed, ~1.5 MB
 * gzipped. Cached by React Query for 10 minutes — filter operations run
 * client-side over the cached data, so filter changes are instant.
 */
export async function fetchStoryGraph(): Promise<StoryGraphData> {
  const [nodes, edges] = await Promise.all([
    fetchAllRows<GraphNode>(
      'graph_nodes',
      'id, type, canonical_name, aliases, source_table, source_id'
    ),
    fetchAllRows<GraphEdge>(
      'graph_edges',
      'id, subject_id, relation, object_id, evidence_chapter, evidence_text, confidence'
    ),
  ])
  return { nodes, edges }
}

export interface CharacterArcMembership {
  /** character.id → list of saga slugs (e.g. "east_blue") */
  sagas: Map<string, Set<string>>
  /** character.id → list of arc slugs (e.g. "romance_dawn") */
  arcs: Map<string, Set<string>>
}

interface CharacterMembershipRow {
  id: string
  saga_list: string[] | null
  arc_list: string[] | null
}

/**
 * Fetch saga and arc slug membership for every character.
 *
 * Used by the Story Graph saga/arc filter to restrict the visible character
 * set to those who appeared in a chosen saga or arc. Cached aggressively.
 */
export async function fetchCharacterArcMembership(): Promise<CharacterArcMembership> {
  const rows = await fetchAllRows<CharacterMembershipRow>(
    'character',
    'id, saga_list, arc_list'
  )
  const sagas = new Map<string, Set<string>>()
  const arcs = new Map<string, Set<string>>()
  for (const r of rows) {
    if (r.saga_list?.length) sagas.set(r.id, new Set(r.saga_list))
    if (r.arc_list?.length) arcs.set(r.id, new Set(r.arc_list))
  }
  return { sagas, arcs }
}

/**
 * One character's relationships: its edges at or above `minConfidence` and
 * the nodes on the other end (a few KB, versus ~1.5 MB for the full graph).
 */
export async function fetchCharacterSubgraph(
  characterId: string,
  minConfidence: number
): Promise<StoryGraphData> {
  const empty = { nodes: [], edges: [] }
  if (!supabase) return empty
  const nodeCols = 'id, type, canonical_name, source_id'
  const { data: node } = await supabase
    .from('graph_nodes')
    .select(nodeCols)
    .eq('type', 'character')
    .eq('source_id', characterId)
    .maybeSingle()
  if (!node) return empty
  const { data: edges, error } = await supabase
    .from('graph_edges')
    .select('id, subject_id, relation, object_id, confidence')
    .or(`subject_id.eq.${node.id},object_id.eq.${node.id}`)
    .gte('confidence', minConfidence)
  if (error) throw error
  const ids = [...new Set(edges.flatMap((e) => [e.subject_id, e.object_id]))]
  const { data: nodes, error: nodesError } = await supabase
    .from('graph_nodes')
    .select(nodeCols)
    .in('id', ids)
  if (nodesError) throw nodesError
  return { nodes: nodes as GraphNode[], edges: edges as GraphEdge[] }
}
