import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Plus,
  Search,
  Loader2,
  Building2,
  MapPin,
  BedDouble,
  Bath,
  Ruler,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import { cn } from '../lib/utils'
import { usePropertyStore, type PropertyFilters } from '../store/propertyStore'
import type { PropertyType, PropertyStatus } from '../types'
import CreatePropertyModal from '../components/CreatePropertyModal'

const TYPE_OPTIONS: { value: PropertyType | ''; label: string }[] = [
  { value: '', label: 'All Types' },
  { value: 'APARTMENT', label: 'Apartment' },
  { value: 'VILLA', label: 'Villa' },
  { value: 'PLOT', label: 'Plot' },
  { value: 'COMMERCIAL', label: 'Commercial' },
]

const STATUS_OPTIONS: { value: PropertyStatus | ''; label: string }[] = [
  { value: '', label: 'All Statuses' },
  { value: 'AVAILABLE', label: 'Available' },
  { value: 'SOLD', label: 'Sold' },
  { value: 'RESERVED', label: 'Reserved' },
]

const typeBadge: Record<PropertyType, string> = {
  APARTMENT: 'bg-blue-50 text-blue-700',
  VILLA: 'bg-purple-50 text-purple-700',
  PLOT: 'bg-green-50 text-green-700',
  COMMERCIAL: 'bg-orange-50 text-orange-700',
}

const statusBadge: Record<PropertyStatus, string> = {
  AVAILABLE: 'bg-green-50 text-green-700',
  SOLD: 'bg-red-50 text-red-700',
  RESERVED: 'bg-yellow-50 text-yellow-700',
}

function formatPrice(price: number): string {
  if (price >= 10000000) return `₹${(price / 10000000).toFixed(1)} Cr`
  if (price >= 100000) return `₹${(price / 100000).toFixed(1)} Lac`
  return `₹${price.toLocaleString('en-IN')}`
}

const inputClass =
  'block w-full rounded-lg border border-gray-200 bg-surface px-3 py-2 text-sm text-text placeholder:text-text-secondary/60 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary'

