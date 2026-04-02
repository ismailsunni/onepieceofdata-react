// One Piece RAG Chat — Supabase Edge Function
// Uses Groq LLM with tool-calling + Supabase FTS for wiki search

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
}

const GROQ_API_KEY = Deno.env.get('GROQ_API_KEY')!
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

const SYSTEM_PROMPT = `You are a One Piece expert assistant with access to a comprehensive database and wiki.

You have 3 tools:
1. query_database — SQL queries for structured data (bounties, appearances, chapters, arcs, etc.)
2. search_wiki — full-text search over wiki articles for descriptions, abilities, backstory, etc.
3. get_character_profile — get a complete character profile (structured + wiki summary)

Guidelines:
- Use tools to find accurate information before answering
- For character questions, start with get_character_profile
- For "list" or "ranking" questions, use query_database with SQL
- For "explain" or "describe" questions, use search_wiki
- Be concise but thorough
- Data sourced from One Piece Wiki (CC-BY-SA)`

const TOOLS = [
  {
    type: 'function',
    function: {
      name: 'query_database',
      description:
        'Query the One Piece database via read-only SQL. Tables: character (id, name, bounty, age, status, origin, first_appearance, last_appearance, appearance_count), chapter (number, title, volume, num_page, date), arc (arc_id, title, start_chapter, end_chapter, saga_id), saga (saga_id, title, start_chapter, end_chapter), volume (number, title)',
      parameters: {
        type: 'object',
        properties: {
          sql: { type: 'string', description: 'PostgreSQL SELECT query' },
        },
        required: ['sql'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'search_wiki',
      description:
        'Search One Piece wiki articles for descriptions, abilities, backstories, relationships, plot details.',
      parameters: {
        type: 'object',
        properties: {
          query: { type: 'string', description: 'Search query' },
          limit: {
            type: 'integer',
            description: 'Number of results (default 5)',
          },
        },
        required: ['query'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_character_profile',
      description:
        'Get a complete character profile: structured data + wiki summary.',
      parameters: {
        type: 'object',
        properties: {
          name: { type: 'string', description: 'Character name' },
        },
        required: ['name'],
      },
    },
  },
]

// Tool handlers
async function queryDatabase(sql: string): Promise<string> {
  // Parse simple queries and execute via Supabase client
  // For safety, we support a subset: SELECT from known tables with filters
  const normalized = sql.trim().toLowerCase()
  if (!normalized.startsWith('select')) {
    return 'Error: Only SELECT queries are allowed.'
  }

  // Use Postgres function for read-only queries
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_readonly_sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: SUPABASE_SERVICE_ROLE_KEY,
        Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      },
      body: JSON.stringify({ query_text: sql }),
    })

    if (!res.ok) {
      // Fallback: try simple table query
      return await simpleQuery(sql)
    }
    const data = await res.json()
    if (!data || data.length === 0) return 'No results found.'
    return JSON.stringify(data.slice(0, 50), null, 2)
  } catch {
    return await simpleQuery(sql)
  }
}

async function simpleQuery(sql: string): Promise<string> {
  // Parse "SELECT ... FROM table WHERE ... LIMIT/ORDER BY ..." patterns
  const match = sql.match(/from\s+(\w+)/i)
  if (!match) return 'Error: Could not parse table name from query.'

  const table = match[1]
  const allowed = ['character', 'chapter', 'arc', 'saga', 'volume']
  if (!allowed.includes(table)) return `Error: Table '${table}' not accessible.`

  const limitMatch = sql.match(/limit\s+(\d+)/i)
  const limit = limitMatch ? Math.min(parseInt(limitMatch[1]), 50) : 50

  const orderMatch = sql.match(/order\s+by\s+(\w+)\s*(asc|desc)?/i)

  let query = supabase.from(table).select('*').limit(limit)

  if (orderMatch) {
    query = query.order(orderMatch[1], {
      ascending: orderMatch[2]?.toLowerCase() !== 'desc',
    })
  }

  const { data, error } = await query
  if (error) return `Error: ${error.message}`
  if (!data || data.length === 0) return 'No results found.'
  return JSON.stringify(data.slice(0, 50), null, 2)
}

