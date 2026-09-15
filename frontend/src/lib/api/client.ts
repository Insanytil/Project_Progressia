import axios from 'axios'

import { getStoredOrganizationId } from '@/lib/organization-scope-storage'

export const apiClient = axios.create({
  baseURL: '/api',
  withCredentials: true,
  xsrfCookieName: 'progressia_csrf',
  xsrfHeaderName: 'X-CSRF-Token',
})

apiClient.interceptors.request.use((config) => {
  const organizationId = getStoredOrganizationId()
  if (organizationId) {
    config.headers.set('X-Organization-ID', organizationId)
  }
  return config
})
