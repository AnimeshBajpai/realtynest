import { useState, useRef, useEffect, useCallback, useMemo } from 'react'
import { cn } from '../lib/utils'

interface AutocompleteInputProps {
  value: string
  onChange: (value: string) => void
  items: string[]
  placeholder?: string
  className?: string
  disabled?: boolean
}

const inputClass =
  'block w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-text placeholder:text-slate-400 transition-all duration-200 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20'

const MAX_VISIBLE = 20

function highlightMatch(text: string, query: string) {
  if (!query) return text
  const idx = text.toLowerCase().indexOf(query.toLowerCase())
  if (idx === -1) return text
  return (
    <>
      {text.slice(0, idx)}
      <span className="font-bold">{text.slice(idx, idx + query.length)}</span>
      {text.slice(idx + query.length)}
    </>
  )
}

export default function AutocompleteInput({
  value,
  onChange,
  items,
  placeholder,
  className,
  disabled,
}: AutocompleteInputProps) {
  const [open, setOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)
  const wrapperRef = useRef<HTMLDivElement>(null)
  const listRef = useRef<HTMLUListElement>(null)
  const justSelectedRef = useRef(false)

  const filtered = useMemo(() => {
    if (!value) return items.slice(0, MAX_VISIBLE)
    const q = value.toLowerCase()
    return items.filter((item) => item.toLowerCase().includes(q)).slice(0, MAX_VISIBLE)
  }, [value, items])

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Scroll active item into view
  useEffect(() => {
    if (activeIndex >= 0 && listRef.current) {
      const item = listRef.current.children[activeIndex] as HTMLElement | undefined
      item?.scrollIntoView({ block: 'nearest' })
    }
  }, [activeIndex])

  const selectItem = useCallback(
    (item: string) => {
      justSelectedRef.current = true
      onChange(item)
      setOpen(false)
      setActiveIndex(-1)
      setTimeout(() => { justSelectedRef.current = false }, 150)
    },
    [onChange],
  )

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (!open) {
        if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
          setOpen(true)
          setActiveIndex(0)
          e.preventDefault()
        }
        return
      }

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault()
          setActiveIndex((prev) => (prev < filtered.length - 1 ? prev + 1 : 0))
          break
        case 'ArrowUp':
          e.preventDefault()
          setActiveIndex((prev) => (prev > 0 ? prev - 1 : filtered.length - 1))
          break
        case 'Enter':
          e.preventDefault()
          if (activeIndex >= 0 && activeIndex < filtered.length) {
            selectItem(filtered[activeIndex])
          }
          break
        case 'Escape':
          setOpen(false)
          setActiveIndex(-1)
          break
      }
    },
    [open, filtered, activeIndex, selectItem],
  )

  return (
    <div ref={wrapperRef} className="relative">
      <input
        type="text"
        value={value}
        disabled={disabled}
        placeholder={placeholder}
        className={cn(inputClass, className)}
        onChange={(e) => {
          onChange(e.target.value)
          setOpen(true)
          setActiveIndex(-1)
        }}
        onFocus={() => { if (!justSelectedRef.current) setOpen(true) }}
        onKeyDown={handleKeyDown}
      />

      {open && filtered.length > 0 && (
        <ul
          ref={listRef}
          className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-lg border border-slate-200 bg-white py-1 shadow-lg"
        >
          {filtered.map((item, i) => (
            <li
              key={item}
              className={cn(
                'cursor-pointer px-3.5 py-2 text-sm text-slate-700 transition-colors',
                i === activeIndex ? 'bg-indigo-100' : 'hover:bg-indigo-50',
              )}
              onMouseEnter={() => setActiveIndex(i)}
              onMouseDown={(e) => {
                e.preventDefault() // prevent input blur
                selectItem(item)
              }}
            >
              {highlightMatch(item, value)}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