async function searchWiki(query: string, limit = 5): Promise<string> {
  const { data, error } = await supabase.rpc('search_wiki_fts', {
    query_text: query,
    match_count: limit,
  })

  if (error) return `Search error: ${error.message}`
  if (!data || data.length === 0) return 'No wiki results found.'

  return data
    .map(
      (r: Record<string, unknown>, i: number) =>
        `[${i + 1}] ${r.title} :: ${r.section_name}\n${r.chunk_text?.slice(0, 500)}...`
    )
    .join('\n\n')
}

async function getCharacterProfile(name: string): Promise<string> {
  // Fuzzy search character
  const { data: chars, error: charErr } = await supabase
    .from('character')
    .select(
      'id, name, bounty, age, status, origin, first_appearance, last_appearance, appearance_count'
    )
    .ilike('name', `%${name}%`)
    .limit(3)

  if (charErr || !chars || chars.length === 0) {
    return `Character "${name}" not found in database.`
  }

  const char = chars[0]
  let result = `## ${char.name}\n`
  result += `- Status: ${char.status || 'Unknown'}\n`
  result += `- Bounty: ${char.bounty ? `₿${char.bounty.toLocaleString()}` : 'Unknown'}\n`
  result += `- Age: ${char.age || 'Unknown'}\n`
  result += `- Origin: ${char.origin || 'Unknown'}\n`
  result += `- First Appearance: Chapter ${char.first_appearance || '?'}\n`
  result += `- Total Appearances: ${char.appearance_count || '?'}\n`

  // Get wiki intro
  const { data: wiki } = await supabase
    .from('wiki_text')
    .select('intro_text')
    .eq('page_id', char.id)
    .single()

  if (wiki?.intro_text) {
    result += `\n### Wiki Summary\n${wiki.intro_text.slice(0, 1000)}`
  }

  return result
}

async function handleToolCall(
  name: string,
  args: Record<string, unknown>
): Promise<string> {
  switch (name) {
    case 'query_database':
      return await queryDatabase(args.sql)
    case 'search_wiki':
      return await searchWiki(args.query, args.limit || 5)
    case 'get_character_profile':
      return await getCharacterProfile(args.name)
    default:
      return `Unknown tool: ${name}`
  }
}

// Main handler
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Auth check: require valid JWT and ai_enabled flag
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Authentication required. Please sign in.' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const userClient = createClient(SUPABASE_URL, Deno.env.get('ANON_KEY') || Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: authHeader } },
    })
    const { data: { user }, error: authError } = await userClient.auth.getUser()
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid or expired session. Please sign in again.' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Check ai_enabled flag
    const { data: profile } = await supabase
      .from('profiles')
      .select('ai_enabled')
      .eq('id', user.id)
      .single()

    if (!profile?.ai_enabled) {
      return new Response(
        JSON.stringify({ error: 'AI chat is not enabled for your account. Contact the admin.' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { messages, model = 'llama-3.3-70b-versatile' } = await req.json()

    if (!messages || !Array.isArray(messages)) {
      return new Response(
        JSON.stringify({ error: 'messages array required' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Prepend system prompt
    const fullMessages = [
      { role: 'system', content: SYSTEM_PROMPT },
      ...messages,
    ]

    // Call Groq with tools
    let response = await fetch(
      'https://api.groq.com/openai/v1/chat/completions',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${GROQ_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model,
          messages: fullMessages,
          tools: TOOLS,
          tool_choice: 'auto',
          max_tokens: 2048,
        }),
      }
    )

    let result = await response.json()
    let message = result.choices?.[0]?.message

    // Handle tool calls (up to 5 rounds)
    let rounds = 0
    while (message?.tool_calls && rounds < 5) {
      fullMessages.push(message)

      for (const tc of message.tool_calls) {
        const args = JSON.parse(tc.function.arguments)
        const toolResult = await handleToolCall(tc.function.name, args)
        fullMessages.push({
          role: 'tool',
          tool_call_id: tc.id,
          content: toolResult,
        })
      }

      response = await fetch(
        'https://api.groq.com/openai/v1/chat/completions',
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${GROQ_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model,
            messages: fullMessages,
            tools: TOOLS,
            tool_choice: 'auto',
            max_tokens: 2048,
          }),
        }
      )

      result = await response.json()
      message = result.choices?.[0]?.message
      rounds++
    }

    const finalContent = message?.content
      || (result?.error?.message ? `Error: ${result.error.message}` : null)
      || "I couldn't generate a response. Please try again."

    return new Response(
      JSON.stringify({
        content: finalContent,
        tool_calls_count: rounds,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
