import { useState, useMemo } from 'react';

interface UsePaginationProps {
  total: number;
  limit: number;
  initialPage?: number;
}

export function usePagination({
  total,
  limit,
  initialPage = 1,
}: UsePaginationProps) {
  const [currentPage, setCurrentPage] = useState(initialPage);

  const totalPages = useMemo(() => Math.ceil(total / limit), [total, limit]);

  const hasNextPage = currentPage < totalPages;
  const hasPreviousPage = currentPage > 1;

  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const goToNextPage = () => {
    if (hasNextPage) {
      setCurrentPage(currentPage + 1);
    }
  };

  const goToPreviousPage = () => {
    if (hasPreviousPage) {
      setCurrentPage(currentPage - 1);
    }
  };

  const reset = () => {
    setCurrentPage(1);
  };

  return {
    currentPage,
    totalPages,
    hasNextPage,
    hasPreviousPage,
    goToPage,
    goToNextPage,
    goToPreviousPage,
    reset,
  };
}
