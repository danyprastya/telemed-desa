'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Message, Profile } from '@/types/app.types'

/**
 * Hook for real-time chat messages via Supabase Realtime.
 * Subscribes to INSERT events on the messages table filtered by consultation_id.
 * @param consultationId - The consultation to subscribe to.
 * @param profile - The current user profile.
 * @returns { messages, isConnected, scrollRef, typingUsers, sendTypingEvent }
 */
export function useRealtimeMessages(consultationId: string, initialMessages: Message[], profile?: Profile | null) {
  const [messages, setMessages] = useState<Message[]>(initialMessages)
  const [isConnected, setIsConnected] = useState(false)
  const [typingUsers, setTypingUsers] = useState<Map<string, {name: string, timestamp: number}>>(new Map())
  const supabase = createClient()
  const scrollRef = useRef<HTMLDivElement>(null)
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null)

  // Sync initial messages when they change
  useEffect(() => {
    setMessages(initialMessages)
  }, [initialMessages])

  // Subscribe to new messages and typing events
  useEffect(() => {
    const channel = supabase
      .channel(`messages:${consultationId}`)
      .on('broadcast', { event: 'typing' }, ({ payload }) => {
        // payload: { userId: string, name: string, isTyping: boolean }
        if (payload.userId === profile?.id) return

        setTypingUsers(prev => {
          const newMap = new Map(prev)
          if (payload.isTyping) {
            newMap.set(payload.userId, { name: payload.name, timestamp: Date.now() })
          } else {
            newMap.delete(payload.userId)
          }
          return newMap
        })
      })
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
            const msg = fullMessage as unknown as Message
            setMessages((prev) => {
              // Avoid duplicates
              if (prev.some((m) => m.id === msg.id)) return prev
              return [...prev, msg]
            })
          }
        }
      )
      .subscribe((status) => {
        setIsConnected(status === 'SUBSCRIBED')
      })
      
    channelRef.current = channel

    return () => {
      supabase.removeChannel(channel)
      channelRef.current = null
    }
  }, [consultationId, supabase, profile?.id])

  // Clear stale typing indicators after 3 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now()
      setTypingUsers(prev => {
        let changed = false
        const newMap = new Map(prev)
        for (const [id, data] of newMap.entries()) {
          if (now - data.timestamp > 3000) {
            newMap.delete(id)
            changed = true
          }
        }
        return changed ? newMap : prev
      })
    }, 1000)
    return () => clearInterval(interval)
  }, [])

  // Function to broadcast typing state
  const sendTypingEvent = useCallback((isTyping: boolean) => {
    if (!profile || !channelRef.current) return
    channelRef.current.send({
      type: 'broadcast',
      event: 'typing',
      payload: { userId: profile.id, name: profile.full_name, isTyping }
    })
  }, [profile])

  // Scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  return { messages, isConnected, scrollRef, typingUsers, sendTypingEvent }
}
