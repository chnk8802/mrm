import { useEffect } from 'react';

export const useDocumentTitle = (title) => {
  useEffect(() => {
    const prev = document.title;
    document.title = title ? `${title} | Ohmic` : 'Ohmic';
    return () => { document.title = prev; };
  }, [title]);
};