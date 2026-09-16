import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export interface Column<T> {
  header: string;
  render: (row: T) => React.ReactNode;
  style?: React.CSSProperties;
  headerStyle?: React.CSSProperties;
}

interface GenericTableProps<T> {
  columns: Column<T>[];
  data: T[];
  itemsPerPage?: number;
  emptyMessage?: string;
  onRowClick?: (row: T) => void;
  onRowDoubleClick?: (row: T) => void;
  selectedRowKey?: (row: T) => boolean;
  onRowMouseEnter?: (row: T) => void;
  onRowMouseLeave?: () => void;
  flat?: boolean;
}

export function GenericTable<T>({
  columns,
  data,
  itemsPerPage = 10,
  emptyMessage = "Nu există date disponibile",
  onRowClick,
  onRowDoubleClick,
  selectedRowKey,
  onRowMouseEnter,
  onRowMouseLeave,
  flat = false,
}: GenericTableProps<T>) {
  const [currentPage, setCurrentPage] = useState(1);
  const [hoveredRowIndex, setHoveredRowIndex] = useState<number | null>(null);

  const dataSignature = data.map(item => {
    if (item && typeof item === 'object') {
      return (item as any).id || (item as any).name || '';
    }
    return '';
  }).join(',');

  // If the dataset items or filters actually change, reset to page 1 to prevent getting stuck out-of-bounds
  useEffect(() => {
    setCurrentPage(1);
  }, [dataSignature]);

  const [lastSelectedIndex, setLastSelectedIndex] = useState<number | null>(null);

  // Automatically snap page to show the selected item if it changes externally (e.g. clicking a pin on the map)
  useEffect(() => {
    if (selectedRowKey) {
      const selectedIndex = data.findIndex(row => selectedRowKey(row));
      if (selectedIndex !== -1 && selectedIndex !== lastSelectedIndex) {
        setLastSelectedIndex(selectedIndex);
        const targetPage = Math.floor(selectedIndex / itemsPerPage) + 1;
        setCurrentPage(targetPage);
      } else if (selectedIndex === -1 && lastSelectedIndex !== null) {
        setLastSelectedIndex(null);
      }
    }
  }, [data, selectedRowKey, lastSelectedIndex, itemsPerPage]);

  const totalPages = Math.max(1, Math.ceil(data.length / itemsPerPage));
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentData = data.slice(startIndex, endIndex);

  const handlePrevPage = () => {
    if (currentPage > 1) setCurrentPage(currentPage - 1);
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) setCurrentPage(currentPage + 1);
  };

  const handlePageClick = (page: number) => {
    setCurrentPage(page);
  };

  // Generate numbered pages logic
  const getPageNumbers = () => {
    const pages = [];
    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      if (currentPage <= 3) {
        pages.push(1, 2, 3, 4, '...', totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1, '...', totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
      } else {
        pages.push(1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages);
      }
    }
    return pages;
  };

  const getPageButtonStyle = (isActive: boolean, isHovered: boolean): React.CSSProperties => {
    if (isActive) {
      return {
        ...styles.pageButton,
        backgroundColor: 'var(--purple-primary, #5D3FD3)',
        color: '#FFF',
        borderColor: 'var(--purple-primary, #5D3FD3)',
        boxShadow: '0 4px 10px rgba(93, 63, 211, 0.2)',
      };
    }
    if (isHovered) {
      return {
        ...styles.pageButton,
        backgroundColor: 'rgba(93, 63, 211, 0.05)',
        borderColor: 'var(--purple-primary, #5D3FD3)',
        color: 'var(--purple-primary, #5D3FD3)',
      };
    }
    return styles.pageButton;
  };

  const getNavButtonStyle = (isDisabled: boolean, isHovered: boolean): React.CSSProperties => {
    if (isDisabled) {
      return {
        ...styles.navButton,
        opacity: 0.35,
        cursor: 'not-allowed',
        backgroundColor: '#F3F4F6',
        borderColor: '#E5E7EB',
        color: '#9CA3AF',
      };
    }
    if (isHovered) {
      return {
        ...styles.navButton,
        backgroundColor: 'rgba(93, 63, 211, 0.05)',
        borderColor: 'var(--purple-primary, #5D3FD3)',
        color: 'var(--purple-primary, #5D3FD3)',
      };
    }
    return styles.navButton;
  };

  const getRowStyle = (isSelected: boolean, isHovered: boolean): React.CSSProperties => {
    if (isSelected) {
      return {
        ...styles.tr,
        backgroundColor: 'rgba(93, 63, 211, 0.06)',
        borderLeft: '4px solid var(--purple-primary, #5D3FD3)',
      };
    }
    if (isHovered) {
      return {
        ...styles.tr,
        backgroundColor: 'rgba(93, 63, 211, 0.02)',
      };
    }
    return styles.tr;
  };

  const [hoveredButtonKey, setHoveredButtonKey] = useState<string | null>(null);

  const currentWrapperStyle: React.CSSProperties = flat ? {
    overflowX: 'auto',
    borderRadius: 0,
    border: 'none',
    backgroundColor: 'transparent',
    boxShadow: 'none',
    backdropFilter: 'none',
  } : styles.tableWrapper;

  const currentTheadStyle: React.CSSProperties = flat ? {
    backgroundColor: 'transparent',
    borderBottom: '2px solid rgba(93, 63, 211, 0.08)',
  } : styles.thead;

  return (
    <div style={styles.container}>
      <div style={currentWrapperStyle}>
        <table style={styles.table}>
          <thead style={currentTheadStyle}>
            <tr>
              {columns.map((column, index) => (
                <th 
                  key={index} 
                  style={{
                    ...styles.th,
                    ...column.headerStyle
                  }}
                >
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {currentData.length === 0 ? (
              <tr>
                <td colSpan={columns.length} style={styles.emptyCell}>
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              currentData.map((row, rowIndex) => {
                const isSelected = selectedRowKey ? selectedRowKey(row) : false;
                const isHovered = hoveredRowIndex === rowIndex;
                
                return (
                  <tr
                    key={rowIndex}
                    onClick={() => onRowClick && onRowClick(row)}
                    onDoubleClick={() => onRowDoubleClick && onRowDoubleClick(row)}
                    onMouseEnter={() => {
                      setHoveredRowIndex(rowIndex);
                      if (onRowMouseEnter) onRowMouseEnter(row);
                    }}
                    onMouseLeave={() => {
                      setHoveredRowIndex(null);
                      if (onRowMouseLeave) onRowMouseLeave();
                    }}
                    style={getRowStyle(isSelected, isHovered)}
                  >
                    {columns.map((column, colIndex) => (
                      <td 
                        key={colIndex} 
                        style={{
                          ...styles.td,
                          ...column.style
                        }}
                      >
                        {column.render(row)}
                      </td>
                    ))}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div style={styles.paginationContainer}>
          <div style={styles.paginationInfo}>
            Afișare <span style={{ fontWeight: 700, color: 'var(--text-main, #1F2937)' }}>{startIndex + 1}</span> -{' '}
            <span style={{ fontWeight: 700, color: 'var(--text-main, #1F2937)' }}>{Math.min(endIndex, data.length)}</span> din{' '}
            <span style={{ fontWeight: 700, color: 'var(--text-main, #1F2937)' }}>{data.length}</span> elemente
          </div>
          
          <div style={styles.paginationControls}>
            {/* Prev Button */}
            <button
              onClick={handlePrevPage}
              disabled={currentPage === 1}
              onMouseEnter={() => setHoveredButtonKey('prev')}
              onMouseLeave={() => setHoveredButtonKey(null)}
              style={getNavButtonStyle(currentPage === 1, hoveredButtonKey === 'prev')}
              aria-label="Previous page"
            >
              <ChevronLeft size={16} />
            </button>

            {/* Page Buttons */}
            {getPageNumbers().map((page, index) => {
              if (page === '...') {
                return (
                  <span key={index} style={{ padding: '0 8px', fontSize: '12px', color: '#9CA3AF' }}>
                    ...
                  </span>
                );
              }
              const isPageActive = currentPage === page;
              const buttonKey = `page-${page}`;
              const isButtonHovered = hoveredButtonKey === buttonKey;
              
              return (
                <button
                  key={index}
                  onClick={() => handlePageClick(page as number)}
                  onMouseEnter={() => setHoveredButtonKey(buttonKey)}
                  onMouseLeave={() => setHoveredButtonKey(null)}
                  style={getPageButtonStyle(isPageActive, isButtonHovered)}
                >
                  {page}
                </button>
              );
            })}

            {/* Next Button */}
            <button
              onClick={handleNextPage}
              disabled={currentPage === totalPages}
              onMouseEnter={() => setHoveredButtonKey('next')}
              onMouseLeave={() => setHoveredButtonKey(null)}
              style={getNavButtonStyle(currentPage === totalPages, hoveredButtonKey === 'next')}
              aria-label="Next page"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    width: '100%',
    gap: '16px',
    backgroundColor: 'transparent'
  },
  tableWrapper: {
    overflowX: 'auto',
    borderRadius: '16px',
    border: '1px solid var(--glass-border, #E5E7EB)',
    backgroundColor: 'rgba(255, 255, 255, 0.45)', 
    boxShadow: '0 4px 18px rgba(0, 0, 0, 0.02)',
    backdropFilter: 'blur(8px)',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    textAlign: 'left',
    fontSize: '13px',
    color: 'var(--text-main, #1F2937)',
    fontFamily: 'var(--font-sans, system-ui, sans-serif)',
    tableLayout: 'fixed',
  },
  thead: {
    backgroundColor: 'rgba(93, 63, 211, 0.04)', 
    borderBottom: '1px solid var(--glass-border, #E5E7EB)',
  },
  th: {
    padding: '12px 18px',
    fontSize: '11px',
    fontWeight: '700',
    color: 'var(--text-muted, #4B5563)',
    textTransform: 'uppercase',
    letterSpacing: '0.8px',
  },
  tr: {
    borderBottom: '1px solid rgba(0, 0, 0, 0.03)',
    transition: 'all 0.2s ease',
    cursor: 'pointer',
    borderLeft: '4px solid transparent',
  },
  td: {
    padding: '16px 18px',
    verticalAlign: 'middle',
  },
  emptyCell: {
    padding: '40px',
    textAlign: 'center',
    color: 'var(--text-muted, #6B7280)',
    fontStyle: 'italic',
  },
  paginationContainer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '12px 4px 4px 4px',
    marginTop: '4px',
    flexWrap: 'wrap',
    gap: '12px'
  },
  paginationInfo: {
    fontSize: '12.5px',
    color: 'var(--text-muted, #4B5563)',
    fontWeight: '500',
  },
  paginationControls: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  },
  pageButton: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '0 8px',
    fontSize: '12px',
    fontWeight: '700',
    borderRadius: '10px',
    border: '1px solid var(--glass-border, #E5E7EB)',
    backgroundColor: '#FFF',
    color: 'var(--text-main, #374151)',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    minWidth: '32px',
    height: '32px',
    outline: 'none',
  },
  navButton: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '32px',
    height: '32px',
    borderRadius: '10px',
    border: '1px solid var(--glass-border, #E5E7EB)',
    backgroundColor: '#FFF',
    color: 'var(--text-main, #374151)',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    outline: 'none',
  }
};
