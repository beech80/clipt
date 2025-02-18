
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

export default function PaymentCancelled() {
  const navigate = useNavigate();

  useEffect(() => {
    toast.error('Payment was cancelled.');
    // Redirect to home after 3 seconds
    const timeout = setTimeout(() => {
      navigate('/');
    }, 3000);

    return () => clearTimeout(timeout);
  }, [navigate]);

  return (
    <div className="container mx-auto px-4 py-16 text-center">
      <h1 className="text-4xl font-bold mb-4">Payment Cancelled</h1>
      <p className="text-xl text-muted-foreground mb-8">
        Your payment was cancelled. You will be redirected shortly...
      </p>
    </div>
  );
}
