import { apiRequest } from '../client'
import type {
  CancelledBookingsReportResponseDto,
  ClientLoyaltyReportResponseDto,
  EmployeeReportResponseDto,
  FinancialSummaryReportResponseDto,
  InventoryMovementReportResponseDto,
  MasterActivityReportResponseDto,
  ReportPeriodQuery,
  ReviewsReportResponseDto,
  SalonActivityReportResponseDto,
  ServicePopularityReportResponseDto,
} from '../../types/dto/reports'

export const reportService = {
  getEmployees() {
    return apiRequest<EmployeeReportResponseDto>('/reports/employees')
  },
  getSalonActivity(query: ReportPeriodQuery) {
    return apiRequest<SalonActivityReportResponseDto>('/reports/salon-activity', { query })
  },
  getServicePopularity(query: ReportPeriodQuery) {
    return apiRequest<ServicePopularityReportResponseDto>('/reports/service-popularity', { query })
  },
  getMasterActivity(query: ReportPeriodQuery) {
    return apiRequest<MasterActivityReportResponseDto>('/reports/master-activity', { query })
  },
  getReviews(query: ReportPeriodQuery) {
    return apiRequest<ReviewsReportResponseDto>('/reports/reviews', { query })
  },
  getInventoryMovement(query: ReportPeriodQuery) {
    return apiRequest<InventoryMovementReportResponseDto>('/reports/inventory-movement', { query })
  },
  getClientLoyalty(query: ReportPeriodQuery) {
    return apiRequest<ClientLoyaltyReportResponseDto>('/reports/client-loyalty', { query })
  },
  getCancelledBookings(query: ReportPeriodQuery) {
    return apiRequest<CancelledBookingsReportResponseDto>('/reports/cancelled-bookings', { query })
  },
  getFinancialSummary(query: ReportPeriodQuery) {
    return apiRequest<FinancialSummaryReportResponseDto>('/reports/financial-summary', { query })
  },
}
