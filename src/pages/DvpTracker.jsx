import { useEffect, useMemo, useRef, useState } from 'react'
import { FileSpreadsheet, Upload, Download, Plus, Search, Trash2 } from 'lucide-react'
import * as XLSX from 'xlsx'
import { useApp } from '../data/AppContext'

function normalizeRowsFromSheet(rows) {
  if (!rows || rows.length === 0) {
    return {
      headers: ['Comments'],
      rows: [],
    }
  }

  const rawHeaders = (rows[0] || []).map((value, index) =>
    String(value ?? '').trim() || `Column ${index + 1}`
  )

  const headers = [...rawHeaders]
  if (!headers.includes('Comments')) {
    headers.push('Comments')
  }

  const dataRows = rows.slice(1).map((row) => {
    const normalized = headers.reduce((acc, header, index) => {
      if (header === 'Comments' && index >= row.length) {
        acc[header] = ''
      } else {
        acc[header] = row[index] ?? ''
      }
      return acc
    }, {})
    return normalized
  })

  return { headers, rows: dataRows }
}

function buildWorksheetData(headers, rows) {
  return [
    headers,
    ...rows.map((row) => headers.map((header) => row[header] ?? '')),
  ]
}

export default function DvpTracker() {
  const inputRef = useRef(null)
  const topScrollRef = useRef(null)
  const tableScrollRef = useRef(null)
  const tableWidthRef = useRef(null)

  const {
    dvpFileName: fileName,
    setDvpFileName: setFileName,
    dvpHeaders: headers,
    setDvpHeaders: setHeaders,
    dvpRows: rows,
    setDvpRows: setRows,
    dvpSearch: search,
    setDvpSearch: setSearch,
    clearDvpSheet,
  } = useApp()

  const [tableScrollWidth, setTableScrollWidth] = useState(1400)

  const filteredRows = useMemo(() => {
    const term = search.trim().toLowerCase()
    if (!term) return rows

    return rows.filter((row) =>
      headers.some((header) =>
        String(row[header] ?? '')
          .toLowerCase()
          .includes(term)
      )
    )
  }, [rows, headers, search])

  useEffect(() => {
    function updateTopScrollbarWidth() {
      if (tableWidthRef.current) {
        setTableScrollWidth(tableWidthRef.current.scrollWidth)
      }
    }

    updateTopScrollbarWidth()

    const timeout = setTimeout(updateTopScrollbarWidth, 0)
    window.addEventListener('resize', updateTopScrollbarWidth)

    return () => {
      clearTimeout(timeout)
      window.removeEventListener('resize', updateTopScrollbarWidth)
    }
  }, [headers, filteredRows.length])

  useEffect(() => {
    const topEl = topScrollRef.current
    const tableEl = tableScrollRef.current
    if (!topEl || !tableEl) return

    let syncingFromTop = false
    let syncingFromTable = false

    function handleTopScroll() {
      if (syncingFromTable) return
      syncingFromTop = true
      tableEl.scrollLeft = topEl.scrollLeft
      requestAnimationFrame(() => {
        syncingFromTop = false
      })
    }

    function handleTableScroll() {
      if (syncingFromTop) return
      syncingFromTable = true
      topEl.scrollLeft = tableEl.scrollLeft
      requestAnimationFrame(() => {
        syncingFromTable = false
      })
    }

    topEl.addEventListener('scroll', handleTopScroll)
    tableEl.addEventListener('scroll', handleTableScroll)

    return () => {
      topEl.removeEventListener('scroll', handleTopScroll)
      tableEl.removeEventListener('scroll', handleTableScroll)
    }
  }, [])

  async function handleImport(event) {
    const file = event.target.files?.[0]
    if (!file) return

    setFileName(file.name)

    const buffer = await file.arrayBuffer()
    const workbook = XLSX.read(buffer, { type: 'array' })
    const firstSheetName = workbook.SheetNames[0]
    const worksheet = workbook.Sheets[firstSheetName]
    const sheetRows = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' })

    const normalized = normalizeRowsFromSheet(sheetRows)
    setHeaders(normalized.headers)
    setRows(normalized.rows)
  }

  function updateCell(rowIndex, header, value) {
    setRows((prev) =>
      prev.map((row, index) =>
        index === rowIndex ? { ...row, [header]: value } : row
      )
    )
  }

  function addEmptyRow() {
    const newRow = headers.reduce((acc, header) => {
      acc[header] = ''
      return acc
    }, {})
    setRows((prev) => [...prev, newRow])
  }

  function deleteRow(rowIndex) {
    setRows((prev) => prev.filter((_, index) => index !== rowIndex))
  }

  function exportExcel() {
    const workbook = XLSX.utils.book_new()
    const worksheetData = buildWorksheetData(headers, rows)
    const worksheet = XLSX.utils.aoa_to_sheet(worksheetData)
    XLSX.utils.book_append_sheet(workbook, worksheet, 'DVP')
    XLSX.writeFile(workbook, `dvp-tracker-${new Date().toISOString().slice(0, 10)}.xlsx`)
  }

  function handleRemoveSheet() {
    clearDvpSheet()
    if (inputRef.current) {
      inputRef.current.value = ''
    }
  }

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h2 className="text-xl font-semibold tracking-tight text-ink dark:text-white">
            DVP
          </h2>
          <p className="mt-1 text-sm text-ink-muted dark:text-dark-dynamic">
            Import an Excel file, edit the data, add comments in the last column, and export it again.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <span className="badge bg-surface-offset dark:bg-dark-offset text-ink dark:text-white">
            {rows.length} rows
          </span>
          <span className="badge bg-surface-offset dark:bg-dark-offset text-ink dark:text-white">
            {headers.length} columns
          </span>
        </div>
      </section>

      <section className="card p-4 md:p-5 space-y-4">
        <div className="flex items-center gap-2">
          <FileSpreadsheet size={18} className="text-primary" />
          <h3 className="text-sm font-semibold text-ink dark:text-white">Import / Export</h3>
        </div>

        <div className="flex flex-col gap-3 md:flex-row md:flex-wrap md:items-center">
          <input
            ref={inputRef}
            type="file"
            accept=".xlsx,.xls,.csv"
            onChange={handleImport}
            className="hidden"
          />

          <button
            className="btn-primary"
            onClick={() => inputRef.current?.click()}
          >
            <Upload size={15} /> Import File
          </button>

          <button
            className="btn-secondary"
            onClick={exportExcel}
            disabled={headers.length === 0 || rows.length === 0}
          >
            <Download size={15} /> Export File
          </button>

          <button
            className="btn-secondary"
            onClick={addEmptyRow}
          >
            <Plus size={15} /> Add Row
          </button>

          <button
            className="btn-secondary text-red-600 hover:text-red-700"
            onClick={handleRemoveSheet}
            disabled={!fileName && rows.length === 0}
          >
            Remove Sheet
          </button>

          {fileName ? (
            <span className="text-sm text-ink-muted dark:text-dark-dynamic">
              Imported: {fileName}
            </span>
          ) : (
            <span className="text-sm text-ink-muted dark:text-dark-dynamic">
              No sheet loaded
            </span>
          )}
        </div>
      </section>

      <section className="card p-4 md:p-5 space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint dark:text-dark-dynamic"
            />
            <input
              className="input pl-9"
              placeholder="Search all imported columns including comments"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <p className="text-xs text-ink-muted dark:text-dark-dynamic">
          Use the floating top scrollbar or the bottom scrollbar to move left and right.
        </p>

        <div className="sticky top-0 z-30 -mx-1 rounded-lg border border-surface-border bg-surface/95 px-1 py-1 shadow-sm backdrop-blur dark:border-dark-border dark:bg-dark-surface/95">
          <div
            ref={topScrollRef}
            className="overflow-x-scroll overflow-y-hidden"
          >
            <div style={{ width: `${tableScrollWidth}px`, height: '14px' }} />
          </div>
        </div>

        <div
          ref={tableScrollRef}
          className="w-full overflow-x-scroll overflow-y-hidden rounded-lg border border-surface-border pb-3 dark:border-dark-border"
        >
          <div ref={tableWidthRef} className="min-w-max">
            <table className="relative border-collapse">
              <thead>
                <tr className="border-b border-surface-border dark:border-dark-border">
                  {headers.map((header, colIndex) => (
                    <th
                      key={header}
                      className={[
                        'bg-surface dark:bg-dark-surface text-left text-xs font-medium text-ink-muted dark:text-dark-dynamic py-3 pr-3 whitespace-nowrap',
                        colIndex === 0
                          ? 'sticky left-0 z-20 pl-3 min-w-[220px] shadow-[6px_0_8px_-8px_rgba(0,0,0,0.25)]'
                          : 'min-w-[180px]',
                      ].join(' ')}
                    >
                      {header}
                    </th>
                  ))}
                  <th className="bg-surface dark:bg-dark-surface text-left text-xs font-medium text-ink-muted dark:text-dark-dynamic py-3 pr-3 whitespace-nowrap min-w-[100px]">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody>
                {filteredRows.length > 0 ? (
                  filteredRows.map((row, rowIndex) => (
                    <tr
                      key={rowIndex}
                      className="border-b border-surface-border/70 dark:border-dark-border/70"
                    >
                      {headers.map((header, colIndex) => (
                        <td
                          key={`${rowIndex}-${header}`}
                          className={[
                            'py-2 pr-3 align-top bg-surface dark:bg-dark-surface',
                            colIndex === 0
                              ? 'sticky left-0 z-10 pl-3 min-w-[220px] shadow-[6px_0_8px_-8px_rgba(0,0,0,0.25)]'
                              : 'min-w-[180px]',
                          ].join(' ')}
                        >
                          {header === 'Comments' ? (
                            <textarea
                              className="input min-h-[72px] w-full min-w-[260px] resize-y"
                              value={row[header] ?? ''}
                              onChange={(e) => updateCell(rowIndex, header, e.target.value)}
                              placeholder="Add comments"
                            />
                          ) : (
                            <input
                              className="input w-full min-w-[180px]"
                              value={row[header] ?? ''}
                              onChange={(e) => updateCell(rowIndex, header, e.target.value)}
                            />
                          )}
                        </td>
                      ))}

                      <td className="min-w-[100px] bg-surface py-2 pr-3 align-top dark:bg-dark-surface">
                        <button
                          className="btn-icon text-red-600 hover:bg-red-50 hover:text-red-700 dark:hover:bg-red-950/20"
                          onClick={() => deleteRow(rowIndex)}
                          aria-label={`Delete row ${rowIndex + 1}`}
                        >
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={headers.length + 1}
                      className="py-8 text-center text-sm text-ink-muted dark:text-dark-dynamic"
                    >
                      Import a file to view and edit DVP data.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  )
}