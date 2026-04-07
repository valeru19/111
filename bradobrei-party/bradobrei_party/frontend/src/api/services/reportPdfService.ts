import { apiBlobRequest, buildApiUrl } from '../client'
import type { FileReportId, ReportPeriodQuery } from '../../types/dto/reports'

function buildReportFilePath(reportId: FileReportId, extension: 'html' | 'pdf') {
  return `/reports/${reportId}/${extension}`
}

export const reportPdfService = {
  getBlob(reportId: FileReportId, query?: ReportPeriodQuery) {
    return apiBlobRequest(buildReportFilePath(reportId, 'pdf'), { query })
  },
  getPdfUrl(reportId: FileReportId, query?: ReportPeriodQuery) {
    return buildApiUrl(buildReportFilePath(reportId, 'pdf'), query)
  },
  getHtmlUrl(reportId: FileReportId, query?: ReportPeriodQuery) {
    return buildApiUrl(buildReportFilePath(reportId, 'html'), query)
  },
}
