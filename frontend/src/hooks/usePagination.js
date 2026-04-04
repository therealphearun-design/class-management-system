import { useMemo, useState } from 'react';

export function usePagination(items, itemsPerPage = 10) {
  const [currentPage, setCurrentPage] = useState(1);

  const totalPages = Math.max(1, Math.ceil(items.length / itemsPerPage));
  const effectivePage = Math.min(currentPage, totalPages);

  const currentItems = useMemo(() => {
    const indexOfLastItem = effectivePage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    return items.slice(indexOfFirstItem, indexOfLastItem);
  }, [effectivePage, items, itemsPerPage]);

  const paginate = (pageNumber) => setCurrentPage(Math.min(Math.max(pageNumber, 1), totalPages));
  const nextPage = () => setCurrentPage(prev => Math.min(prev + 1, totalPages));
  const prevPage = () => setCurrentPage(prev => Math.max(prev - 1, 1));

  return {
    currentPage: effectivePage,
    totalPages,
    currentItems,
    paginate,
    nextPage,
    prevPage,
  };
}
