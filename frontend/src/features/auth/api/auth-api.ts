import { apiClient } from '@/lib/api/client'

import type {
  AcceptInvitationInput,
  AcceptPasswordResetInput,
  AuthenticatedUser,
  Invitation,
  LoginCredentials,
  PasswordReset,
  UpdateAccountPreferencesInput,
} from '../model/auth.types'

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

export async function updateAccountPreferences(
  input: UpdateAccountPreferencesInput,
): Promise<void> {
  await apiClient.patch('/auth/me/preferences', input)
}

export async function getInvitation(token: string): Promise<Invitation> {
  const { data } = await apiClient.get<Invitation>(`/auth/invitations/${token}`)
  return data
}

export async function acceptInvitation(input: AcceptInvitationInput): Promise<void> {
  await apiClient.post('/auth/invitations/accept', input)
}

export async function getPasswordReset(token: string): Promise<PasswordReset> {
  const { data } = await apiClient.get<PasswordReset>(`/auth/password-resets/${token}`)
  return data
}

export async function acceptPasswordReset(input: AcceptPasswordResetInput): Promise<void> {
  await apiClient.post('/auth/password-resets/accept', input)
}
