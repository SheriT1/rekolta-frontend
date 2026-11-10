import { useState } from 'react'
import type { SubmitEventHandler } from 'react'
import ProducerDashboard from './ProducerDashboard'

type AuthMode = 'login' | 'register'
type UserRole = 'PRODUCER' | 'RESTAURANT'

type AuthUser = {
  id: string
  email: string
  fullName: string
  role: UserRole
}

const API_URL = 'http://localhost:3000'

type AuthProps = {
  currentUser: AuthUser | null
  onLogin: (user: AuthUser) => void
}

export default function Auth({ currentUser, onLogin }: AuthProps) {
  const [mode, setMode] = useState<AuthMode>('login')
  const [role, setRole] = useState<UserRole>('PRODUCER')

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordError, setPasswordError] = useState('')

  const [serverError, setServerError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  // Switch between Login and Registration.
  const changeMode = (newMode: AuthMode) => {
    if (isLoading) return

    setMode(newMode)
    setPassword('')
    setConfirmPassword('')
    setPasswordError('')
    setServerError('')
    setSuccessMessage('')
  }

  // Send Login or Registration data to NestJS.
  const handleSubmit: SubmitEventHandler<HTMLFormElement> = async (event) => {
    event.preventDefault()

    if (isLoading) return

    setPasswordError('')
    setServerError('')
    setSuccessMessage('')

    const form = event.currentTarget
    const formData = new FormData(form)

    // LOGIN
    if (mode === 'login') {
      const loginData = {
        email: String(formData.get('email') ?? '').trim(),
        password,
      }

      setIsLoading(true)

      try {
        const response = await fetch(`${API_URL}/auth/login`, {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(loginData),
        })

        if (!response.ok) {
          const errorData = await response.json().catch(() => null)
          const message = errorData?.message

          throw new Error(
            Array.isArray(message)
              ? message.join(', ')
              : typeof message === 'string'
                ? message
                : 'Login failed. Please try again.'
          )
        }

        const data: { user: AuthUser } = await response.json()

        onLogin(data.user)
        setSuccessMessage('Credentials verified successfully!')
        setPassword('')
        form.reset()
      } catch (error) {
        setServerError(
          error instanceof Error
            ? error.message
            : 'Unable to connect to the server.'
        )
      } finally {
        setIsLoading(false)
      }

      return
    }

    // REGISTER
    if (password !== confirmPassword) {
      setPasswordError('Passwords do not match.')
      return
    }

    const registrationData = {
      fullName: String(formData.get('fullName') ?? '').trim(),
      email: String(formData.get('email') ?? '').trim(),
      password,
      role,
      businessName: String(formData.get('businessName') ?? '').trim(),
      phone: String(formData.get('phone') ?? '').trim(),
      address: String(formData.get('address') ?? '').trim(),
      city: String(formData.get('city') ?? '').trim(),
    }

    setIsLoading(true)

    try {
      const response = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(registrationData),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => null)
        const message = errorData?.message

        throw new Error(
          Array.isArray(message)
            ? message.join(', ')
            : typeof message === 'string'
              ? message
              : 'Registration failed. Please try again.'
        )
      }

      setSuccessMessage('Account created successfully!')
      form.reset()
      setPassword('')
      setConfirmPassword('')
    } catch (error) {
      setServerError(
        error instanceof Error
          ? error.message
          : 'Unable to connect to the server.'
      )
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <main className="auth-page">
      <section
        className={
          currentUser?.role === 'PRODUCER'
            ? 'auth-card auth-card--producer'
            : 'auth-card'
        }
      >
        {currentUser?.role !== 'PRODUCER' && (
          <>
            <h1>Rekolta</h1>
            <p>Connecting local producers and restaurants</p>
          </>
        )}

        {currentUser ? (
          <div className="auth-account">
            {currentUser.role === 'PRODUCER' ? (
              <ProducerDashboard fullName={currentUser.fullName} />
            ) : (
              <>
                <h2>Welcome, {currentUser.fullName}!</h2>
                <p>You are logged in to Rekolta.</p>
                <p><strong>Email:</strong> {currentUser.email}</p>
                <p><strong>Account Type:</strong> Restaurant</p>
              </>
            )}
          </div>
        ) : (
          <>
            {/* Switch between login and registration forms. */}
            <div className="auth-tabs">
              <button
                type="button"
                className={mode === 'login' ? 'active' : ''}
                onClick={() => changeMode('login')}
                aria-pressed={mode === 'login'}
                disabled={isLoading}
              >
                Log In
              </button>

              <button
                type="button"
                className={mode === 'register' ? 'active' : ''}
                onClick={() => changeMode('register')}
                aria-pressed={mode === 'register'}
                disabled={isLoading}
              >
                Sign Up
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              {/* Registration-specific fields. */}
              {mode === 'register' && (
                <>
                  <label htmlFor="role">Account Type</label>
                  <select
                    id="role"
                    value={role}
                    onChange={(event) =>
                      setRole(event.target.value as UserRole)
                    }
                    disabled={isLoading}
                  >
                    <option value="PRODUCER">Producer</option>
                    <option value="RESTAURANT">Restaurant</option>
                  </select>

                  <label htmlFor="fullName">Full Name</label>
                  <input
                    id="fullName"
                    name="fullName"
                    type="text"
                    placeholder="Your full name"
                    autoComplete="name"
                    maxLength={150}
                    required
                    disabled={isLoading}
                  />
                </>
              )}

              {/* Fields shared by Login and Registration. */}
              <label htmlFor="email">Email</label>
              <input
                id="email"
                name="email"
                type="email"
                placeholder="you@example.com"
                autoComplete="email"
                maxLength={255}
                required
                disabled={isLoading}
              />

              <label htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                placeholder="Enter your password"
                autoComplete={
                  mode === 'login'
                    ? 'current-password'
                    : 'new-password'
                }
                value={password}
                onChange={(event) => {
                  setPassword(event.target.value)
                  setPasswordError('')
                }}
                minLength={mode === 'register' ? 8 : undefined}
                required
                disabled={isLoading}
              />

              {/* Registration-only fields. */}
              {mode === 'register' && (
                <>
                  <label htmlFor="confirmPassword">
                    Confirm Password
                  </label>
                  <input
                    id="confirmPassword"
                    type="password"
                    placeholder="Re-enter your password"
                    autoComplete="new-password"
                    value={confirmPassword}
                    onChange={(event) => {
                      setConfirmPassword(event.target.value)
                      setPasswordError('')
                    }}
                    minLength={8}
                    required
                    disabled={isLoading}
                  />

                  {passwordError && (
                    <p className="auth-error" role="alert">
                      {passwordError}
                    </p>
                  )}

                  <label htmlFor="businessName">
                    {role === 'PRODUCER'
                      ? 'Farm or Business Name'
                      : 'Restaurant Name'}
                  </label>
                  <input
                    id="businessName"
                    name="businessName"
                    type="text"
                    placeholder="Business name"
                    maxLength={200}
                    required
                    disabled={isLoading}
                  />

                  <label htmlFor="phone">Phone Number</label>
                  <input
                    id="phone"
                    name="phone"
                    type="tel"
                    placeholder="+359 ..."
                    autoComplete="tel"
                    maxLength={30}
                    required
                    disabled={isLoading}
                  />

                  <label htmlFor="address">Address</label>
                  <input
                    id="address"
                    name="address"
                    type="text"
                    placeholder="Street address"
                    autoComplete="street-address"
                    maxLength={255}
                    required
                    disabled={isLoading}
                  />

                  <label htmlFor="city">City</label>
                  <input
                    id="city"
                    name="city"
                    type="text"
                    placeholder="City"
                    autoComplete="address-level2"
                    maxLength={100}
                    required
                    disabled={isLoading}
                  />
                </>
              )}

              {serverError && (
                <p className="auth-error" role="alert">
                  {serverError}
                </p>
              )}

              {successMessage && (
                <p role="status">
                  {successMessage}
                </p>
              )}

              <button
                type="submit"
                className="auth-submit"
                disabled={isLoading}
              >
                {isLoading
                  ? mode === 'login'
                    ? 'Logging In...'
                    : 'Creating Account...'
                  : mode === 'login'
                    ? 'Log In'
                    : 'Create Account'}
              </button>
            </form>
          </>
        )}
      </section>
    </main>
  )
}
