import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import ErrorModal from '../Components/ErrorModal';

const ErrorContext = createContext({ showError: () => {} });

export function useError() {
  return useContext(ErrorContext);
}

export function ErrorProvider({ children }) {
  const [error, setError] = useState(null);

  const showError = useCallback((message, title = 'Error') => {
    setError({ message, title });
  }, []);

  const onClose = useCallback(() => setError(null), []);

  const value = useMemo(() => ({ showError }), [showError]);

  return (
    <ErrorContext.Provider value={value}>
      {children}
      {error && (
        <ErrorModal title={error.title} message={error.message} onClose={onClose} />
      )}
    </ErrorContext.Provider>
  );
}


