
import { useEffect, useRef, useState } from 'react'
import './AdminDashboard.css'

const API_URL = `http://${window.location.hostname}:3000`

type Section = 'Reports' | 'Listings' | 'Users'
type ReportStatus = 'PENDING' | 'RESOLVED' | 'DISMISSED'
type ReviewStatus = Exclude<ReportStatus, 'PENDING'>

type AdminStats = {
  restaurants: number
  producers: number
  productListings: number
  pendingReports: number
}

type ProductImage = {
  id: string
  image_url: string
  is_cover: boolean
  sort_order: number
}

type Report = {
  id: string
  reason: string
  status: ReportStatus
  admin_notes: string | null
  created_at: string
  product_listings: {
    id: string
    name: string
    description: string | null
    is_hidden: boolean
    is_active: boolean
    product_images: ProductImage[]
    producer_profiles: {
      user_id: string
      business_name: string
      city: string | null
    }
  }
  restaurant_profiles: { restaurant_name: string }
  users: { full_name: string } | null
}

type Listing = {
  id: string
  name: string
  price: string | number
  unit: string
  available_quantity: string | number
  is_active: boolean
  is_hidden: boolean
  categories: { name: string }
  producer_profiles: { business_name: string; city: string | null }
  _count: { reports: number }
}

type User = {
  id: string
  email: string
  full_name: string
  role: 'PRODUCER' | 'RESTAURANT'
  is_blocked: boolean
  producer_profiles: { business_name: string; city: string | null } | null
  restaurant_profiles: { restaurant_name: string; city: string | null } | null
}

const sections: Section[] = ['Reports', 'Listings', 'Users']
const statuses: ReviewStatus[] = ['RESOLVED', 'DISMISSED']

const headings = {
  Reports: {
    title: 'Reported Listings',
    description: 'Review submitted reports and resolve marketplace issues.',
  },
  Listings: {
    title: 'Product Listings',
    description: 'Review and manage the visibility of product listings.',
  },
  Users: {
    title: 'User Accounts',
    description: 'Manage producer and restaurant accounts.',
  },
}

