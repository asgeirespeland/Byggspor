import { apiRequest } from '@/shared/api/client'

export type UserDto = {
  id: number
  clerk_id: string
  email: string
  name: string
  phone: string | null
  is_system_admin: boolean
}

export function getCurrentUser(token?: string): Promise<UserDto> {
  return apiRequest<UserDto>('/users/me', { token })
}

export type UpdateUserPayload = {
  name: string
  phone: string | null
}

export function updateUser(
  userId: number,
  payload: UpdateUserPayload,
  token?: string,
): Promise<UserDto> {
  return apiRequest<UserDto>(`/users/${userId}`, {
    method: 'PATCH',
    body: payload,
    token,
  })
}
