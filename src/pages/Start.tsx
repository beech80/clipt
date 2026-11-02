import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import './clipt-launch.css';

/** Public entrance only; account, MFA and beta checks still protect the application. */
export default function Start({ onEnter }: { onEnter?: () => void } = {}) {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  return <main className="clipt-launch" aria-labelledby="clipt-launch-title">
    <img className="clipt-launch-art" src="/clipt-launch-space-2026.webp" alt="" aria-hidden="true" loading="eager" decoding="async" />
    <div className="clipt-launch-shade" aria-hidden="true" />
    <section className="clipt-launch-content">
      <p className="clipt-launch-kicker">WELCOME TO YOUR NEXT LEVEL</p>
      <h1 id="clipt-launch-title" className="clipt-launch-wordmark">CLIPT</h1>
      <p className="clipt-launch-tagline">PEOPLE. CLIPS. COMMUNITY.</p>
      <div className="clipt-launch-entry">
        {loading && <div className="clipt-launch-loading" aria-hidden="true"><span /></div>}
        <p className="clipt-launch-status" role="status">{loading ? 'Checking your session…' : 'Ready when you are.'}</p>
        <button type="button" className="clipt-launch-enter" disabled={loading}
          onClick={() => onEnter ? onEnter() : navigate(user ? '/clipts' : '/login')}>
          {loading ? 'LOADING CLIPT…' : 'ENTER CLIPT'}
          {!loading && <span aria-hidden="true">→</span>}
        </button>
      </div>
      <p className="clipt-launch-motto">A HIGHER LEVEL TOGETHER.</p>
    </section>
    <footer className="clipt-launch-footer">
      <span>PLAY. WATCH. CONNECT.</span>
      <nav aria-label="Legal"><Link to="/privacy">Privacy</Link><Link to="/terms">Terms</Link></nav>
    </footer>
  </main>;
}
