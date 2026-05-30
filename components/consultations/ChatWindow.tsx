'use client'

import { useRef, useEffect, useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useRealtimeMessages } from '@/hooks/useRealtimeMessages'
import { MessageBubble } from '@/components/consultations/MessageBubble'
import { CloseConsultationDialog } from '@/components/consultations/CloseConsultationDialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Loader2, Send, Lock, Wifi, WifiOff, ChevronDown } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import type { Message, Consultation } from '@/types/app.types'

interface ChatWindowProps {
  consultation: Consultation
  initialMessages: Message[]
  onConsultationUpdated?: () => void
}

/**
 * Real-time chat window for a consultation.
 * Supports message sending, real-time message receiving via Supabase Realtime,
 * auto-scroll to bottom, and close consultation dialog for doctors.
 * @param consultation - The consultation record.
 * @param initialMessages - Messages fetched on mount.
 * @param onConsultationUpdated - Callback when consultation is closed.
 */
export function ChatWindow({ consultation, initialMessages, onConsultationUpdated }: ChatWindowProps) {
  const { profile } = useAuth()
  const { messages, setMessages, isConnected, typingUsers, sendTypingEvent } = useRealtimeMessages(consultation, initialMessages, profile)
  const [newMessage, setNewMessage] = useState('')
  const [isSending, setIsSending] = useState(false)
  const [showCloseDialog, setShowCloseDialog] = useState(false)
  const [showScrollButton, setShowScrollButton] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const [typingTimeout, setTypingTimeout] = useState<NodeJS.Timeout | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const prevMessagesLength = useRef(initialMessages.length)
  const supabase = createClient()

  // Listen for consultation updates (like status changes)
  useEffect(() => {
    const channel = supabase
      .channel(`consultation_update:${consultation.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'consultations',
          filter: `id=eq.${consultation.id}`,
        },
        () => {
          // Whenever the consultation is updated (e.g. status changed to closed), trigger the callback
          onConsultationUpdated?.()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [consultation.id, onConsultationUpdated, supabase])

  const isClosed = consultation.status === 'closed'
  const isDoctor = profile?.role === 'doctor'

  const handleSend = async () => {
    const trimmed = newMessage.trim()
    if (!trimmed || isSending || isClosed) return

    setIsSending(true)
    try {
      const res = await fetch(`/api/consultations/${consultation.id}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: trimmed }),
      })
      const result = await res.json()
      if (result.error) {
        toast.error(result.error)
      } else {
        setMessages((prev: Message[]) => {
          if (prev.some((m) => m.id === result.data.id)) return prev
          return [...prev, result.data]
        })
        setNewMessage('')
        sendTypingEvent(false)
        if (typingTimeout) clearTimeout(typingTimeout)
        inputRef.current?.focus()
      }
    } catch {
      toast.error('Gagal mengirim pesan')
    } finally {
      setIsSending(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewMessage(e.target.value)
    sendTypingEvent(true)
    
    if (typingTimeout) clearTimeout(typingTimeout)
    const timeout = setTimeout(() => {
      sendTypingEvent(false)
    }, 2000)
    setTypingTimeout(timeout)
  }

  // Cleanup timeout
  useEffect(() => {
    return () => {
      if (typingTimeout) clearTimeout(typingTimeout)
    }
  }, [typingTimeout])

  const scrollToBottom = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
    setShowScrollButton(false)
    setUnreadCount(0)
  }

  const handleScroll = () => {
    if (!scrollRef.current) return
    const { scrollTop, scrollHeight, clientHeight } = scrollRef.current
    const isScrolledUp = scrollHeight - scrollTop - clientHeight > 100
    setShowScrollButton(isScrolledUp)
    if (!isScrolledUp) {
      setUnreadCount(0)
    }
  }

  // Auto-scroll logic
  useEffect(() => {
    if (!scrollRef.current) return
    const latestMessage = messages[messages.length - 1]
    const isOwn = latestMessage?.sender_id === profile?.id

    if (messages.length > prevMessagesLength.current) {
      const addedCount = messages.length - prevMessagesLength.current
      // Auto-scroll if we are already near bottom, or if we just sent a message
      if (!showScrollButton || isOwn) {
        scrollToBottom()
      } else {
        setUnreadCount((prev) => prev + addedCount)
      }
    }
    
    prevMessagesLength.current = messages.length
  }, [messages]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="flex flex-col h-[600px] rounded-xl border border-border-green bg-card overflow-hidden">
      {/* Chat header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border-green bg-surface">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-sm text-text-primary">
            Konsultasi — {consultation.patient?.full_name ?? 'Pasien'}
          </h3>
          {isClosed && (
            <Badge variant="outline" className="text-text-muted text-xs gap-1">
              <Lock className="h-3 w-3" /> Ditutup
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          {!isClosed && (
            isConnected ? (
              <Badge className="bg-success-light text-success gap-1 text-xs">
                <Wifi className="h-3 w-3" /> Live
              </Badge>
            ) : (
              <Badge className="bg-critical-light text-critical gap-1 text-xs">
                <WifiOff className="h-3 w-3" /> Offline
              </Badge>
            )
          )}
          {isDoctor && !isClosed && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowCloseDialog(true)}
              className="text-critical border-critical/30 hover:bg-critical-light"
            >
              Tutup Konsultasi
            </Button>
          )}
        </div>
      </div>

      {/* Messages area */}
      <div className="relative flex-1 min-h-0">
        <div 
          className="h-full overflow-y-auto p-4 custom-scrollbar" 
          ref={scrollRef}
          onScroll={handleScroll}
        >
          <div className="space-y-3 pb-2">
            {messages.length === 0 ? (
              <p className="text-center text-sm text-text-muted py-12">
                Belum ada pesan. Mulai percakapan.
              </p>
            ) : (
              messages.map((msg) => (
                <MessageBubble
                  key={msg.id}
                  message={msg}
                  isOwn={msg.sender_id === profile?.id}
                />
              ))
            )}
          </div>
        </div>

        {/* Jump to bottom button */}
        {showScrollButton && (
          <Button
            variant="secondary"
            size="icon"
            onClick={scrollToBottom}
            className="absolute bottom-4 right-4 rounded-full shadow-md z-10 bg-surface/90 hover:bg-surface border border-border-green text-primary w-10 h-10"
          >
            <ChevronDown className="h-5 w-5" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-critical text-[10px] font-bold text-white shadow-sm">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </Button>
        )}
      </div>

      {/* Typing indicator */}
      {typingUsers.size > 0 && !isClosed && (
        <div className="px-4 py-2 text-xs text-text-muted italic bg-surface/50 border-t border-border-green">
          {Array.from(typingUsers.values()).map(u => u.name).join(', ')} sedang mengetik...
        </div>
      )}

      {/* Input area */}
      {!isClosed && (
        <div className="flex items-center gap-2 px-4 py-3 border-t border-border-green bg-surface shrink-0 mt-auto">
          <Input
            ref={inputRef}
            value={newMessage}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder="Ketik pesan..."
            disabled={isSending}
            className="flex-1"
          />
          <Button
            size="icon"
            onClick={handleSend}
            disabled={isSending || !newMessage.trim()}
            className="shrink-0"
          >
            {isSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </div>
      )}

      {/* Close consultation dialog */}
      <CloseConsultationDialog
        open={showCloseDialog}
        onOpenChange={setShowCloseDialog}
        consultationId={consultation.id}
        onClosed={() => {
          onConsultationUpdated?.()
        }}
      />
    </div>
  )
}
