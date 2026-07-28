import React, { useState, useMemo } from 'react';
import { Search, Download, ChevronLeft, ChevronRight, MoreVertical, ArrowUpDown, Filter } from 'lucide-react';

export default function ExcelTable({
  columns,
  data,
  searchPlaceholder = "Search data...",
  searchKeys = [], // array of fields to search on
  filterOptions = [], // array of { label, key, options: [string] }
  actions = [], // array of { label, onClick }
  onRowClick = null,
  tableName = "Exported_Data"
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilters, setActiveFilters] = useState({});
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [openActionRowId, setOpenActionRowId] = useState(null);

  // Reset page when search or filters change
  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1);
  };

  const handleFilterChange = (key, value) => {
    setActiveFilters(prev => ({
      ...prev,
      [key]: value
    }));
    setCurrentPage(1);
  };

  // 1. Filter data
  const filteredData = useMemo(() => {
    return data.filter(row => {
      // Search logic
      if (searchQuery.trim() !== '' && searchKeys.length > 0) {
        const matchesSearch = searchKeys.some(key => {
          const val = row[key];
          if (val === undefined || val === null) return false;
          return String(val).toLowerCase().includes(searchQuery.toLowerCase());
        });
        if (!matchesSearch) return false;
      }

      // Filter select logic
      for (const [key, value] of Object.entries(activeFilters)) {
        if (value && value !== 'All') {
          if (String(row[key]) !== String(value)) return false;
        }
      }

      return true;
    });
  }, [data, searchQuery, searchKeys, activeFilters]);

  // 2. Sort data
  const sortedData = useMemo(() => {
    if (!sortConfig.key) return filteredData;
    
    return [...filteredData].sort((a, b) => {
      const aVal = a[sortConfig.key];
      const bVal = b[sortConfig.key];
      
      if (aVal === undefined || aVal === null) return 1;
      if (bVal === undefined || bVal === null) return -1;

      // Handle numbers or scores
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortConfig.direction === 'asc' ? aVal - bVal : bVal - aVal;
      }

      // Handle strings
      const strA = String(aVal).toLowerCase();
      const strB = String(bVal).toLowerCase();
      if (strA < strB) return sortConfig.direction === 'asc' ? -1 : 1;
      if (strA > strB) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filteredData, sortConfig]);

  // 3. Paginate data
  const totalRows = sortedData.length;
  const totalPages = Math.ceil(totalRows / pageSize) || 1;
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedData.slice(start, start + pageSize);
  }, [sortedData, currentPage, pageSize]);

  const startRowIndex = totalRows === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endRowIndex = Math.min(currentPage * pageSize, totalRows);

  // Sorting handler
  const requestSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  // Dropdown toggle
  const toggleActionMenu = (rowId, e) => {
    e.stopPropagation();
    if (openActionRowId === rowId) {
      setOpenActionRowId(null);
    } else {
      setOpenActionRowId(rowId);
    }
  };

  // Close actions dropdown when clicking elsewhere
  React.useEffect(() => {
    const closeMenu = () => setOpenActionRowId(null);
    document.addEventListener('click', closeMenu);
    return () => document.removeEventListener('click', closeMenu);
  }, []);

  // Export functions
  const convertToCSV = (arr) => {
    if (arr.length === 0) return '';
    const headers = columns.map(col => col.header).join(',');
    const rows = arr.map(row => {
      return columns.map(col => {
        let val = row[col.accessor];
        // escape double quotes
        const valStr = val !== undefined && val !== null ? String(val).replace(/"/g, '""') : '';
        return `"${valStr}"`;
      }).join(',');
    });
    return [headers, ...rows].join('\n');
  };

  const handleExportCSV = (e) => {
    e.stopPropagation();
    const csvContent = convertToCSV(sortedData);
    const blob = new Blob([new Uint8Array([0xEF, 0xBB, 0xBF]), csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `${tableName}_CSV_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportExcel = (e) => {
    e.stopPropagation();
    let tabContent = columns.map(col => col.header).join('\t') + '\n';
    sortedData.forEach(row => {
      tabContent += columns.map(col => {
        const val = row[col.accessor];
        return val !== undefined && val !== null ? String(val).replace(/\t/g, ' ') : '';
      }).join('\t') + '\n';
    });

    const blob = new Blob([new Uint8Array([0xEF, 0xBB, 0xBF]), tabContent], { type: 'application/vnd.ms-excel;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `${tableName}_Excel_${new Date().toISOString().split('T')[0]}.xls`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Status badge selector helper
  const renderStatusBadge = (val) => {
    const cleanVal = String(val).toLowerCase().replace(/\s+/g, '_');
    let badgeClass = 'badge-suspended';
    
    if (cleanVal === 'active' || cleanVal === 'completed' || cleanVal === 'compliant' || cleanVal === 'approved') {
      badgeClass = 'badge-active';
    } else if (cleanVal === 'pending' || cleanVal === 'pending_review') {
      badgeClass = 'badge-pending';
    } else if (cleanVal === 'in_progress' || cleanVal === 'ai_reviewed' || cleanVal === 'under_ai_analysis' || cleanVal === 'draft_ready') {
      badgeClass = 'badge-in_progress';
    } else if (cleanVal === 'non-compliant' || cleanVal === 'non_compliant' || cleanVal === 'suspended' || cleanVal === 'overdue' || cleanVal === 'rejected') {
      badgeClass = 'badge-non-compliant';
    }

    return (
      <span className={`badge ${badgeClass}`}>
        {val}
      </span>
    );
  };

  return (
    <div className="excel-table-container">
      {/* Table Toolbar */}
      <div className="table-toolbar">
        <div className="toolbar-left">
          {searchKeys.length > 0 && (
            <div className="table-search-wrapper">
              <Search size={16} className="table-search-icon" />
              <input
                type="text"
                className="table-search-input"
                placeholder={searchPlaceholder}
                value={searchQuery}
                onChange={handleSearchChange}
              />
            </div>
          )}

          {filterOptions.map(filter => (
            <select
              key={filter.key}
              className="table-filter-select"
              value={activeFilters[filter.key] || ''}
              onChange={(e) => handleFilterChange(filter.key, e.target.value)}
            >
              <option value="">{`Filter by ${filter.label}`}</option>
              <option value="All">All</option>
              {filter.options.map(opt => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          ))}
        </div>

        <div className="toolbar-right">
          <button onClick={handleExportCSV} className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '13px' }}>
            <Download size={14} /> Export CSV
          </button>
          <button onClick={handleExportExcel} className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '13px' }}>
            <Download size={14} /> Export Excel
          </button>
        </div>
      </div>

      {/* Table Element */}
      <div className="table-scrollable">
        <table className="excel-table">
          <thead>
            <tr>
              {columns.map(col => (
                <th
                  key={col.accessor}
                  className={col.sortable !== false ? "sortable" : ""}
                  onClick={() => col.sortable !== false && requestSort(col.accessor)}
                  style={{ width: col.width || 'auto' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    {col.header}
                    {col.sortable !== false && <ArrowUpDown size={12} className="text-muted" />}
                  </div>
                </th>
              ))}
              {actions.length > 0 && <th style={{ width: '60px', textAlign: 'right' }}>Actions</th>}
            </tr>
          </thead>
          <tbody>
            {paginatedData.length === 0 ? (
              <tr>
                <td colSpan={columns.length + (actions.length > 0 ? 1 : 0)} style={{ textAlign: 'center', padding: '32px', color: 'var(--text-secondary)' }}>
                  No matching records found.
                </td>
              </tr>
            ) : (
              paginatedData.map((row, rIdx) => (
                <tr
                  key={row.id || rIdx}
                  onClick={() => onRowClick && onRowClick(row)}
                  style={{ cursor: onRowClick ? 'pointer' : 'default' }}
                >
                  {columns.map(col => {
                    const cellVal = row[col.accessor];
                    return (
                      <td key={col.accessor}>
                        {col.isStatus ? (
                          renderStatusBadge(cellVal)
                        ) : col.cell ? (
                          col.cell(row)
                        ) : (
                          cellVal !== undefined && cellVal !== null ? String(cellVal) : '-'
                        )}
                      </td>
                    );
                  })}
                  
                  {actions.length > 0 && (
                    <td style={{ textAlign: 'right' }} onClick={(e) => e.stopPropagation()}>
                      <div className="actions-cell-wrapper">
                        <button
                          className="action-trigger-btn"
                          onClick={(e) => toggleActionMenu(row.id || rIdx, e)}
                        >
                          <MoreVertical size={16} />
                        </button>
                        
                        {openActionRowId === (row.id || rIdx) && (
                          <div className="actions-dropdown-menu">
                            {actions.map((act, aIdx) => (
                              <button
                                key={aIdx}
                                className="actions-dropdown-item"
                                onClick={() => {
                                  act.onClick(row);
                                  setOpenActionRowId(null);
                                }}
                              >
                                {act.label}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="table-pagination">
        <div className="pagination-info">
          Showing <span style={{ fontWeight: 600 }}>{startRowIndex}</span> to <span style={{ fontWeight: 600 }}>{endRowIndex}</span> of <span style={{ fontWeight: 600 }}>{totalRows}</span> records
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Rows per page:</span>
            <select
              className="table-filter-select"
              style={{ padding: '4px 8px', fontSize: '13px' }}
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
            >
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
            </select>
          </div>
          
          <div className="pagination-controls">
            <button
              className="pagination-btn"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            >
              <ChevronLeft size={16} />
            </button>
            <span style={{ display: 'flex', alignItems: 'center', padding: '0 8px', fontSize: '13px', color: 'var(--text-secondary)' }}>
              Page {currentPage} of {totalPages}
            </span>
            <button
              className="pagination-btn"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
