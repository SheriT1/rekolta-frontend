import { useState } from 'react'
import type { SubmitEventHandler } from 'react'

// Defines the available authentication views.
type AuthMode = 'login' | 'register'

// Only producers and restaurants can register publicly.
type UserRole = 'PRODUCER' | 'RESTAURANT'

export default function Auth() {
  const [mode, setMode] = useState<AuthMode>('login')
  const [role, setRole] = useState<UserRole>('PRODUCER')

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordError, setPasswordError] = useState('')

  const [serverError, setServerError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  // Switches between login and registration forms.
  const changeMode = (newMode: AuthMode) => {
    if (isLoading) return

    setMode(newMode)
    setPassword('')
    setConfirmPassword('')
    setPasswordError('')
    setServerError('')
    setSuccessMessage('')
  }

  // Validates the form and sends registration data to NestJS.
 const handleSubmit: SubmitEventHandler<HTMLFormElement> = async (event) => {
    event.preventDefault()

    if (isLoading) return

    setPasswordError('')
    setServerError('')
    setSuccessMessage('')

    // Login will be connected in a later step.
    if (mode === 'login') {
      setServerError('Login is not available yet.')
      return
    }

    if (password !== confirmPassword) {
      setPasswordError('Passwords do not match.')
      return
    }

    const form = event.currentTarget
    const formData = new FormData(form)

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
      const response = await fetch(
        'http://localhost:3000/auth/register',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(registrationData),
        }
      )

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
      <section className="auth-card">

        {/* Application name - logo will be added later. */}
        <h1 className="auth-title">Rekolta</h1>

        <p className="auth-subtitle">
          Connecting local producers and restaurants
        </p>

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

          {/* Fields shared by login and registration. */}
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
              mode === 'login' ? 'current-password' : 'new-password'
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

          {/* Confirm Password is only shown during registration. */}
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
              ? 'Creating Account...'
              : mode === 'login'
                ? 'Log In'
                : 'Create Account'}
          </button>
        </form>
      </section>
    </main>
  )
}
