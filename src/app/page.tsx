import Link from "next/link";

// Let's just render the generic landing page.

export default function Home() {
  return (
    <div className="container">
      <section className="hero">
        <h1>Write Code. Run Anywhere.</h1>
        <p>
          A fast, lightweight, and clean code compiler platform. Practice algorithms, 
          write scripts, and compile code in multiple languages directly from your browser.
        </p>
        <div style={{ display: 'flex', gap: '16px', justifyContent: 'center' }}>
          <Link href="/dashboard" className="btn-primary" style={{ padding: '14px 32px', fontSize: '16px' }}>
            Start Coding Now
          </Link>
          <Link href="/login" className="btn-secondary" style={{ padding: '14px 32px', fontSize: '16px' }}>
            Log In
          </Link>
        </div>
      </section>
    </div>
  );
}
