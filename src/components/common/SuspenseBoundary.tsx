import React, { Suspense } from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import { LoadingFallback, ErrorFallback } from '@/components/ui/LoadingStates';

interface SuspenseBoundaryProps {
  children: React.ReactNode;
  loadingMessage?: string;
  errorMessage?: string;
  loadingVariant?: 'default' | 'spinner' | 'skeleton' | 'pulse' | 'dots' | 'gaming';
  fallbackSize?: 'sm' | 'md' | 'lg';
  fullScreen?: boolean;
  className?: string;
  onReset?: () => void;
}

export const SuspenseBoundary: React.FC<SuspenseBoundaryProps> = ({
  children,
  loadingMessage = 'Loading...',
  errorMessage = 'Something went wrong',
  loadingVariant = 'gaming',
  fallbackSize = 'md',
  fullScreen = false,
  className = '',
  onReset
}) => {
  return (
    <ErrorBoundary
      FallbackComponent={({ error, resetErrorBoundary }) => (
        <ErrorFallback 
          error={error} 
          resetErrorBoundary={resetErrorBoundary}
          message={errorMessage}
          className={className}
        />
      )}
      onReset={onReset}
    >
      <Suspense
        fallback={
          <LoadingFallback
            message={loadingMessage}
            variant={loadingVariant}
            size={fallbackSize}
            fullscreen={fullScreen}
            className={className}
          />
        }
      >
        {children}
      </Suspense>
    </ErrorBoundary>
  );
};

export default SuspenseBoundary;
