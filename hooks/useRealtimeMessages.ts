'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Message, Profile, Consultation } from '@/types/app.types'

/**
 * Hook for real-time chat messages via Supabase Realtime.
 * Subscribes to INSERT events on the messages table filtered by consultation_id.
 * @param consultation - The full consultation object.
 * @returns { messages, setMessages, isConnected, typingUsers, sendTypingEvent }
 */
export function useRealtimeMessages(consultation: Consultation, initialMessages: Message[], profile?: Profile | null) {
  const consultationId = consultation.id
  const [messages, setMessages] = useState<Message[]>(initialMessages)
  const [isConnected, setIsConnected] = useState(false)
  const [typingUsers, setTypingUsers] = useState<Map<string, {name: string, timestamp: number}>>(new Map())
  const supabase = createClient()
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
          
          // Construct sender object manually using the consultation data
          let senderName = 'Unknown'
          if (rawMessage.sender_id === consultation.doctor_id) {
            senderName = consultation.doctor?.full_name ?? 'Dokter'
          } else if (rawMessage.sender_id === consultation.nurse_id) {
            senderName = consultation.nurse?.full_name ?? 'Perawat'
          }

          const msg: Message = {
            ...rawMessage,
            sender: { full_name: senderName } as Profile
          }

          setMessages((prev) => {
            if (prev.some((m) => m.id === msg.id)) return prev
            return [...prev, msg]
          })
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
  }, [consultation, supabase, profile?.id])

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

  return { messages, setMessages, isConnected, typingUsers, sendTypingEvent }
}
