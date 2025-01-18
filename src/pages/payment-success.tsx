import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

export default function PaymentSuccess() {
  const navigate = useNavigate();

  useEffect(() => {
    toast.success('Payment successful! Thank you for your purchase.');
    // Redirect to home after 3 seconds
    const timeout = setTimeout(() => {
      navigate('/');
    }, 3000);

    return () => clearTimeout(timeout);
  }, [navigate]);

  return (
    <div className="container mx-auto px-4 py-16 text-center">
      <h1 className="text-4xl font-bold mb-4">Payment Successful!</h1>
      <p className="text-xl text-muted-foreground mb-8">
        Thank you for your purchase. You will be redirected shortly...
      </p>
    </div>
  );
}