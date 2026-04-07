import type { TableColumn } from '../components/DataTable'
import type { UserDto } from '../types/dto/auth'
import type {
  CancelledBookingRowDto,
  ClientLoyaltyRowDto,
  FinancialSummaryRowDto,
  InventoryMovementRowDto,
  MasterActivityRowDto,
  ReviewReportRowDto,
  SalonActivityRowDto,
  ServicePopularityRowDto,
} from '../types/dto/reports'
import { formatBookingStatus, formatCurrency, formatDateTime, formatRole } from './formatters'

export const employeeReportColumns: Array<TableColumn<UserDto>> = [
  { key: 'name', header: 'Сотрудник', render: (row) => row.full_name },
  { key: 'role', header: 'Роль', render: (row) => formatRole(row.role) },
  {
    key: 'specialization',
    header: 'Специализация',
    render: (row) => row.employee_profile?.specialization || '—',
  },
  {
    key: 'salary',
    header: 'Ожидаемый оклад',
    render: (row) =>
      row.employee_profile?.expected_salary
        ? formatCurrency(row.employee_profile.expected_salary)
        : '—',
  },
  {
    key: 'salons',
    header: 'Филиалы',
    render: (row) =>
      row.employee_profile?.salons?.length
        ? row.employee_profile.salons.map((salon) => salon.address).join(', ')
        : 'Не назначены',
  },
]

export const salonActivityColumns: Array<TableColumn<SalonActivityRowDto>> = [
  { key: 'address', header: 'Филиал', render: (row) => row.address },
  { key: 'clients', header: 'Клиенты', render: (row) => row.client_count },
  { key: 'services', header: 'Услуги', render: (row) => row.service_count },
  {
    key: 'revenue',
    header: 'Выручка',
    render: (row) => formatCurrency(row.total_revenue),
  },
]

export const servicePopularityColumns: Array<TableColumn<ServicePopularityRowDto>> = [
  { key: 'service', header: 'Услуга', render: (row) => row.service_name },
  { key: 'usage', header: 'Использований', render: (row) => row.usage_count },
  { key: 'freq', header: 'Доля', render: (row) => `${(row.relative_freq * 100).toFixed(2)}%` },
]

export const masterActivityColumns: Array<TableColumn<MasterActivityRowDto>> = [
  { key: 'master', header: 'Мастер', render: (row) => row.full_name },
  { key: 'count', header: 'Услуг выполнено', render: (row) => row.service_count },
  { key: 'revenue', header: 'Выручка', render: (row) => formatCurrency(row.revenue) },
  {
    key: 'materials',
    header: 'Материалы',
    render: (row) => formatCurrency(row.material_cost),
  },
]

export const reviewsReportColumns: Array<TableColumn<ReviewReportRowDto>> = [
  { key: 'author', header: 'Автор', render: (row) => row.user?.full_name || '—' },
  { key: 'rating', header: 'Оценка', render: (row) => `${row.rating} / 5` },
  { key: 'text', header: 'Отзыв', render: (row) => row.text || '—' },
  { key: 'created', header: 'Дата', render: (row) => formatDateTime(row.created_at) },
]

export const inventoryMovementColumns: Array<TableColumn<InventoryMovementRowDto>> = [
  { key: 'salon', header: 'Салон', render: (row) => row.salon_address },
  { key: 'material', header: 'Материал', render: (row) => `${row.material_name} (${row.unit})` },
  { key: 'opening', header: 'На начало', render: (row) => row.opening_balance },
  { key: 'purchased', header: 'Поступило', render: (row) => row.purchased },
  { key: 'writtenOff', header: 'Списано', render: (row) => row.written_off },
  { key: 'current', header: 'Текущий остаток', render: (row) => row.current_balance },
]

export const clientLoyaltyColumns: Array<TableColumn<ClientLoyaltyRowDto>> = [
  { key: 'client', header: 'Клиент', render: (row) => row.full_name },
  { key: 'phone', header: 'Телефон', render: (row) => row.phone || '—' },
  { key: 'email', header: 'Email', render: (row) => row.email || '—' },
  { key: 'visits', header: 'Визиты', render: (row) => row.visit_count },
  { key: 'paid', header: 'Оплачено', render: (row) => formatCurrency(row.paid_total) },
  { key: 'bonus', header: 'Статус', render: (row) => row.bonus_status },
]

export const cancelledBookingsColumns: Array<TableColumn<CancelledBookingRowDto>> = [
  { key: 'visit', header: 'Плановый визит', render: (row) => formatDateTime(row.planned_visit) },
  { key: 'client', header: 'Клиент', render: (row) => row.client_full_name },
  { key: 'master', header: 'Мастер', render: (row) => row.master_full_name },
  { key: 'reason', header: 'Причина', render: (row) => row.cancellation_reason },
  { key: 'rate', header: 'Доля отмен', render: (row) => `${row.cancellation_rate_pct}%` },
  { key: 'status', header: 'Статус', render: (row) => formatBookingStatus(row.status) },
]

export const financialSummaryColumns: Array<TableColumn<FinancialSummaryRowDto>> = [
  { key: 'salon', header: 'Салон', render: (row) => row.salon_address },
  { key: 'item', header: 'Операция', render: (row) => row.expense_item },
  { key: 'amount', header: 'Сумма', render: (row) => formatCurrency(row.amount) },
  { key: 'date', header: 'Дата', render: (row) => formatDateTime(row.transaction_date) },
  { key: 'balance', header: 'Сальдо', render: (row) => formatCurrency(row.total_balance) },
]
