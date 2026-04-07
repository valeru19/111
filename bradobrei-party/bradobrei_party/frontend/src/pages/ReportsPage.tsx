import { useEffect, useMemo, useState } from 'react'
import { DataTable } from '../components/DataTable'
import { reportPdfService } from '../api/services/reportPdfService'
import { reportService } from '../api/services/reportService'
import {
  cancelledBookingsColumns,
  clientLoyaltyColumns,
  employeeReportColumns,
  financialSummaryColumns,
  inventoryMovementColumns,
  masterActivityColumns,
  reviewsReportColumns,
  salonActivityColumns,
  servicePopularityColumns,
} from '../shared/reportTables'
import type { UserDto } from '../types/dto/auth'
import type {
  CancelledBookingRowDto,
  ClientLoyaltyRowDto,
  FileReportId,
  FinancialSummaryRowDto,
  InventoryMovementRowDto,
  MasterActivityRowDto,
  ReportCatalogItem,
  ReportId,
  ReportPeriodQuery,
  ReportViewMode,
  ReviewReportRowDto,
  SalonActivityRowDto,
  ServicePopularityRowDto,
} from '../types/dto/reports'

type ReportRows =
  | UserDto[]
  | SalonActivityRowDto[]
  | ServicePopularityRowDto[]
  | MasterActivityRowDto[]
  | ReviewReportRowDto[]
  | InventoryMovementRowDto[]
  | ClientLoyaltyRowDto[]
  | CancelledBookingRowDto[]
  | FinancialSummaryRowDto[]

function getDefaultPeriod(): ReportPeriodQuery {
  const now = new Date()
  const from = new Date(now)
  from.setDate(now.getDate() - 30)

  return {
    from: from.toISOString().slice(0, 10),
    to: now.toISOString().slice(0, 10),
  }
}

function normalizeRows<T>(data: T[] | null | undefined): T[] {
  return Array.isArray(data) ? data : []
}

const reportCatalog: ReportCatalogItem[] = [
  {
    id: 'employees',
    code: '2.2.1',
    title: 'Реестр персонала',
    description: 'Сводная таблица по сотрудникам, ролям, специализациям и филиалам.',
    supportsPeriod: false,
    supportsHtml: true,
    supportsPdf: true,
  },
  {
    id: 'salon-activity',
    code: '2.2.2',
    title: 'Операционная активность филиалов',
    description: 'Количество клиентов, услуг и выручка по филиалам за выбранный период.',
    supportsPeriod: true,
    supportsHtml: true,
    supportsPdf: true,
  },
  {
    id: 'service-popularity',
    code: '2.2.3',
    title: 'Популярность услуг',
    description: 'Использование услуг и их относительная частота за выбранный период.',
    supportsPeriod: true,
    supportsHtml: true,
    supportsPdf: true,
  },
  {
    id: 'master-activity',
    code: '2.2.4',
    title: 'Активность мастеров',
    description: 'Услуги, выручка и материальные затраты по мастерам.',
    supportsPeriod: true,
    supportsHtml: true,
    supportsPdf: true,
  },
  {
    id: 'reviews',
    code: '2.2.5',
    title: 'Отзывы',
    description: 'Мониторинг качества обслуживания и обратной связи от клиентов.',
    supportsPeriod: true,
    supportsHtml: true,
    supportsPdf: true,
  },
  {
    id: 'inventory-movement',
    code: '2.2.6',
    title: 'Движение ТМЦ',
    description: 'Остатки, поступления и списания материалов по салонам.',
    supportsPeriod: true,
    supportsHtml: true,
    supportsPdf: true,
  },
  {
    id: 'client-loyalty',
    code: '2.2.7',
    title: 'Лояльность клиентов',
    description: 'Повторные визиты, платежи и бонусный статус клиентов.',
    supportsPeriod: true,
    supportsHtml: true,
    supportsPdf: true,
  },
  {
    id: 'cancelled-bookings',
    code: '2.2.8',
    title: 'Отменённые бронирования',
    description: 'Журнал отмен и несостоявшихся визитов за выбранный период.',
    supportsPeriod: true,
    supportsHtml: true,
    supportsPdf: true,
  },
  {
    id: 'financial-summary',
    code: '2.2.9',
    title: 'Финансовая сводка',
    description: 'Транзакции и закупки материалов в общей финансовой картине.',
    supportsPeriod: true,
    supportsHtml: true,
    supportsPdf: true,
  },
]

