import { useState, useRef, useEffect } from 'react'
import Markdown from 'react-markdown'
import { useAuth } from '../contexts/AuthContext'
import { sendChatMessage } from '../services/chatService'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

function ChatPage() {
  const { user, session, profile, loading, signIn } = useAuth()
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = async () => {
    const text = input.trim()
    if (!text || sending || !session) return

    const userMsg: Message = { role: 'user', content: text }
    const updated = [...messages, userMsg]
    setMessages(updated)
    setInput('')
    setSending(true)

    const result = await sendChatMessage(
      updated.map((m) => ({ role: m.role, content: m.content })),
      session.access_token
    )

    if (result.error) {
      setMessages([
        ...updated,
        { role: 'assistant', content: `Error: ${result.error}` },
      ])
    } else {
      setMessages([...updated, { role: 'assistant', content: result.content }])
    }
    setSending(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const resetConversation = () => {
    setMessages([])
    setInput('')
    inputRef.current?.focus()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600" />
      </div>
    )
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="bg-white border border-gray-200 rounded-xl p-8 max-w-md text-center shadow-sm">
          <div className="text-4xl mb-4">🔐</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">AI Chat</h1>
          <p className="text-gray-600 mb-4">
            This feature is available for registered users only.
          </p>
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-left mb-4">
            <p className="text-sm font-semibold text-amber-800 mb-2">
              How to get access:
            </p>
            <ol className="text-sm text-amber-700 space-y-1 list-decimal list-inside">
              <li>Register with your Google account</li>
              <li>Wait for admin approval</li>
              <li>You will be notified once approved</li>
            </ol>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 justify-center mb-4">
            <button
              onClick={signIn}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                />
                <path
                  fill="currentColor"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="currentColor"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="currentColor"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Sign in / Register with Google
            </button>
          </div>
          <p className="text-xs text-gray-400">
            Access is limited to ensure quality of the AI responses.
          </p>
        </div>
      </div>
    )
  }

  if (!profile?.ai_enabled) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="bg-white border border-gray-200 rounded-xl p-8 max-w-md text-center">
          <div className="text-4xl mb-4">🔒</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            AI Chat Not Enabled
          </h1>
          <p className="text-gray-600">
            AI chat is not enabled for your account. Contact the administrator
            to request access.
          </p>
        </div>
      </div>
    )
  }

  const avatarUrl = user.user_metadata?.avatar_url

  return (
    <div className="flex flex-col h-full">
      {/* Chat header — sticky within the chat area */}
      <div className="bg-white border-b border-gray-200 px-4 py-2 shrink-0">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-lg">🏴☠️</span>
            <h1 className="text-base font-semibold text-gray-900">AI Chat</h1>
          </div>
          <button
            onClick={resetConversation}
            className="text-xs text-gray-500 hover:text-gray-900 px-2 py-1 rounded hover:bg-gray-100 transition-colors"
          >
            New conversation
          </button>
        </div>
      </div>

      {/* Messages — only this scrolls */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        <div className="max-w-3xl mx-auto space-y-3">
          {messages.length === 0 && (
            <div className="text-center text-gray-500 py-12">
              <div className="text-3xl mb-2">🏴☠️</div>
              <p className="text-base font-medium text-gray-700 mb-1">
                Ask me anything about One Piece!
              </p>
              <p className="text-xs text-gray-400">
                Characters, arcs, devil fruits, bounties, and more.
              </p>
            </div>
          )}

          {messages.map((msg, i) => (
            <div
              key={i}
              className={`flex items-start gap-2 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
            >
              {msg.role === 'assistant' ? (
                <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center shrink-0 text-xs">
                  🏴☠️
                </div>
              ) : avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt="You"
                  className="w-7 h-7 rounded-full shrink-0"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center shrink-0 text-white text-xs font-medium">
                  {user.email?.[0]?.toUpperCase() || 'U'}
                </div>
              )}

              <div
                className={`rounded-xl px-3 py-2 max-w-[80%] whitespace-pre-wrap text-sm leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white border border-gray-200 text-gray-800'
                }`}
              >
                {msg.role === 'assistant' ? (
                  <Markdown
                    components={{
                      h1: ({ children }) => (
                        <h1 className="text-lg font-bold mt-3 mb-1">
                          {children}
                        </h1>
                      ),
                      h2: ({ children }) => (
                        <h2 className="text-base font-bold mt-3 mb-1">
                          {children}
                        </h2>
                      ),
                      h3: ({ children }) => (
                        <h3 className="text-sm font-bold mt-2 mb-1">
                          {children}
                        </h3>
                      ),
                      p: ({ children }) => (
                        <p className="mb-2 last:mb-0">{children}</p>
                      ),
                      ul: ({ children }) => (
                        <ul className="list-disc pl-4 mb-2">{children}</ul>
                      ),
                      ol: ({ children }) => (
                        <ol className="list-decimal pl-4 mb-2">{children}</ol>
                      ),
                      li: ({ children }) => (
                        <li className="mb-0.5">{children}</li>
                      ),
                      strong: ({ children }) => (
                        <strong className="font-semibold">{children}</strong>
                      ),
                      table: ({ children }) => (
                        <table className="border-collapse text-xs my-2 w-full">
                          {children}
                        </table>
                      ),
                      thead: ({ children }) => (
                        <thead className="bg-gray-50">{children}</thead>
                      ),
                      th: ({ children }) => (
                        <th className="border border-gray-300 px-2 py-1 text-left font-semibold">
                          {children}
                        </th>
                      ),
                      td: ({ children }) => (
                        <td className="border border-gray-300 px-2 py-1">
                          {children}
                        </td>
                      ),
                      hr: () => <hr className="my-2 border-gray-200" />,
                      code: ({ children }) => (
                        <code className="bg-gray-100 px-1 py-0.5 rounded text-xs">
                          {children}
                        </code>
                      ),
                    }}
                  >
                    {msg.content}
                  </Markdown>
                ) : (
                  msg.content
                )}
              </div>
            </div>
          ))}

          {sending && (
            <div className="flex items-start gap-2">
              <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center shrink-0 text-xs">
                🏴☠️
              </div>
              <div className="bg-white border border-gray-200 rounded-xl px-3 py-2">
                <div className="flex gap-1">
                  <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" />
                  <div
                    className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"
                    style={{ animationDelay: '0.15s' }}
                  />
                  <div
                    className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"
                    style={{ animationDelay: '0.3s' }}
                  />
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input bar — fixed at bottom of chat area */}
      <div className="bg-white border-t border-gray-200 px-4 py-2 shrink-0">
        <div className="max-w-3xl mx-auto flex items-end gap-2">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about One Piece..."
            rows={1}
            className="flex-1 resize-none border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || sending}
            className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:pointer-events-none"
            aria-label="Send message"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
              />
            </svg>
          </button>
        </div>
        <p className="text-center text-[10px] text-gray-400 mt-1">
          Data from One Piece Wiki (CC-BY-SA) • Powered by Groq
        </p>
      </div>
    </div>
  )
}

export default ChatPage