export default function PropertiesPage() {
  const navigate = useNavigate()
  const {
    properties,
    isLoading,
    page,
    totalPages,
    total,
    filters,
    fetchProperties,
    setFilters,
    setPage,
  } = usePropertyStore()

  const [showCreateModal, setShowCreateModal] = useState(false)
  const [searchInput, setSearchInput] = useState(filters.search ?? '')
  const [priceMinInput, setPriceMinInput] = useState(filters.priceMin?.toString() ?? '')
  const [priceMaxInput, setPriceMaxInput] = useState(filters.priceMax?.toString() ?? '')

  useEffect(() => {
    fetchProperties()
  }, [fetchProperties, page, filters])

  const applyFilters = useCallback(
    (patch: Partial<PropertyFilters>) => {
      setFilters({ ...filters, ...patch })
    },
    [filters, setFilters]
  )

  const handleSearch = () => {
    applyFilters({
      search: searchInput.trim() || undefined,
      priceMin: priceMinInput ? Number(priceMinInput) : undefined,
      priceMax: priceMaxInput ? Number(priceMaxInput) : undefined,
    })
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSearch()
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text">Properties</h1>
          <p className="mt-1 text-sm text-text-secondary">
            {total > 0 ? `${total} properties` : 'Manage your property listings'}
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-dark"
        >
          <Plus className="h-4 w-4" />
          Add Property
        </button>
      </div>

      {/* Filter bar */}
      <div className="mb-6 rounded-xl border border-gray-200 bg-surface p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end">
          <div className="flex-1">
            <label className="mb-1 block text-xs font-medium text-text-secondary">Search</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-secondary" />
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={handleKeyDown}
                className={cn(inputClass, 'pl-9')}
                placeholder="Search by name, city..."
              />
            </div>
          </div>
          <div className="w-full lg:w-40">
            <label className="mb-1 block text-xs font-medium text-text-secondary">Type</label>
            <select
              value={filters.type ?? ''}
              onChange={(e) =>
                applyFilters({ type: (e.target.value || undefined) as PropertyType | undefined })
              }
              className={inputClass}
            >
              {TYPE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
          <div className="w-full lg:w-40">
            <label className="mb-1 block text-xs font-medium text-text-secondary">Status</label>
            <select
              value={filters.status ?? ''}
              onChange={(e) =>
                applyFilters({ status: (e.target.value || undefined) as PropertyStatus | undefined })
              }
              className={inputClass}
            >
              {STATUS_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
          <div className="w-full lg:w-32">
            <label className="mb-1 block text-xs font-medium text-text-secondary">Price Min</label>
            <input
              type="number"
              value={priceMinInput}
              onChange={(e) => setPriceMinInput(e.target.value)}
              onKeyDown={handleKeyDown}
              className={inputClass}
              placeholder="Min"
              min="0"
            />
          </div>
          <div className="w-full lg:w-32">
            <label className="mb-1 block text-xs font-medium text-text-secondary">Price Max</label>
            <input
              type="number"
              value={priceMaxInput}
              onChange={(e) => setPriceMaxInput(e.target.value)}
              onKeyDown={handleKeyDown}
              className={inputClass}
              placeholder="Max"
              min="0"
            />
          </div>
          <button
            onClick={handleSearch}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-dark"
          >
            Filter
          </button>
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : properties.length === 0 ? (
        <div className="rounded-xl border border-gray-200 bg-surface py-20 text-center">
          <Building2 className="mx-auto h-12 w-12 text-text-secondary/40" />
          <p className="mt-4 text-sm font-medium text-text">No properties found</p>
          <p className="mt-1 text-sm text-text-secondary">
            Add your first property to get started.
          </p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="mt-4 inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-dark"
          >
            <Plus className="h-4 w-4" />
            Add Property
          </button>
        </div>
      ) : (
        <>
          {/* Cards Grid */}
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {properties.map((property) => (
              <div
                key={property.id}
                onClick={() => navigate(`/properties/${property.id}`)}
                className="cursor-pointer rounded-xl border border-gray-200 bg-surface p-5 transition-shadow hover:shadow-md"
              >
                <div className="flex items-start justify-between">
                  <h3 className="text-base font-semibold text-text line-clamp-1">
                    {property.name}
                  </h3>
                  <span
                    className={cn(
                      'ml-2 shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium',
                      statusBadge[property.status]
                    )}
                  >
                    {property.status}
                  </span>
                </div>

                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <span
                    className={cn(
                      'rounded-full px-2 py-0.5 text-xs font-medium',
                      typeBadge[property.type]
                    )}
                  >
                    {property.type}
                  </span>
                  {(property.city || property.state) && (
                    <span className="flex items-center gap-1 text-xs text-text-secondary">
                      <MapPin className="h-3 w-3" />
                      {[property.city, property.state].filter(Boolean).join(', ')}
                    </span>
                  )}
                </div>

                {property.price != null && (
                  <p className="mt-3 text-lg font-bold text-text">
                    {formatPrice(property.price)}
                  </p>
                )}

                <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-text-secondary">
                  {property.areaSqft != null && (
                    <span className="flex items-center gap-1">
                      <Ruler className="h-3.5 w-3.5" />
                      {property.areaSqft.toLocaleString()} sq ft
                    </span>
                  )}
                  {property.bedrooms != null && (
                    <span className="flex items-center gap-1">
                      <BedDouble className="h-3.5 w-3.5" />
                      {property.bedrooms} bed
                    </span>
                  )}
                  {property.bathrooms != null && (
                    <span className="flex items-center gap-1">
                      <Bath className="h-3.5 w-3.5" />
                      {property.bathrooms} bath
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-6 flex items-center justify-between">
              <p className="text-sm text-text-secondary">
                Page {page} of {totalPages}
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => { setPage(page - 1); }}
                  disabled={page <= 1}
                  className="flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-1.5 text-sm font-medium text-text hover:bg-gray-50 disabled:opacity-50"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </button>
                <button
                  onClick={() => { setPage(page + 1); }}
                  disabled={page >= totalPages}
                  className="flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-1.5 text-sm font-medium text-text hover:bg-gray-50 disabled:opacity-50"
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Create Modal */}
      <CreatePropertyModal
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
      />
    </div>
  )
}
