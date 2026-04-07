import { apiRequest } from '../client'
import type { ServiceDto, ServiceMaterialDto, UpsertServiceRequestDto } from '../../types/dto/entities'

export const serviceService = {
  getAll() {
    return apiRequest<ServiceDto[]>('/services')
  },
  getById(id: number) {
    return apiRequest<ServiceDto>(`/services/${id}`)
  },
  create(payload: UpsertServiceRequestDto) {
    return apiRequest<ServiceDto>('/services', {
      method: 'POST',
      body: payload,
    })
  },
  update(id: number, payload: UpsertServiceRequestDto) {
    return apiRequest<ServiceDto>(`/services/${id}`, {
      method: 'PUT',
      body: payload,
    })
  },
  remove(id: number) {
    return apiRequest<{ message: string }>(`/services/${id}`, {
      method: 'DELETE',
    })
  },
  setMaterials(id: number, payload: Array<Pick<ServiceMaterialDto, 'material_id' | 'quantity_per_use'>>) {
    return apiRequest<{ message: string }>(`/materials/service/${id}`, {
      method: 'PUT',
      body: payload,
    })
  },
  assignMaster(id: number, targetUserId: number) {
    return apiRequest<{ message: string }>(`/services/${id}/assign-master`, {
      method: 'POST',
      body: { target_user_id: targetUserId },
    })
  },
  removeMaster(id: number, profileId: number) {
    return apiRequest<{ message: string }>(`/services/${id}/assign-master/${profileId}`, {
      method: 'DELETE',
    })
  },
}
