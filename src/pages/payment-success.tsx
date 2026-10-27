import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

export default function PaymentSuccess() {
  return <main className="clipt-auth mx-auto max-w-xl space-y-5 px-4 py-12">
    <h1 className="text-2xl font-bold">Returned from checkout</h1>
    <p>Returning here does not confirm payment or activate membership. Your subscription page shows the server-confirmed account status.</p>
    <Button asChild><Link to="/subscription">Check membership status</Link></Button>
  </main>;
}
