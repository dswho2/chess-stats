/**
 * Error Message Component
 * Displays error messages with optional retry button
 */

interface ErrorMessageProps {
  error: Error;
  onRetry?: () => void;
  title?: string;
}

export function ErrorMessage({
  error,
  onRetry,
  title = 'Error Loading Data',
}: ErrorMessageProps) {
  return (
    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6 text-center">
      <div className="flex flex-col items-center gap-3">
        {/* Error Icon */}
        <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/40 flex items-center justify-center">
          <svg
            className="w-6 h-6 text-red-600 dark:text-red-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>

        {/* Error Message */}
        <div>
          <p className="text-red-600 dark:text-red-400 font-semibold">{title}</p>
          <p className="text-sm text-red-500 dark:text-red-300 mt-2">{error.message}</p>
        </div>

        {/* Retry Button */}
        {onRetry && (
          <button
            onClick={onRetry}
            className="mt-2 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-md font-medium transition-colors"
          >
            Try Again
          </button>
        )}

        {/* Help Text */}
        <p className="text-xs text-red-400 dark:text-red-500 mt-2">
          Make sure the backend server is running on http://localhost:4000
        </p>
      </div>
    </div>
  );
}

/**
 * Inline Error Message (for smaller spaces)
 */
export function InlineErrorMessage({ error }: { error: Error }) {
  return (
    <div className="inline-flex items-center gap-2 text-red-500 text-sm">
      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
        <path
          fillRule="evenodd"
          d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
          clipRule="evenodd"
        />
      </svg>
      <span>{error.message}</span>
    </div>
  );
}
