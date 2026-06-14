import React, { useEffect, useState } from 'react'
import { processFiles, getMatches, resolveRecord } from '../../services/payment-matching.service'
import type { MatchResponseDto, PaymentMatchRecordDto } from '../../models/payment-matching.models'
import ReusableTable, { TableAction, TableColumn } from '../reusable-table/ReusableTable'
import './payment-matching.scss'

type MatchFilter = 'all' | 'resolved' | 'unresolved'

const formatStatus = (status: string) =>
  status
    .replace(/([A-Z])/g, ' $1')
    .replace(/^\s/, '')
    .replace(/\s+/g, ' ')
    .trim()

const formatAmount = (amount: number | null | undefined) =>
  amount === null || amount === undefined ? '—' : amount.toFixed(2)

const formatResolved = (row: PaymentMatchRecordDto) =>
  row.status !== 'Matched' ? (row.resolved ? 'Yes' : 'No') : 'N/A'

export default function PaymentMatching(): JSX.Element {
  const [systemFile, setSystemFile] = useState<File | null>(null)
  const [providerFile, setProviderFile] = useState<File | null>(null)
  const [records, setRecords] = useState<PaymentMatchRecordDto[]>([])
  const [summary, setSummary] = useState<MatchResponseDto['summary'] | null>(null)
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null)
  const [selectedFilter, setSelectedFilter] = useState<MatchFilter>('unresolved')
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  useEffect(() => {
    try {
      const stored = localStorage.getItem('reconSessionId')
      if (stored) {
        setCurrentSessionId(stored)
        fetchMatches(stored, selectedFilter)
      }
    } catch {
      // ignore localStorage errors
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (currentSessionId) {
      fetchMatches(currentSessionId, selectedFilter)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedFilter])

  async function fetchMatches(sessionId?: string, filter?: MatchFilter) {
    setIsLoading(true)
    setErrorMessage(null)
    try {
      const rows = await getMatches(sessionId ?? undefined, filter === 'all' ? undefined : filter)
      setRecords(rows)
    } catch {
      setErrorMessage('Unable to fetch filtered records.')
    } finally {
      setIsLoading(false)
    }
  }

  function isCsvFile(file: File) {
    return /\.csv$/i.test(file.name)
  }

  function onSystemFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null
    if (file && !isCsvFile(file)) {
      setSystemFile(null)
      setErrorMessage('Unsupported file type. Please upload a .csv file.')
      return
    }

    setSystemFile(file)
    setErrorMessage(null)
    setSuccessMessage(null)
  }

  function onProviderFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null
    if (file && !isCsvFile(file)) {
      setProviderFile(null)
      setErrorMessage('Unsupported file type. Please upload a .csv file.')
      return
    }

    setProviderFile(file)
    setErrorMessage(null)
    setSuccessMessage(null)
  }

  async function onSubmit(event: React.MouseEvent<HTMLButtonElement>) {
    event.preventDefault()
    if (!systemFile || !providerFile) {
      setErrorMessage('Please upload both the System CSV and Provider CSV files.')
      return
    }

    setIsLoading(true)
    setErrorMessage(null)
    setSuccessMessage(null)

    try {
      const response = await processFiles(systemFile, providerFile)
      setSummary(response.summary)
      setRecords(response.records)
      setCurrentSessionId(response.sessionId)
      try {
        localStorage.setItem('reconSessionId', response.sessionId)
      } catch {
        // ignore storage errors
      }
      setSuccessMessage('Match completed. Review the results and resolve any open items.')
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to process the CSV files.'
      setErrorMessage(message)
      setSummary(null)
      setRecords([])
    } finally {
      setIsLoading(false)
    }
  }

  async function acceptResolution(record: PaymentMatchRecordDto, resolutionSide: 'System' | 'Provider') {
    setIsLoading(true)
    setErrorMessage(null)
    setSuccessMessage(null)
    try {
      const updated = await resolveRecord(record.id, resolutionSide)
      setRecords((current) => current.map((item) => (item.id === updated.id ? updated : item)))
      setSuccessMessage(`Resolution saved for order ${record.orderId} as ${resolutionSide}.`)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to save the resolution.'
      setErrorMessage(message)
    } finally {
      setIsLoading(false)
    }
  }

  const tableColumns: TableColumn<PaymentMatchRecordDto>[] = [
    {
      key: 'orderId',
      label: 'Order ID',
      value: (row) => row.orderId,
      className: 'fw-semibold',
    },
    {
      key: 'currency',
      label: 'Currency',
      value: (row) => row.currency,
    },
    {
      key: 'status',
      label: 'Status',
      value: (row) => formatStatus(row.status),
    },
    {
      key: 'systemAmount',
      label: 'System Amount',
      value: (row) => formatAmount(row.systemAmount),
    },
    {
      key: 'providerAmount',
      label: 'Provider Amount',
      value: (row) => formatAmount(row.providerAmount),
    },
    {
      key: 'resolved',
      label: 'Resolved',
      hasTooltip: true,
      tooltip: 'Only applicable for unmatched records. Displays N/A when there is no mismatch in the record details.',
      value: (row) => formatResolved(row),
    },
    {
      key: 'resolutionSide',
      label: 'Resolution Side',
      value: (row) => row.resolutionSide ?? '—',
    },
  ]

  const tableActions: TableAction<PaymentMatchRecordDto>[] = [
    {
      id: 'accept-system',
      label: 'Accept System',
      variant: 'outline-primary',
      visible: (row) => row.status !== 'Matched' && !row.resolved,
      disabled: (row) => row.systemAmount === null || row.systemAmount === undefined,
      onClick: (row) => acceptResolution(row, 'System'),
    },
    {
      id: 'accept-provider',
      label: 'Accept Provider',
      variant: 'outline-success',
      visible: (row) => row.status !== 'Matched' && !row.resolved,
      disabled: (row) => row.providerAmount === null || row.providerAmount === undefined,
      onClick: (row) => acceptResolution(row, 'Provider'),
    },
  ]

  return (
    <>
      <section className="section section-heading mb-4">
        <div className="container">
          <h1 className="h3 container">Payments Matching</h1>
          <h4 className="h4 mb-3 container text-muted small">
            Upload the System CSV and Provider CSV files to reconcile payments.
          </h4>
          <div className="text-muted mb-0 bg-primary-subtle p-3">
            <div className="container font-weight-bold">
              {!summary ? (
                <h6 className="h6">Step 1: Choose CSV files to process</h6>
              ) : (
                <h4 className="h6">Step 2: Review the uploaded files Match Summary</h4>
              )}
            </div>
          </div>
        </div>
      </section>

      <div className="container">
        {!summary && (
          <div className="section section-upload row gy-4">
            <div className="col-12 col-lg-6 upload-panel mt-5">
              <div className="section-panel">
                <div className="row g-3 mb-4">
                  <div className="col-12 col-md-6">
                    <label className="upload-box" htmlFor="systemFile">
                      <div className="upload-icon" aria-hidden="true">
                        <i className="fa-solid fa-upload" />
                      </div>
                      <span className="upload-label">System CSV</span>
                      <span className="upload-note">{systemFile?.name ?? 'Upload a CSV file'}</span>
                    </label>
                    <input
                      id="systemFile"
                      type="file"
                      accept=".csv,text/csv"
                      hidden
                      onChange={onSystemFileChange}
                    />
                  </div>

                  <div className="col-12 col-md-6">
                    <label className="upload-box" htmlFor="providerFile">
                      <div className="upload-icon" aria-hidden="true">
                        <i className="fa-solid fa-upload" />
                      </div>
                      <span className="upload-label">Provider CSV</span>
                      <span className="upload-note">{providerFile?.name ?? 'Upload a CSV file'}</span>
                    </label>
                    <input
                      id="providerFile"
                      type="file"
                      accept=".csv,text/csv"
                      hidden
                      onChange={onProviderFileChange}
                    />
                  </div>
                </div>

                {errorMessage && <div className="text-danger mb-3">{errorMessage}</div>}
                {successMessage && <div className="text-success mb-3">{successMessage}</div>}

                <div className="d-flex justify-content-start mt-5">
                  <button className="btn btn-warning btn-run" type="button" disabled={isLoading} onClick={onSubmit}>
                    {isLoading ? 'Processing...' : 'Run Match'}
                  </button>
                </div>
                <div className="small text-muted mt-2" title="A reconciliation session id is created and stored locally after a successful run. Subsequent filtering requests are scoped to this session.">
                  Session saved locally for filtering and retrieval.
                </div>
              </div>
            </div>
          </div>
        )}

        {summary && (
          <>
            <div className="section section-summary mt-4">
              <h2 className="h5 mb-2">Match Summary</h2>
              <p className="text-muted mb-3">Details from the latest run.</p>
              <div className="row g-3">
                <div className="col-sm-4 col-lg-2">
                  <div className="bg-info-subtle p-1">
                    <div className="text-muted small"> Total:</div>
                    <div className="h4 mb-0">{summary.total}</div>
                  </div>
                </div>
                <div className="col-sm-4 col-lg-2">
                  <div className="bg-success-subtle p-1">
                    <div className="text-muted small">Matched</div>
                    <div className="h4 mb-0">{summary.matched}</div>
                  </div>
                </div>
                <div className="col-sm-4 col-lg-2">
                  <div className="bg-info-subtle p-1">
                    <div className="text-muted small">Only System</div>
                    <div className="h4 mb-0">{summary.onlySystem}</div>
                  </div>
                </div>
                <div className="col-sm-4 col-lg-2">
                  <div className="bg-info-subtle p-1">
                    <div className="text-muted small">Only Provider</div>
                    <div className="h4 mb-0">{summary.onlyProvider}</div>
                  </div>
                </div>
                <div className="col-sm-4 col-lg-2">
                  <div className="bg-danger-subtle p-1">
                    <div className="text-muted small">Amount Mismatch</div>
                    <div className="h4 mb-0">{summary.amountMismatch}</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="section section-records mt-5">
              <div className="d-flex justify-content-between flex-wrap gap-3 align-items-center mb-3">
                <div>
                  <h2 className="h5 mb-1">Records</h2>
                </div>
                <div className="d-flex align-items-center gap-2">
                  <label className="form-label mb-0 fw-semibold" htmlFor="filterSelect">
                    Show
                  </label>
                  <select
                    id="filterSelect"
                    className="form-select"
                    style={{ width: 200 }}
                    value={selectedFilter}
                    onChange={(e) => setSelectedFilter(e.target.value as MatchFilter)}
                  >
                    <option value="all">All</option>
                    <option value="resolved">Resolved</option>
                    <option value="unresolved">Unresolved</option>
                  </select>
                  <span className="ms-2" title="Filtering is applied to the current reconciliation session stored in your browser. Re-run files to create a new session.">
                    <i className="fa-solid fa-info-circle text-secondary" />
                  </span>
                </div>
              </div>

              <ReusableTable rows={records} columns={tableColumns} actions={tableActions} emptyMessage="No records available for the selected filter." />
            </div>
          </>
        )}
      </div>
    </>
  )
}
