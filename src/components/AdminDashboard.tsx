import { useState } from 'react'
import './AdminDashboard.css'

const sections = [
  { name: 'Users', description: 'Review and manage marketplace accounts.' },
  { name: 'Products', description: 'Review and moderate product listings.' },
  { name: 'Reports', description: 'Review reported products and resolve issues.' },
  { name: 'Categories', description: 'Organize marketplace product categories.' },
] as const

type Section = 'Overview' | (typeof sections)[number]['name']

export default function AdminDashboard({ fullName }: { fullName: string }) {
  const [section, setSection] = useState<Section>('Overview')

  return (
    <div className="admin-workspace">
      <aside className="admin-sidebar">
        <span className="admin-eyebrow">ADMIN PANEL</span>
        <nav aria-label="Administrator navigation">
          {(['Overview', ...sections.map((item) => item.name)] as Section[]).map((name) => (
            <button key={name} type="button" aria-current={section === name ? 'page' : undefined}
              className={section === name ? 'admin-active' : ''} onClick={() => setSection(name)}>
              {name}
            </button>
          ))}
        </nav>
      </aside>
      <main className="admin-content">
        <header className="admin-heading">
          <span className="admin-eyebrow">ADMINISTRATOR WORKSPACE</span>
          <h1>{section === 'Overview' ? 'Platform overview' : section}</h1>
          <p>{section === 'Overview' ? `Welcome back, ${fullName}. Manage the Rekolta marketplace.` : sections.find((item) => item.name === section)?.description}</p>
        </header>
        {section === 'Overview' ? (
          <>
            <div className="admin-stats">
              {['Restaurants', 'Producers', 'Product listings', 'Pending reports'].map((label) => (
                <article key={label}><span>{label}</span><strong>—</strong></article>
              ))}
            </div>
            <section className="admin-management">
              <h2>Marketplace management</h2>
              {sections.map((item) => (
                <button key={item.name} type="button" onClick={() => setSection(item.name)}>
                  <span><strong>{item.name}</strong><small>{item.description}</small></span>
                  <span aria-hidden="true">→</span>
                </button>
              ))}
            </section>
          </>
        ) : (
          <section className="admin-management">
            <h2>{section} management</h2>
            <p>This section is not connected to the server yet.</p>
          </section>
        )}
      </main>
    </div>
  )
}
