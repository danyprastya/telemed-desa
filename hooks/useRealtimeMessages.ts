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
        async (payload) => {
          const rawMessage = payload.new as Message
          
          // Fetch the full message including the joined sender profile
          const { data: fullMessage } = await supabase
            .from('messages')
            .select('*, sender:profiles!messages_sender_id_fkey(full_name)')
            .eq('id', rawMessage.id)
            .single()

          if (fullMessage) {
            setMessages((prev) => {
              // Avoid duplicates
              if (prev.some((m) => m.id === fullMessage.id)) return prev
              return [...prev, fullMessage as Message]
            })
          }
        }
      )
      .subscribe((status) => {
        setIsConnected(status === 'SUBSCRIBED')
      })

    return () => {
      supabase.removeChannel(channel)
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
