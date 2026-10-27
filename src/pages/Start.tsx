import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import './clipt-console.css';

export default function Start() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  return <main className="clipt-start clipt-start-reference">
    <h1 className="clipt-wordmark">CLIPT</h1>
    <p className="clipt-start-tagline">PEOPLE. CLIPS. COMMUNITY.</p>
    <Button className="clipt-enter" disabled={loading}
      onClick={() => navigate(user ? '/clipts' : '/login')}>
      {loading ? 'LOADING…' : 'ENTER'}
    </Button>
    <p className="clipt-eyebrow">A HIGHER LEVEL TOGETHER.</p>
  </main>;
}
