import { apiClient } from '@/lib/api/client'

import type { AuthenticatedUser, LoginCredentials } from '../model/auth.types'

export async function getCurrentUser(): Promise<AuthenticatedUser> {
  const { data } = await apiClient.get<AuthenticatedUser>('/auth/me')
  return data
}

export async function login(credentials: LoginCredentials): Promise<void> {
  await apiClient.post('/auth/login', credentials)
}

export async function logout(): Promise<void> {
  await apiClient.post('/auth/logout')
}
