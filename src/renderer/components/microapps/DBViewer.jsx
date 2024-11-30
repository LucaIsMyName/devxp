import React, { useState, useCallback, useEffect, useMemo } from 'react';
import {
  Database, Table as TableIcon, ArrowDown, ArrowUp,
  Save, ChevronRight, ChevronDown, FileCog
} from 'lucide-react';
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  getPaginationRowModel,
  getSortedRowModel,
  getFilteredRowModel,
} from '@tanstack/react-table';
// Update this import to use the singleton instance
import { databaseService } from '../../../services/DatabaseService';
import useAppStore from '../../store/appStore';
import Alert from '../partials/Alert';
import Toast from '../partials/Toast';
import Button from '../partials/Button';

const DBViewer = ({ initialState }) => {
  const [dbPath, setDbPath] = useState(null);
  const [dbInfo, setDbInfo] = useState(null);
  const [activeTable, setActiveTable] = useState(null);
  const [tableData, setTableData] = useState({ columns: [], rows: [] });
  const [isLoading, setIsLoading] = useState(false);
  const [alert, setAlert] = useState(null);
  const [editedCells, setEditedCells] = useState(new Map());

  const updateMicroAppState = useAppStore(state => state.updateMicroAppState);

  // Initialize from saved state
  useEffect(() => {
    if (initialState?.dbPath) {
      loadDatabase(initialState.dbPath);
    }
  }, []);

  // Save state changes
  useEffect(() => {
    updateMicroAppState('DBViewer', { dbPath, activeTable });
  }, [dbPath, activeTable, updateMicroAppState]);

  const loadDatabase = async (path) => {
    try {
      setIsLoading(true);
      const buffer = await window.electronAPI.readFile(path);
      const dbData = await databaseService.loadDatabase(path, buffer);

      setDbPath(path);
      setDbInfo(dbData);
      setAlert({
        title: 'Success',
        message: `Loaded ${dbData.tables.length} tables from database`,
        variant: 'success'
      });
    } catch (error) {
      console.error('Database load error:', error);
      setAlert({
        title: 'Error',
        message: error.message,
        variant: 'error'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileSelect = async () => {
    try {
      const result = await window.electronAPI.showFileDialog();

      if (!result.canceled && result.filePaths.length > 0) {
        const filePath = result.filePaths[0];
        setIsLoading(true);

        try {
          const buffer = await window.electronAPI.readFile(filePath);
          const dbData = await databaseService.loadDatabase(filePath, buffer);

          setDbPath(filePath);
          setDbInfo(dbData);
          setAlert({
            title: 'Success',
            message: `Loaded ${dbData.tables.length} tables from database`,
            variant: 'success'
          });
        } catch (error) {
          setAlert({
            title: 'Error',
            message: `Failed to load database: ${error.message}`,
            variant: 'error'
          });
        }
      }
    } catch (error) {
      console.error('File selection error:', error);
      setAlert({
        title: 'Error',
        message: error.message,
        variant: 'error'
      });
    } finally {
      setIsLoading(false);
    }
  };



  const handleTableSelect = async (tableName) => {
    try {
      setIsLoading(true);
      setActiveTable(tableName);

      const data = await databaseService.getTableData(tableName);
      setTableData(data);
      setEditedCells(new Map());
    } catch (error) {
      setAlert({
        title: 'Error',
        message: `Failed to load table: ${error.message}`,
        variant: 'error'
      });
    } finally {
      setIsLoading(false);
    }
  };


  const handleCellEdit = useCallback((rowIndex, columnId, value) => {
    const cellKey = `${rowIndex}-${columnId}`;
    setEditedCells(prev => new Map(prev.set(cellKey, value)));

    setTableData(prev => {
      const newRows = [...prev.rows];
      newRows[rowIndex] = {
        ...newRows[rowIndex],
        [columnId]: value
      };
      return { ...prev, rows: newRows };
    });
  }, []);

  const handleSaveChanges = async () => {
    if (editedCells.size === 0) return;

    try {
      setIsLoading(true);

      const changes = Array.from(editedCells.entries()).map(([key, value]) => {
        const [rowIndex, columnId] = key.split('-');
        return {
          rowIndex: parseInt(rowIndex),
          columnId,
          value
        };
      });

      await databaseService.saveChanges(activeTable, changes);

      setEditedCells(new Map());
      setAlert({
        title: 'Success',
        message: 'Changes saved successfully',
        variant: 'success'
      });
    } catch (error) {
      setAlert({
        title: 'Error',
        message: `Failed to save changes: ${error.message}`,
        variant: 'error'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const columns = useMemo(
    () =>
      tableData.columns.map(col => ({
        accessorKey: col,
        header: col,
        cell: ({ row, column, getValue }) => {
          const cellKey = `${row.index}-${column.id}`;
          const isEdited = editedCells.has(cellKey);
          return (
            <div
              className={`p-2 rounded border-2 dark:border-gray-800 ${isEdited ? 'bg-blue-50 dark:bg-blue-900' : ''}`}
              contentEditable
              suppressContentEditableWarning
              onBlur={(e) => handleCellEdit(row.index, column.id, e.target.textContent)}
            >
              {getValue()}
            </div>
          );
        }
      })),
    [tableData.columns, editedCells, handleCellEdit]
  );

  const table = useReactTable({
    data: tableData.rows,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel()
  });

  return (
    <div data-component="DBViewer" className="min-h-screen relative flex flex-col">
      {alert && (
        <Toast duration={3000} className="p-4">
          <Alert {...alert} onDismiss={() => setAlert(null)} />
        </Toast>
      )}

      <div className="flex-1 flex min-h-0">
        {!dbPath ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center p-8">
              <Database className="h-16 w-16 mx-auto mb-4 text-gray-400 dark:text-gray-200" />
              <h2 className="text-xl font-semibold mb-2">Import a Database File</h2>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                Supported formats: SQLite, MySQL dumps, PostgreSQL dumps, MongoDB exports
              </p>
              <Button
                onClick={handleFileSelect}
                className="px-4 font-mono flex items-center gap-2 mx-auto"
              >
                <FileCog className="w-4 h-4" />
                Choose Database File
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex-1 grid grid-cols-4 min-h-0">
            <div className='fixed z-50 flex gap-4 bottom-4 right-4 si-12'>
              {/* Pagination */}
              <div className="bg-white dark:bg-gray-900 flex gap-3 items-center justify-between">
                <Button
                  onClick={() => table.previousPage()}
                  disabled={!table.getCanPreviousPage()}
                  className="text-sm font-semibold px-3 py-1 border-2 dark:border-gray-800 rounded disabled:opacity-50"
                >
                  Previous
                </Button>
                <span className="text-sm text-gray-600 dark:text-gray-300">
                  Page {table.getState().pagination.pageIndex + 1} of{" "}
                  {table.getPageCount()}
                </span>
                <Button
                  onClick={() => table.nextPage()}
                  disabled={!table.getCanNextPage()}
                  className="text-sm font-semibold px-3 py-1 border-2 dark:border-gray-800 rounded disabled:opacity-50"
                >
                  Next
                </Button>
              </div>
              <Button
                onClick={handleFileSelect}
                className="flex items-center gap-2 mx-auto"
              >
                <FileCog className="w-4 h-4" />
              </Button>
            </div>
            {/* Tables Sidebar */}
            <div className="col-span-1 border-r-2 border-t-2 dark:border-gray-800 overflow-auto bg-gray-50 dark:bg-black">
              <div className="p-4">
                <h2 className="font-semibold mb-4 flex items-center gap-2">
                  <TableIcon className="h-4 w-4" />
                  Tables ({dbInfo?.tables.length})
                </h2>
                <div className="space-y-2">
                  {dbInfo?.tables.map(table => (
                    <Button
                      key={table.name}
                      onClick={() => handleTableSelect(table.name)}
                      className={`w-full font-normal  p-2 text-left border-2 dark:border-gray-800 rounded hover:bg-gray-100 dark:hover:bg-gray-900 transition-colors
                        ${activeTable === table.name ? 'bg-blue-50 dark:bg-blue-950 border-2 dark:border-gray-800 border-blue-200' : ''}
                      `}
                    >
                      <div className="font-medium truncate">{table.name}</div>
                      <div className="text-xs text-gray-50 dark:text-gray-50 dark:text-gray-200">
                        {table.rowCount.toLocaleString()} rows
                      </div>
                    </Button>
                  ))}
                </div>
              </div>
            </div>

            {/* Table View */}
            <div className="col-span-3 overflow-hidden flex flex-col">
              {isLoading ? (
                <div className="flex-1 flex items-center justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 dark:border-gray-800 border-blue-500" />
                </div>
              ) : activeTable ? (
                <div className="flex-1 flex flex-col min-h-0 relative">
                  {/* Table Header */}
                  <div className="p-4 border-b-2 dark:border-gray-800 flex items-center justify-between bg-white dark:bg-gray-900">
                    <h3 className="font-semibold text-lg">{activeTable}</h3>
                    {editedCells.size > 0 && (
                      <Button
                        onClick={handleSaveChanges}
                        className="py-1 px-3 bg-green-500 dark:bg-green-900 border-2 dark:border-green-700 dark:text-green200 text-white rounded hover:bg-green-600 flex items-center gap-2"
                      >
                        <Save className="w-4 h-4" />
                        <span className='text-sm'>Save Changes</span>
                      </Button>
                    )}
                  </div>

                  {/* Table Content */}
                  <div className="flex-1 overflow-auto p-4">
                    <div className="rounded-lg border-2 dark:border-gray-800">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50 dark:bg-gray-black">
                          {table.getHeaderGroups().map(headerGroup => (
                            <tr key={headerGroup.id} className="!border-0">
                              {headerGroup.headers.map(header => (
                                <th
                                  key={header.id}
                                  className="px-6 py-3 text-left text-xs font-medium text-gray-50 dark:bg-gray-900 dark:text-gray-200 dark:text-gray-200 uppercase tracking-wider"
                                >
                                  {header.isPlaceholder
                                    ? null
                                    : flexRender(
                                      header.column.columnDef.header,
                                      header.getContext()
                                    )}
                                </th>
                              ))}
                            </tr>
                          ))}
                        </thead>
                        <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200">
                          {table.getRowModel().rows.map(row => (
                            <tr key={row.id} className='!border-0'>
                              {row.getVisibleCells().map(cell => (
                                <td
                                  key={cell.id}
                                  className="px-6 py-4 whitespace-nowrap text-sm text-gray-50 dark:text-gray-black0 dark:text-gray-200"
                                >
                                  {flexRender(
                                    cell.column.columnDef.cell,
                                    cell.getContext()
                                  )}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>


                </div>
              ) : (
                <div className="flex-1 flex items-center justify-center text-gray-50 dark:text-gray-black0 dark:text-gray-200">
                  Select a table to view its data
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DBViewer;