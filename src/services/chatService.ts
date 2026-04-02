export async function sendChatMessage(
  messages: Array<{ role: string; content: string }>,
  accessToken: string
): Promise<{ content: string; error?: string }> {
  const response = await fetch(
    'https://zjmmwsyawbhbxshlapvi.supabase.co/functions/v1/chat',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ messages }),
    }
  )
  const data = await response.json()
  if (!response.ok) {
    return { content: '', error: data.error || 'Request failed' }
  }
  return { content: data.content }
}
