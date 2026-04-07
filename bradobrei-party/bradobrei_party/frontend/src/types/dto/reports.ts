import type { UserDto } from './auth'

export interface PeriodDto {
  from: string
  to: string
}

export type ReportPeriodQuery = Record<'from' | 'to', string>

export interface ReportEnvelopeDto<T> {
  report: string
  data: T | null
  period?: PeriodDto
}

export interface SalonActivityRowDto {
  salon_id: number
  address: string
  client_count: number
  service_count: number
  total_revenue: number
}

export interface MasterActivityRowDto {
  master_id: number
  full_name: string
  service_count: number
  revenue: number
  material_cost: number
}

export interface ServicePopularityRowDto {
  service_id: number
  service_name: string
  usage_count: number
  relative_freq: number
}

export interface ReviewReportRowDto {
  id: number
  text: string
  rating: number
  created_at: string
  user?: UserDto
}

export interface InventoryMovementRowDto {
  salon_address: string
  material_name: string
  unit: string
  opening_balance: number
  purchased: number
  written_off: number
  current_balance: number
}

export interface ClientLoyaltyRowDto {
  client_id: number
  full_name: string
  phone: string
  email?: string
  first_visit?: string | null
  last_visit?: string | null
  visit_count: number
  paid_total: number
  bonus_status: string
}

export interface CancelledBookingRowDto {
  booking_id: number
  planned_visit: string
  client_full_name: string
  master_full_name: string
  cancellation_reason: string
  cancellation_rate_pct: number
  status: string
}

export interface FinancialSummaryRowDto {
  salon_address: string
  expense_item: string
  amount: number
  transaction_date: string
  total_balance: number
}

export type EmployeeReportResponseDto = ReportEnvelopeDto<UserDto[]>
export type SalonActivityReportResponseDto = ReportEnvelopeDto<SalonActivityRowDto[]>
export type ServicePopularityReportResponseDto = ReportEnvelopeDto<ServicePopularityRowDto[]>
export type MasterActivityReportResponseDto = ReportEnvelopeDto<MasterActivityRowDto[]>
export type ReviewsReportResponseDto = ReportEnvelopeDto<ReviewReportRowDto[]>
export type InventoryMovementReportResponseDto = ReportEnvelopeDto<InventoryMovementRowDto[]>
export type ClientLoyaltyReportResponseDto = ReportEnvelopeDto<ClientLoyaltyRowDto[]>
export type CancelledBookingsReportResponseDto = ReportEnvelopeDto<CancelledBookingRowDto[]>
export type FinancialSummaryReportResponseDto = ReportEnvelopeDto<FinancialSummaryRowDto[]>

export type ReportId =
  | 'employees'
  | 'salon-activity'
  | 'service-popularity'
  | 'master-activity'
  | 'reviews'
  | 'inventory-movement'
  | 'client-loyalty'
  | 'cancelled-bookings'
  | 'financial-summary'

export type FileReportId =
  | 'employees'
  | 'salon-activity'
  | 'service-popularity'
  | 'master-activity'
  | 'reviews'
  | 'inventory-movement'
  | 'client-loyalty'
  | 'cancelled-bookings'
  | 'financial-summary'
export type ReportViewMode = 'json' | 'pdf'

export interface ReportCatalogItem {
  id: ReportId
  code: string
  title: string
  description: string
  supportsPeriod: boolean
  supportsHtml: boolean
  supportsPdf: boolean
}
