'use client'

import { useRef, useEffect } from 'react'
import { Input } from '@/components/ui/input'
import { Search } from 'lucide-react'

interface PatientSearchProps {
  value: string
  onChange: (value: string) => void
}

/**
 * Debounced search input for filtering patient lists.
 * Debounces input by 400ms to avoid excessive API calls.
 * @param value - Current search value.
 * @param onChange - Called with the debounced search string.
 */
export function PatientSearch({ value, onChange }: PatientSearchProps) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Clear timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => {
      onChange(e.target.value)
    }, 400)
  }

  return (
    <div className="relative w-full max-w-sm">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
      <Input
        ref={inputRef}
        defaultValue={value}
        onChange={handleChange}
        placeholder="Cari nama atau NIK..."
        className="pl-9"
      />
    </div>
  )
}