export function ReportsPage() {
  const [selectedReportId, setSelectedReportId] = useState<ReportId>('salon-activity')
  const [viewMode, setViewMode] = useState<ReportViewMode>('json')
  const [filters, setFilters] = useState<ReportPeriodQuery>(getDefaultPeriod())
  const [jsonRows, setJsonRows] = useState<ReportRows>([])
  const [periodLabel, setPeriodLabel] = useState('')
  const [jsonError, setJsonError] = useState('')
  const [pdfError, setPdfError] = useState('')
  const [loading, setLoading] = useState(false)
  const [pdfUrl, setPdfUrl] = useState('')

  const selectedReport = useMemo(
    () => reportCatalog.find((report) => report.id === selectedReportId) ?? reportCatalog[0],
    [selectedReportId],
  )

  useEffect(() => {
    return () => {
      if (pdfUrl) {
        URL.revokeObjectURL(pdfUrl)
      }
    }
  }, [pdfUrl])

  async function loadJsonReport() {
    setLoading(true)
    setJsonError('')

    try {
      switch (selectedReportId) {
        case 'employees': {
          const response = await reportService.getEmployees()
          setJsonRows(normalizeRows(response.data))
          setPeriodLabel('')
          break
        }
        case 'salon-activity': {
          const response = await reportService.getSalonActivity(filters)
          setJsonRows(normalizeRows(response.data))
          setPeriodLabel(response.period ? `${response.period.from} - ${response.period.to}` : '')
          break
        }
        case 'service-popularity': {
          const response = await reportService.getServicePopularity(filters)
          setJsonRows(normalizeRows(response.data))
          setPeriodLabel(response.period ? `${response.period.from} - ${response.period.to}` : '')
          break
        }
        case 'master-activity': {
          const response = await reportService.getMasterActivity(filters)
          setJsonRows(normalizeRows(response.data))
          setPeriodLabel(response.period ? `${response.period.from} - ${response.period.to}` : '')
          break
        }
        case 'reviews': {
          const response = await reportService.getReviews(filters)
          setJsonRows(normalizeRows(response.data))
          setPeriodLabel(response.period ? `${response.period.from} - ${response.period.to}` : '')
          break
        }
        case 'inventory-movement': {
          const response = await reportService.getInventoryMovement(filters)
          setJsonRows(normalizeRows(response.data))
          setPeriodLabel(response.period ? `${response.period.from} - ${response.period.to}` : '')
          break
        }
        case 'client-loyalty': {
          const response = await reportService.getClientLoyalty(filters)
          setJsonRows(normalizeRows(response.data))
          setPeriodLabel(response.period ? `${response.period.from} - ${response.period.to}` : '')
          break
        }
        case 'cancelled-bookings': {
          const response = await reportService.getCancelledBookings(filters)
          setJsonRows(normalizeRows(response.data))
          setPeriodLabel(response.period ? `${response.period.from} - ${response.period.to}` : '')
          break
        }
        case 'financial-summary': {
          const response = await reportService.getFinancialSummary(filters)
          setJsonRows(normalizeRows(response.data))
          setPeriodLabel(response.period ? `${response.period.from} - ${response.period.to}` : '')
          break
        }
      }
    } catch (requestError) {
      setJsonError(requestError instanceof Error ? requestError.message : 'Не удалось загрузить отчёт.')
      setJsonRows([])
    } finally {
      setLoading(false)
    }
  }

  async function loadPdfReport() {
    setLoading(true)
    setPdfError('')

    if (pdfUrl) {
      URL.revokeObjectURL(pdfUrl)
      setPdfUrl('')
    }

    try {
      const blob = await reportPdfService.getBlob(
        selectedReportId as FileReportId,
        selectedReport.supportsPeriod ? filters : undefined,
      )
      setPdfUrl(URL.createObjectURL(blob))
    } catch (requestError) {
      setPdfError(requestError instanceof Error ? requestError.message : 'Не удалось получить PDF.')
    } finally {
      setLoading(false)
    }
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (viewMode === 'json') {
      void loadJsonReport()
    } else {
      void loadPdfReport()
    }
  }

  useEffect(() => {
    setJsonRows([])
    setJsonError('')
    setPdfError('')
    setPeriodLabel('')
    if (pdfUrl) {
      URL.revokeObjectURL(pdfUrl)
      setPdfUrl('')
    }
  }, [selectedReportId])

  function renderJsonTable() {
    switch (selectedReportId) {
      case 'employees':
        return <DataTable caption="Реестр персонала" columns={employeeReportColumns} rows={jsonRows as UserDto[]} emptyText="Сотрудники пока не найдены." />
      case 'salon-activity':
        return <DataTable caption="Операционная активность филиалов" columns={salonActivityColumns} rows={jsonRows as SalonActivityRowDto[]} emptyText="Нет данных за выбранный период." />
      case 'service-popularity':
        return <DataTable caption="Популярность услуг" columns={servicePopularityColumns} rows={jsonRows as ServicePopularityRowDto[]} emptyText="Нет данных за выбранный период." />
      case 'master-activity':
        return <DataTable caption="Активность мастеров" columns={masterActivityColumns} rows={jsonRows as MasterActivityRowDto[]} emptyText="Нет данных за выбранный период." />
      case 'reviews':
        return <DataTable caption="Отзывы" columns={reviewsReportColumns} rows={jsonRows as ReviewReportRowDto[]} emptyText="Отзывы за выбранный период не найдены." />
      case 'inventory-movement':
        return <DataTable caption="Движение ТМЦ" columns={inventoryMovementColumns} rows={jsonRows as InventoryMovementRowDto[]} emptyText="Нет движений материалов за выбранный период." />
      case 'client-loyalty':
        return <DataTable caption="Лояльность клиентов" columns={clientLoyaltyColumns} rows={jsonRows as ClientLoyaltyRowDto[]} emptyText="Клиентские данные за выбранный период не найдены." />
      case 'cancelled-bookings':
        return <DataTable caption="Отменённые бронирования" columns={cancelledBookingsColumns} rows={jsonRows as CancelledBookingRowDto[]} emptyText="Нет отменённых бронирований за выбранный период." />
      case 'financial-summary':
        return <DataTable caption="Финансовая сводка" columns={financialSummaryColumns} rows={jsonRows as FinancialSummaryRowDto[]} emptyText="Нет финансовых операций за выбранный период." />
    }
  }

  const htmlUrl = reportPdfService.getHtmlUrl(
    selectedReportId as FileReportId,
    selectedReport.supportsPeriod ? filters : undefined,
  )

  return (
    <section className="page-section">
      <div className="page-header">
        <div>
          <p className="eyebrow">Отчёты</p>
          <h2>Центр аналитики и выгрузок</h2>
          <p className="section-description">
            В одном месте доступны табличные представления API-отчётов и файловые выгрузки. PDF отображается через встроенный viewer браузера, и этого уже достаточно для локальной работы.
          </p>
        </div>
      </div>

      <div className="report-catalog">
        {reportCatalog.map((report) => (
          <button
            key={report.id}
            type="button"
            className={report.id === selectedReportId ? 'report-card report-card-active' : 'report-card'}
            onClick={() => setSelectedReportId(report.id)}
          >
            <span className="report-card-code">{report.code}</span>
            <strong>{report.title}</strong>
            <small>{report.description}</small>
          </button>
        ))}
      </div>

      <div className="tab-row">
        <button
          type="button"
          className={viewMode === 'json' ? 'tab-button tab-button-active' : 'tab-button'}
          onClick={() => setViewMode('json')}
        >
          Таблицы
        </button>
        <button
          type="button"
          className={viewMode === 'pdf' ? 'tab-button tab-button-active' : 'tab-button'}
          onClick={() => setViewMode('pdf')}
        >
          PDF
        </button>
      </div>

      <form className="filter-card" onSubmit={handleSubmit}>
        {selectedReport.supportsPeriod ? (
          <>
            <label className="field">
              <span>С</span>
              <input type="date" value={filters.from} onChange={(event) => setFilters((current) => ({ ...current, from: event.target.value }))} />
            </label>
            <label className="field">
              <span>По</span>
              <input type="date" value={filters.to} onChange={(event) => setFilters((current) => ({ ...current, to: event.target.value }))} />
            </label>
          </>
        ) : (
          <div className="report-note">Для этого отчёта период не требуется.</div>
        )}

        <button type="submit" className="primary-button">
          {loading ? 'Загружаем...' : viewMode === 'json' ? 'Показать таблицу' : 'Собрать PDF'}
        </button>
      </form>

      {viewMode === 'json' ? (
        <>
          {periodLabel ? <p className="period-label">Период: {periodLabel}</p> : null}
          {jsonError ? <div className="alert alert-error">{jsonError}</div> : null}
          {renderJsonTable()}
        </>
      ) : (
        <div className="pdf-panel">
          <p className="report-note">
            Для каждого отчёта можно открыть HTML-шаблон и итоговый PDF. Если нужно быстро сверить верстку, HTML удобнее, а PDF остаётся финальным документом для просмотра и скачивания.
          </p>
          {pdfError ? <div className="alert alert-error">{pdfError}</div> : null}
          {pdfUrl ? (
            <>
              <div className="button-row">
                <a className="primary-button pdf-link" href={pdfUrl} target="_blank" rel="noreferrer">
                  Открыть PDF
                </a>
                <a className="ghost-button pdf-link" href={pdfUrl} download={`${selectedReport.id}.pdf`}>
                  Скачать PDF
                </a>
                <a className="ghost-button pdf-link" href={htmlUrl} target="_blank" rel="noreferrer">
                  Открыть HTML
                </a>
              </div>
              <iframe title="PDF preview" className="pdf-frame" src={pdfUrl} />
            </>
          ) : (
            <div className="table-card">
              <p className="empty-state">Соберите PDF, чтобы увидеть ссылку и предпросмотр.</p>
            </div>
          )}
        </div>
      )}
    </section>
  )
}
