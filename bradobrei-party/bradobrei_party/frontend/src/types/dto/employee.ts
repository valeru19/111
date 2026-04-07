import type { UserDto } from './auth'
import type { SalonBriefDto, UserRole } from './common'
import type { ServiceDto } from './entities'
import type { EmployeeProfileDto } from './auth'

export interface HireEmployeeRequestDto {
  username: string
  /** Если не указан — сотрудник задаёт пароль при первом входе (вкладка на странице авторизации). */
  password?: string
  full_name: string
  phone: string
  email?: string
  role: UserRole
  specialization: string
  expected_salary: number
  work_schedule: string
  salon_id: number
}

export interface PatchMyProfileRequestDto {
  full_name?: string
  phone?: string
  email?: string
  specialization?: string
  work_schedule?: string
}

export type HireEmployeeResponseDto = EmployeeProfileDto

export interface UpdateEmployeeRequestDto {
  username: string
  full_name: string
  phone: string
  email: string
  role: UserRole
  specialization: string
  expected_salary: number
  work_schedule: string
  salon_ids: number[]
}

export interface EmployeeManagementDto {
  id: number
  user_id: number
  specialization: string
  expected_salary: number
  work_schedule?: string
  user?: UserDto
  salons?: SalonBriefDto[]
  services?: ServiceDto[]
}
