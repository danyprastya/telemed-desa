'use client'

import { useRef, useEffect, useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useRealtimeMessages } from '@/hooks/useRealtimeMessages'
import { MessageBubble } from '@/components/consultations/MessageBubble'
import { CloseConsultationDialog } from '@/components/consultations/CloseConsultationDialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { Loader2, Send, Lock, Wifi, WifiOff } from 'lucide-react'
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
  const { messages, isConnected, scrollRef } = useRealtimeMessages(consultation.id, initialMessages)
  const [newMessage, setNewMessage] = useState('')
  const [isSending, setIsSending] = useState(false)
  const [showCloseDialog, setShowCloseDialog] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
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
        setNewMessage('')
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

  return (
    <div className="flex flex-col h-[600px] rounded-xl border border-border-green bg-white overflow-hidden">
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
          {isConnected ? (
            <Badge className="bg-success-light text-success gap-1 text-xs">
              <Wifi className="h-3 w-3" /> Live
            </Badge>
          ) : (
            <Badge className="bg-critical-light text-critical gap-1 text-xs">
              <WifiOff className="h-3 w-3" />
            </Badge>
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
      <ScrollArea className="flex-1 p-4 min-h-0" ref={scrollRef}>
        <div className="space-y-3">
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
      </ScrollArea>

      {/* Input area */}
      {!isClosed && (
        <div className="flex items-center gap-2 px-4 py-3 border-t border-border-green bg-surface shrink-0 mt-auto">
          <Input
            ref={inputRef}
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
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
