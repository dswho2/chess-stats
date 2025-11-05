/**
 * Loading Spinner Component
 * Displays a loading animation with optional message
 */

interface LoadingSpinnerProps {
  message?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function LoadingSpinner({ message = 'Loading...', size = 'md' }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'h-6 w-6',
    md: 'h-12 w-12',
    lg: 'h-16 w-16',
  };

  return (
    <div className="flex flex-col items-center justify-center py-12">
      <div
        className={`animate-spin ${sizeClasses[size]} border-4 border-[--color-accent-secondary] border-t-transparent rounded-full`}
      ></div>
      {message && (
        <p className="mt-4 text-[--color-text-secondary] text-sm">{message}</p>
      )}
    </div>
  );
}

/**
 * Inline Loading Spinner (for smaller spaces)
 */
export function InlineLoadingSpinner() {
  return (
    <div className="inline-flex items-center gap-2">
      <div className="animate-spin h-4 w-4 border-2 border-[--color-accent-secondary] border-t-transparent rounded-full"></div>
      <span className="text-sm text-[--color-text-secondary]">Loading...</span>
    </div>
  );
}
