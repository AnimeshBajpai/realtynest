import { useState, useRef, useEffect, useCallback } from 'react'
import { cn } from '../lib/utils'

interface PlaceResult {
  address: string
  city: string
  state: string
  zip: string
  lat?: number
  lng?: number
}

interface PlacesAutocompleteProps {
  value: string
  onChange: (value: string) => void
  onPlaceSelect?: (place: PlaceResult) => void
  placeholder?: string
  className?: string
}

interface Suggestion {
  placeId: string
  text: string
}

const inputClass =
  'block w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-text placeholder:text-slate-400 transition-all duration-200 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20'

const API_KEY = import.meta.env.VITE_GOOGLE_PLACES_API_KEY as string | undefined
const HAS_API = Boolean(API_KEY)

const MAX_VISIBLE = 8
const DEBOUNCE_MS = 300
const MIN_CHARS = 3

function useDebounce(value: string, delay: number): string {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(id)
  }, [value, delay])
  return debounced
}

async function fetchSuggestions(input: string, apiKey: string): Promise<Suggestion[]> {
  const res = await fetch('https://places.googleapis.com/v1/places:autocomplete', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': apiKey,
    },
    body: JSON.stringify({
      input,
      includedRegionCodes: ['in'],
      languageCode: 'en',
    }),
  })

  if (!res.ok) return []

  const data = (await res.json()) as {
    suggestions?: {
      placePrediction?: {
        placeId: string
        text?: { text: string }
      }
    }[]
  }

  return (
    data.suggestions
      ?.map((s) => {
        const pred = s.placePrediction
        if (!pred?.placeId) return null
        return { placeId: pred.placeId, text: pred.text?.text ?? '' }
      })
      .filter((s): s is Suggestion => s !== null)
      .slice(0, MAX_VISIBLE) ?? []
  )
}

async function fetchPlaceDetails(placeId: string, apiKey: string): Promise<PlaceResult | null> {
  const fields = 'formattedAddress,addressComponents,location'
  const res = await fetch(
    `https://places.googleapis.com/v1/places/${placeId}?fields=${fields}&key=${apiKey}`,
  )

  if (!res.ok) return null

  const data = (await res.json()) as {
    formattedAddress?: string
    addressComponents?: { types: string[]; longText?: string }[]
    location?: { latitude: number; longitude: number }
  }

  let city = ''
  let state = ''
  let zip = ''

  for (const comp of data.addressComponents ?? []) {
    if (comp.types.includes('locality')) city = comp.longText ?? ''
    if (comp.types.includes('administrative_area_level_1')) state = comp.longText ?? ''
    if (comp.types.includes('postal_code')) zip = comp.longText ?? ''
  }

  return {
    address: data.formattedAddress ?? '',
    city,
    state,
    zip,
    lat: data.location?.latitude,
    lng: data.location?.longitude,
  }
}

export default function PlacesAutocomplete({
  value,
  onChange,
  onPlaceSelect,
  placeholder,
  className,
}: PlacesAutocompleteProps) {
  const [open, setOpen] = useState(false)
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [activeIndex, setActiveIndex] = useState(-1)
  const [loading, setLoading] = useState(false)
  const wrapperRef = useRef<HTMLDivElement>(null)
  const listRef = useRef<HTMLUListElement>(null)
  const justSelectedRef = useRef(false)
  const debouncedValue = useDebounce(value, DEBOUNCE_MS)

  // Fetch suggestions when debounced value changes
  useEffect(() => {
    if (!HAS_API || debouncedValue.length < MIN_CHARS || justSelectedRef.current) {
      setSuggestions([])
      return
    }

    let cancelled = false
    setLoading(true)

    fetchSuggestions(debouncedValue, API_KEY!).then((results) => {
      if (!cancelled) {
        setSuggestions(results)
        setLoading(false)
        if (results.length > 0) setOpen(true)
      }
    })

    return () => {
      cancelled = true
    }
  }, [debouncedValue])

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

  const selectSuggestion = useCallback(
    async (suggestion: Suggestion) => {
      justSelectedRef.current = true
      onChange(suggestion.text)
      setOpen(false)
      setActiveIndex(-1)
      setSuggestions([])
      setTimeout(() => { justSelectedRef.current = false }, 200)

      if (onPlaceSelect && API_KEY) {
        const details = await fetchPlaceDetails(suggestion.placeId, API_KEY)
        if (details) {
          onPlaceSelect(details)
        }
      }
    },
    [onChange, onPlaceSelect],
  )

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (!open) {
        if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
          if (suggestions.length > 0) {
            setOpen(true)
            setActiveIndex(0)
          }
          e.preventDefault()
        }
        return
      }

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault()
          setActiveIndex((prev) => (prev < suggestions.length - 1 ? prev + 1 : 0))
          break
        case 'ArrowUp':
          e.preventDefault()
          setActiveIndex((prev) => (prev > 0 ? prev - 1 : suggestions.length - 1))
          break
        case 'Enter':
          e.preventDefault()
          if (activeIndex >= 0 && activeIndex < suggestions.length) {
            void selectSuggestion(suggestions[activeIndex])
          }
          break
        case 'Escape':
          setOpen(false)
          setActiveIndex(-1)
          break
      }
    },
    [open, suggestions, activeIndex, selectSuggestion],
  )

  // If no API key, render a plain text input (hooks already called above)
  if (!HAS_API) {
    return (
      <input
        type="text"
        value={value}
        placeholder={placeholder}
        className={cn(inputClass, className)}
        onChange={(e) => onChange(e.target.value)}
      />
    )
  }

  return (
    <div ref={wrapperRef} className="relative">
      <input
        type="text"
        value={value}
        placeholder={placeholder}
        className={cn(inputClass, className)}
        onChange={(e) => {
          onChange(e.target.value)
          setActiveIndex(-1)
        }}
        onFocus={() => {
          if (!justSelectedRef.current && suggestions.length > 0) setOpen(true)
        }}
        onKeyDown={handleKeyDown}
      />

      {open && suggestions.length > 0 && (
        <ul
          ref={listRef}
          className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-lg border border-slate-200 bg-white py-1 shadow-lg"
        >
          {suggestions.map((s, i) => (
            <li
              key={s.placeId}
              className={cn(
                'cursor-pointer px-3.5 py-2 text-sm text-slate-700 transition-colors',
                i === activeIndex ? 'bg-indigo-100' : 'hover:bg-indigo-50',
              )}
              onMouseEnter={() => setActiveIndex(i)}
              onMouseDown={(e) => {
                e.preventDefault()
                void selectSuggestion(s)
              }}
            >
              {s.text}
            </li>
          ))}

          <li className="px-3.5 py-1.5 text-[10px] text-slate-400 text-right select-none">
            Powered by Google
          </li>
        </ul>
      )}

      {loading && open && suggestions.length === 0 && (
        <div className="absolute z-50 mt-1 w-full rounded-lg border border-slate-200 bg-white px-3.5 py-3 text-sm text-slate-400 shadow-lg">
          Searching…
        </div>
      )}
    </div>
  )
}
