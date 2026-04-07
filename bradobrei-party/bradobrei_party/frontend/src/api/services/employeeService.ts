import { apiRequest } from '../client'
import type { EmployeeProfileDto } from '../../types/dto/auth'
import type {
  EmployeeManagementDto,
  HireEmployeeRequestDto,
  PatchMyProfileRequestDto,
  UpdateEmployeeRequestDto,
} from '../../types/dto/employee'

export const employeeService = {
  getAll() {
    return apiRequest<EmployeeManagementDto[]>('/employees')
  },
  hire(payload: HireEmployeeRequestDto) {
    return apiRequest<EmployeeProfileDto>('/employees', {
      method: 'POST',
      body: payload,
    })
  },
  getMe() {
    return apiRequest<EmployeeManagementDto>('/employees/me')
  },
  patchMyProfile(payload: PatchMyProfileRequestDto) {
    return apiRequest<EmployeeManagementDto>('/employees/me/profile', {
      method: 'PATCH',
      body: payload,
    })
  },
  update(id: number, payload: UpdateEmployeeRequestDto) {
    return apiRequest<EmployeeManagementDto>(`/employees/${id}`, {
      method: 'PUT',
      body: payload,
    })
  },
  fire(id: number) {
    return apiRequest<{ message: string }>(`/employees/${id}`, {
      method: 'DELETE',
    })
  },
}
