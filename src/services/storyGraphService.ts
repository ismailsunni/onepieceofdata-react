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
