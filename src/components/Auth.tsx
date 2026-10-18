
/**
 * Auth component
 *
 * This component will contain the login and registration forms
 * for the Rekolta web application.
 *
 * Producers and restaurants will be able to register.
 * All users, including administrators, will be able to log in.
 */

import { useState } from 'react'

// Defines the available authentication views.
type AuthMode = 'login' | 'register'

// Only producers and restaurants can register publicly.
type UserRole = 'PRODUCER' | 'RESTAURANT'

export default function Auth() {
  // Controls which form is displayed.
  const [mode, setMode] = useState<AuthMode>('login')

  // Stores the selected account type during registration.
  const [role, setRole] = useState<UserRole>('PRODUCER')

  // Temporarily prevents form submission until the backend is connected.
  const handleSubmit = (event: React.SubmitEvent<HTMLFormElement>) => {
    event.preventDefault()
  }

  return (
    <main className="auth-page">
      <section className="auth-card">
        <h1>Rekolta</h1>
        <p>Connecting local producers and restaurants</p>

        {/* Switch between login and registration forms. */}
        <div className="auth-tabs">
          <button type="button" onClick={() => setMode('login')}>
            Log In
          </button>
          <button type="button" onClick={() => setMode('register')}>
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
              <input id="fullName" type="text" required />
            </>
          )}

          {/* Fields shared by login and registration. */}
          <label htmlFor="email">Email</label>
          <input id="email" type="email" required />

          <label htmlFor="password">Password</label>
          <input
            id="password"
            type="password"
            minLength={mode === 'register' ? 8 : undefined}
            required
          />

          {/* Additional information required for registration. */}
          {mode === 'register' && (
            <>
              <label htmlFor="businessName">
                {role === 'PRODUCER'
                  ? 'Farm or Business Name'
                  : 'Restaurant Name'}
              </label>
              <input id="businessName" type="text" required />

              <label htmlFor="phone">Phone Number</label>
              <input id="phone" type="tel" required />

              <label htmlFor="address">Address</label>
              <input id="address" type="text" required />

              <label htmlFor="city">City</label>
              <input id="city" type="text" required />
            </>
          )}

          <button type="submit">
            {mode === 'login' ? 'Log In' : 'Create Account'}
          </button>
        </form>
      </section>
    </main>
  )
}
