'use client'

import { useEffect, useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Message } from '@/types/app.types'

/**
 * Hook for real-time chat messages via Supabase Realtime.
 * Subscribes to INSERT events on the messages table filtered by consultation_id.
 * @param consultationId - The consultation to subscribe to.
 * @param initialMessages - Messages fetched on mount.
 * @returns { messages, isConnected }
 */
export function useRealtimeMessages(consultationId: string, initialMessages: Message[]) {
  const [messages, setMessages] = useState<Message[]>(initialMessages)
  const [isConnected, setIsConnected] = useState(false)
  const supabase = createClient()
  const scrollRef = useRef<HTMLDivElement>(null)

  // Sync initial messages when they change
  useEffect(() => {
    setMessages(initialMessages)
  }, [initialMessages])

  // Subscribe to new messages
  useEffect(() => {
    const channel = supabase
      .channel(`messages:${consultationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `consultation_id=eq.${consultationId}`,
        },
        (payload) => {
          const newMessage = payload.new as Message
          setMessages((prev) => {
            // Avoid duplicates
            if (prev.some((m) => m.id === newMessage.id)) return prev
            return [...prev, newMessage]
          })
        }
      )
      .subscribe((status) => {
        setIsConnected(status === 'SUBSCRIBED')
      })

    return () => {
      channel.unsubscribe()
    }
  }, [consultationId, supabase])

  // Scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  return { messages, isConnected, scrollRef }
}
