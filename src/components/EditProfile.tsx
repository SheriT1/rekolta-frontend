import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import './EditProfile.css'

const API_URL = `http://${window.location.hostname}:3000`

type ProfileUser = {
  id: string
  email: string
  fullName: string
  role: 'PRODUCER' | 'RESTAURANT' | 'ADMIN'
}

type ProfileData = {
  user: ProfileUser
  profile: {
    business_name?: string
    restaurant_name?: string
    description?: string | null
    phone: string | null
    address: string | null
    city: string | null
  }
}

type Props = {
  onBack: () => void
  onSaved: (user: ProfileUser) => void
}

export default function EditProfile({ onBack, onSaved }: Props) {
  const [data, setData] = useState<ProfileData | null>(null)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    const controller = new AbortController()

    async function loadProfile() {
      try {
        const response = await fetch(`${API_URL}/auth/profile`, {
          credentials: 'include',
          signal: controller.signal,
        })

        if (!response.ok) {
          throw new Error('Unable to load your profile.')
        }

        setData(await response.json())
      } catch (err) {
        if (!controller.signal.aborted) {
          setError(err instanceof Error ? err.message : 'Unable to load profile.')
        }
      } finally {
        if (!controller.signal.aborted) setIsLoading(false)
      }
    }

    void loadProfile()
    return () => controller.abort()
  }, [])

  const isProducer = data?.user.role === 'PRODUCER'

  const initials = data?.user.fullName
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((name) => name.charAt(0).toUpperCase())
    .join('')

  const businessName = data?.profile.business_name ??
    data?.profile.restaurant_name ?? ''

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (isSaving || !data) return

    setError('')
    setSuccess('')

    const form = new FormData(event.currentTarget)
    const value = (name: string) => String(form.get(name) ?? '').trim()

    const payload = {
      fullName: value('fullName'),
      businessName: value('businessName'),
      phone: value('phone'),
      address: value('address'),
      city: value('city'),
      ...(isProducer ? { description: value('description') } : {}),
    }

    if (!payload.fullName || !payload.businessName ||
        !payload.phone || !payload.address || !payload.city) {
      setError('Please complete all required fields.')
      return
    }

    setIsSaving(true)

    try {
      const response = await fetch(`${API_URL}/auth/profile`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(
          Array.isArray(result.message)
            ? result.message.join(', ')
            : result.message || 'Unable to save profile.'
        )
      }

      setData(result)
      onSaved(result.user)
      setSuccess('Profile updated successfully.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to save profile.')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <main className="rk-profile-page">
      <div className="rk-profile-container">

        <header className="rk-profile-header">
          <div>
            <span className="rk-profile-eyebrow">YOUR ACCOUNT</span>
            <h1>My Profile</h1>
            <p>Manage your personal and business information.</p>
          </div>

          <button
            type="button"
            className="rk-profile-back"
            onClick={onBack}
            disabled={isSaving}
          >
            ← Back to Dashboard
          </button>
        </header>

        {isLoading && <p role="status">Loading profile...</p>}

        {data && (
          <>
            <section className="rk-profile-summary">
              <div className="rk-profile-avatar" aria-hidden="true">
                {initials}
              </div>

              <div className="rk-profile-identity">
                <h2>{data.user.fullName}</h2>
                <p>
                  {isProducer ? 'Producer account' : 'Restaurant account'}
                </p>
              </div>

              <div className="rk-profile-business">
                <span className="rk-profile-eyebrow">
                  {isProducer ? 'FARM INFORMATION' : 'RESTAURANT INFORMATION'}
                </span>

                <h2>{businessName}</h2>

                <div className="rk-profile-location">
                  <svg
                    width="21"
                    height="21"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    aria-hidden="true"
                  >
                    <path d="M12 2a8 8 0 0 0-8 8c0 5.5 8 12 8 12s8-6.5 8-12a8 8 0 0 0-8-8zm0 11a3 3 0 1 1 0-6 3 3 0 0 1 0 6z" />
                  </svg>

                  <span>
                    {data.profile.city || 'Location not specified'}
                  </span>
                </div>
              </div>
            </section>

            <form className="rk-profile-form" onSubmit={handleSubmit}>

              <div className="rk-profile-panels">

                <fieldset
                  className="rk-profile-panel rk-profile-personal"
                  disabled={isSaving}
                  aria-labelledby="personal-heading"
                >
                  <h2 id="personal-heading">Personal Information</h2>

                  <div className="rk-profile-grid">
                    <label>
                      Full Name
                      <input
                        name="fullName"
                        defaultValue={data.user.fullName}
                        maxLength={150}
                        autoComplete="name"
                        required
                      />
                    </label>

                    <label>
                      Email Address
                      <input
                        type="email"
                        value={data.user.email}
                        readOnly
                      />
                    </label>
                  </div>
                </fieldset>

                <fieldset
                  className="rk-profile-panel"
                  disabled={isSaving}
                  aria-labelledby="business-heading"
                >
                  <h2 id="business-heading">
                    {isProducer ? 'Farm Information' : 'Restaurant Information'}
                  </h2>

                  <div className="rk-profile-grid">
                    <label className="rk-profile-full-width">
                      {isProducer ? 'Farm or Business Name' : 'Restaurant Name'}
                      <input
                        name="businessName"
                        defaultValue={businessName}
                        maxLength={200}
                        autoComplete="organization"
                        required
                      />
                    </label>

                    <label>
                      City
                      <input
                        name="city"
                        defaultValue={data.profile.city ?? ''}
                        maxLength={100}
                        autoComplete="address-level2"
                        required
                      />
                    </label>

                    <label>
                      Phone Number
                      <input
                        name="phone"
                        type="tel"
                        defaultValue={data.profile.phone ?? ''}
                        maxLength={30}
                        autoComplete="tel"
                        required
                      />
                    </label>

                    <label className="rk-profile-full-width">
                      Address
                      <input
                        name="address"
                        defaultValue={data.profile.address ?? ''}
                        maxLength={255}
                        autoComplete="street-address"
                        required
                      />
                    </label>
                  </div>
                </fieldset>

              </div>

              {isProducer && (
                <fieldset
                  className="rk-profile-description"
                  disabled={isSaving}
                >
                  <label htmlFor="farm-description">
                    Farm Description
                  </label>

                  <div>
                    <textarea
                      id="farm-description"
                      name="description"
                      defaultValue={data.profile.description ?? ''}
                      maxLength={1000}
                      rows={3}
                      placeholder="Tell restaurants about your farm and products."
                    />
                    <small>Maximum 1,000 characters. Optional.</small>
                  </div>
                </fieldset>
              )}

              {error && (
                <p className="rk-profile-error" role="alert">{error}</p>
              )}

              {success && (
                <p className="rk-profile-success" role="status">{success}</p>
              )}

              <div className="rk-profile-actions">
                <button
                  type="button"
                  onClick={onBack}
                  disabled={isSaving}
                >
                  Cancel
                </button>

                <button type="submit" disabled={isSaving}>
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </>
        )}

        {!data && error && (
          <p className="rk-profile-error" role="alert">{error}</p>
        )}

      </div>
    </main>
  )
}