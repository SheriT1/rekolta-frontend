
import { useState } from 'react'
import type { FormEvent } from 'react'

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

  // Switches between login and registration forms.
  const changeMode = (newMode: AuthMode) => {
    setMode(newMode)
    setPassword('')
    setConfirmPassword('')
    setPasswordError('')
  }

  // Validates password confirmation before backend integration.
  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (mode === 'register' && password !== confirmPassword) {
      setPasswordError('Passwords do not match.')
      return
    }

    setPasswordError('')

    // Backend authentication will be connected later.
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
          >
            Log In
          </button>

          <button
            type="button"
            className={mode === 'register' ? 'active' : ''}
            onClick={() => changeMode('register')}
            aria-pressed={mode === 'register'}
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
              >
                <option value="PRODUCER">Producer</option>
                <option value="RESTAURANT">Restaurant</option>
              </select>

              <label htmlFor="fullName">Full Name</label>
              <input
                id="fullName"
                type="text"
                placeholder="Your full name"
                autoComplete="name"
                required
              />
            </>
          )}

          {/* Fields shared by login and registration. */}
          <label htmlFor="email">Email</label>
          <input
            id="email"
            type="email"
            placeholder="you@example.com"
            autoComplete="email"
            required
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
                type="text"
                placeholder="Business name"
                required
              />

              <label htmlFor="phone">Phone Number</label>
              <input
                id="phone"
                type="tel"
                placeholder="+359 ..."
                autoComplete="tel"
                required
              />

              <label htmlFor="address">Address</label>
              <input
                id="address"
                type="text"
                placeholder="Street address"
                autoComplete="street-address"
                required
              />

              <label htmlFor="city">City</label>
              <input
                id="city"
                type="text"
                placeholder="City"
                autoComplete="address-level2"
                required
              />
            </>
          )}

          <button type="submit" className="auth-submit">
            {mode === 'login' ? 'Log In' : 'Create Account'}
          </button>
        </form>
      </section>
    </main>
  )
}