async function adminRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_URL}/admin${path}`, {
    ...options,
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
  })

  const data = await response.json().catch(() => null)

  if (!response.ok) {
    throw new Error(Array.isArray(data?.message)
      ? data.message.join(', ')
      : data?.message || 'Unable to complete the request.')
  }

  return data as T
}

function formatStatus(status: string) {
  return status.charAt(0) + status.slice(1).toLowerCase()
}

function formatDate(date: string) {
  return new Date(date).toLocaleDateString('en-GB')
}

function Status({ value, label }: { value: string; label?: string }) {
  return (
    <span className={`admin-status admin-status--${value.toLowerCase()}`}>
      {label ?? formatStatus(value)}
    </span>
  )
}

function ActionButton({ label, danger, disabled, onClick }: {
  label: string
  danger?: boolean
  disabled?: boolean
  onClick: () => void
}) {
  return (
    <button type="button" disabled={disabled} onClick={onClick}
      className={`admin-action${danger ? ' admin-action--danger' : ''}`}>
      {label}
    </button>
  )
}

function SectionIcon({ section }: { section: Section }) {
  return (
    <svg width="25" height="25" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"
      strokeLinejoin="round" aria-hidden="true">
      {section === 'Reports' ? (
        <path d="M5 21V3M5 4c5-4 9 4 15 0v11c-6 4-10-4-15 0" />
      ) : section === 'Listings' ? (
        <path d="m12 3 9 5-9 5-9-5ZM3 8v9l9 5 9-5V8M12 13v9" />
      ) : (
        <>
          <circle cx="9" cy="7" r="4" />
          <path d="M2 21v-3a7 7 0 0 1 14 0v3M17 4a4 4 0 0 1 0 8M18 15a5 5 0 0 1 4 5v1" />
        </>
      )}
    </svg>
  )
}

export default function AdminDashboard({ fullName }: { fullName: string }) {
  const [section, setSection] = useState<Section>('Reports')
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [reports, setReports] = useState<Report[]>([])
  const [listings, setListings] = useState<Listing[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [dialogError, setDialogError] = useState('')
  const [reportFilter, setReportFilter] = useState<'ALL' | ReportStatus>('ALL')
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null)
  const [reviewStatus, setReviewStatus] = useState<ReviewStatus>('RESOLVED')
  const [adminNotes, setAdminNotes] = useState('')
  const dialogRef = useRef<HTMLDialogElement>(null)

  const selectedReport = reports.find(report => report.id === selectedReportId)
  const product = selectedReport?.product_listings
  const selectedProducer = users.find(user => user.id === product?.producer_profiles.user_id)
  const visibleReports = reports.filter(report =>
    reportFilter === 'ALL' || report.status === reportFilter
  )

  // Load marketplace data.

  async function loadData(signal?: AbortSignal) {
    const [statsData, reportsData, listingsData, usersData] = await Promise.all([
      adminRequest<AdminStats>('/stats', { signal }),
      adminRequest<Report[]>('/reports', { signal }),
      adminRequest<Listing[]>('/products', { signal }),
      adminRequest<User[]>('/users', { signal }),
    ])

    if (signal?.aborted) return

    setStats(statsData)
    setReports(reportsData)
    setListings(listingsData)
    setUsers(usersData)
  }

  useEffect(() => {
    const controller = new AbortController()

    loadData(controller.signal)
      .catch(error => {
        if (!controller.signal.aborted) {
          setError(error instanceof Error ? error.message : 'Unable to load dashboard data.')
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsLoading(false)
      })

    return () => controller.abort()
  }, [])

  // Report review.

  function openReport(report: Report) {
    setSelectedReportId(report.id)
    setReviewStatus(report.status === 'DISMISSED' ? 'DISMISSED' : 'RESOLVED')
    setAdminNotes(report.admin_notes ?? '')
    setDialogError('')
    setMessage('')
    dialogRef.current?.showModal()
  }

  function closeReport() {
    if (isSaving) return
    dialogRef.current?.close()
    setSelectedReportId(null)
    setDialogError('')
  }

  // Administrative actions.

  async function performAction(
    path: string,
    body: Record<string, unknown>,
    insideDialog = false,
    closeAfterSave = false
  ) {
    if (isSaving) return

    setIsSaving(true)
    setError('')
    setDialogError('')
    setMessage('')

    try {
      const result = await adminRequest<{ message: string }>(path, {
        method: 'PATCH',
        body: JSON.stringify(body),
      })

      setMessage(result.message)

      if (closeAfterSave) {
        dialogRef.current?.close()
        setSelectedReportId(null)
      }

      try {
        await loadData()
      } catch {
        setError('Changes were saved, but the dashboard could not refresh. Reload the page.')
      }
    } catch (error) {
      const text = error instanceof Error ? error.message : 'Unable to save changes.'
      if (insideDialog) setDialogError(text)
      else setError(text)
    } finally {
      setIsSaving(false)
    }
  }

  function saveReview() {
    if (!selectedReport) return
    void performAction(`/reports/${selectedReport.id}`, {
      status: reviewStatus,
      adminNotes: adminNotes.trim(),
    }, true, true)
  }

  function changeVisibility(id: string, isHidden: boolean, insideDialog = false) {
    if (!window.confirm(isHidden
      ? 'Hide this product listing from the marketplace?'
      : 'Remove the moderation restriction from this listing?')) return

    void performAction(`/products/${id}/visibility`, { isHidden }, insideDialog)
  }

  function changeUserBlock(id: string, isBlocked: boolean, insideDialog = false) {
    if (!window.confirm(`Are you sure you want to ${isBlocked ? 'block' : 'unblock'} this account?`)) return

    void performAction(`/users/${id}/block`, { isBlocked }, insideDialog)
  }

  return (
    <div className="admin-workspace">
      {/* Welcome banner */}
      <header className="admin-hero">
        <div className="admin-hero-content">
          <span className="admin-eyebrow">ADMINISTRATOR WORKSPACE</span>
          <h1>Marketplace Management</h1>
          <p>Welcome back, {fullName}. Manage and maintain the Rekolta marketplace.</p>
        </div>
        <svg className="admin-wave" viewBox="0 0 1200 55"
          preserveAspectRatio="none" aria-hidden="true">
          <path d="M0 0 C380 100 760 -30 1200 28 L1200 55 H0Z" fill="#dfe9d5" />
          <path d="M0 12 C380 108 760 -10 1200 40 L1200 55 H0Z" fill="#fafbf5" />
        </svg>
      </header>

      <div className="admin-body">
        {/* Platform statistics */}
        <section className="admin-statistics" aria-label="Platform statistics" aria-busy={isLoading}>
          <div className="admin-pending">
            <strong>{stats?.pendingReports ?? '—'}</strong>
            <h2>Reports awaiting review</h2>
            <p>{stats?.pendingReports === 0 ? 'No pending reports.' : 'Marketplace moderation'}</p>
          </div>
          <div className="admin-stat-summary">
            <div><span>Registered producers</span><strong>{stats?.producers ?? '—'}</strong></div>
            <div><span>Registered restaurants</span><strong>{stats?.restaurants ?? '—'}</strong></div>
            <div><span>Total product listings</span><strong>{stats?.productListings ?? '—'}</strong></div>
          </div>
        </section>

        {/* Management navigation */}
        <nav className="admin-navigation" aria-label="Administrator navigation">
          {sections.map(item => (
            <button key={item} type="button" disabled={isSaving}
              className={section === item ? 'admin-active' : ''}
              aria-pressed={section === item}
              onClick={() => { setSection(item); setMessage('') }}>
              <SectionIcon section={item} />
              <span>{item}</span>
            </button>
          ))}
        </nav>

        {isLoading && <p className="admin-message" role="status">Loading marketplace data...</p>}
        {error && <p className="admin-error" role="alert">{error}</p>}
        {message && <p className="admin-success" role="status">{message}</p>}

        {!isLoading && (
          <section className="admin-management">
            <div className="admin-section-heading">
              <div>
                <h2>{headings[section].title}</h2>
                <p>{headings[section].description}</p>
              </div>
              {section === 'Reports' && (
                <select aria-label="Filter reports by status" value={reportFilter}
                  onChange={event => setReportFilter(event.target.value as 'ALL' | ReportStatus)}>
                  <option value="ALL">All reports</option>
                  <option value="PENDING">Pending</option>
                  {statuses.map(status => (
                    <option key={status} value={status}>{formatStatus(status)}</option>
                  ))}
                </select>
              )}
            </div>

            {/* Reports */}
            {section === 'Reports' && (
              visibleReports.length === 0 ? <p className="admin-empty">No reports found.</p> : (
                <div className="admin-list">
                  {visibleReports.map(report => (
                    <button key={report.id} type="button" className="admin-report-row"
                      disabled={isSaving} onClick={() => openReport(report)}>
                      <div className="admin-row-main">
                        <strong>{report.product_listings.name}</strong>
                        <small>{report.product_listings.producer_profiles.business_name}</small>
                        <p>{report.reason}</p>
                      </div>
                      <div className="admin-report-meta">
                        <Status value={report.status} />
                        <small>{formatDate(report.created_at)}</small>
                      </div>
                      <span className="admin-chevron">›</span>
                    </button>
                  ))}
                </div>
              )
            )}

            {/* Product listings */}
            {section === 'Listings' && (
              listings.length === 0 ? <p className="admin-empty">No product listings found.</p> : (
                <div className="admin-list">
                  {listings.map(listing => (
                    <div className="admin-listing-row" key={listing.id}>
                      <div className="admin-row-main">
                        <strong>{listing.name}</strong>
                        <small>{listing.producer_profiles.business_name} · {listing.categories.name}</small>
                        <small>{listing._count.reports} report(s)</small>
                      </div>
                      <div className="admin-row-price">
                        <strong>€{Number(listing.price).toFixed(2)}</strong>
                        <small>per {listing.unit}</small>
                      </div>
                      <Status value={listing.is_hidden ? 'hidden' : listing.is_active ? 'active' : 'inactive'} />
                      <ActionButton label={listing.is_hidden ? 'Restore' : 'Hide Listing'}
                        danger={!listing.is_hidden} disabled={isSaving}
                        onClick={() => changeVisibility(listing.id, !listing.is_hidden)} />
                    </div>
                  ))}
                </div>
              )
            )}

            {/* User accounts */}
            {section === 'Users' && (
              users.length === 0 ? <p className="admin-empty">No user accounts found.</p> : (
                <div className="admin-list">
                  {users.map(user => (
                    <div className="admin-user-row" key={user.id}>
                      <div className="admin-row-main">
                        <strong>{user.full_name}</strong>
                        <small>{user.producer_profiles?.business_name ?? user.restaurant_profiles?.restaurant_name}</small>
                        <small>{user.email}</small>
                      </div>
                      <span className="admin-role">{formatStatus(user.role)}</span>
                      <Status value={user.is_blocked ? 'hidden' : 'active'}
                        label={user.is_blocked ? 'Blocked' : 'Active'} />
                      <ActionButton label={user.is_blocked ? 'Unblock' : 'Block Account'}
                        danger={!user.is_blocked} disabled={isSaving}
                        onClick={() => changeUserBlock(user.id, !user.is_blocked)} />
                    </div>
                  ))}
                </div>
              )
            )}
          </section>
        )}
      </div>

      {/* Report review dialog */}
      <dialog ref={dialogRef} className="admin-review-dialog"
        aria-labelledby="admin-review-title"
        onCancel={event => { if (isSaving) event.preventDefault() }}
        onClose={() => setSelectedReportId(null)}>
        {selectedReport && product && (
          <>
            <header className="admin-dialog-header">
              <h2 id="admin-review-title">Review Report</h2>
              <button type="button" className="admin-dialog-close" aria-label="Close report"
                disabled={isSaving} onClick={closeReport}>&times;</button>
            </header>

            <div className="admin-review-product">
              <h3>{product.name}</h3>
              <p>{product.producer_profiles.business_name}</p>
              <div className="admin-review-images">
                {product.product_images.length > 0 ? product.product_images.map(image => (
                  <a key={image.id} href={new URL(image.image_url, API_URL).href}
                    target="_blank" rel="noopener noreferrer">
                    <img src={new URL(image.image_url, API_URL).href} alt={product.name} />
                  </a>
                )) : <p>No product images available.</p>}
              </div>
              <h4>Product description</h4>
              <p>{product.description || 'No description provided.'}</p>
            </div>

            <div className="admin-report-information">
              <h4>Report details</h4>
              <p><strong>Reported by: </strong>{selectedReport.restaurant_profiles.restaurant_name}</p>
              <p><strong>Date: </strong>{formatDate(selectedReport.created_at)}</p>
              <p><strong>Current status: </strong>{formatStatus(selectedReport.status)}</p>
              {selectedReport.users && <p><strong>Reviewed by: </strong>{selectedReport.users.full_name}</p>}
              <div className="admin-report-reason">
                <strong>Reason for reporting</strong>
                <p>{selectedReport.reason}</p>
              </div>
            </div>

            <div className="admin-review-fields">
              <label htmlFor="admin-notes">Administrative notes</label>
              <textarea id="admin-notes" rows={4} maxLength={1000}
                placeholder="Enter review notes..." value={adminNotes}
                disabled={isSaving} onChange={event => setAdminNotes(event.target.value)} />
              <label htmlFor="admin-review-status">Report status</label>
              <select id="admin-review-status" value={reviewStatus} disabled={isSaving}
                onChange={event => setReviewStatus(event.target.value as ReviewStatus)}>
                {statuses.map(status => (
                  <option key={status} value={status}>{formatStatus(status)}</option>
                ))}
              </select>
            </div>

            <div className="admin-moderation-actions">
              <ActionButton label={product.is_hidden ? 'Restore Listing' : 'Hide Listing'}
                danger={!product.is_hidden} disabled={isSaving}
                onClick={() => changeVisibility(product.id, !product.is_hidden, true)} />
              {selectedProducer && (
                <ActionButton label={selectedProducer.is_blocked ? 'Unblock Producer' : 'Block Producer'}
                  danger={!selectedProducer.is_blocked} disabled={isSaving}
                  onClick={() => changeUserBlock(selectedProducer.id, !selectedProducer.is_blocked, true)} />
              )}
            </div>

            {dialogError && <p className="admin-error" role="alert">{dialogError}</p>}
            {error && <p className="admin-error" role="alert">{error}</p>}
            {message && <p className="admin-success" role="status">{message}</p>}

            <footer className="admin-dialog-footer">
              <ActionButton label="Close" disabled={isSaving} onClick={closeReport} />
              <button type="button" className="admin-save-button"
                disabled={isSaving} onClick={saveReview}>
                {isSaving ? 'Saving...' : 'Save Review'}
              </button>
            </footer>
          </>
        )}
      </dialog>
    </div>
  )
}
