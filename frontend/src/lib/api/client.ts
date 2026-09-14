import axios from 'axios'

export const apiClient = axios.create({
  baseURL: '/api',
  withCredentials: true,
  xsrfCookieName: 'progressia_csrf',
  xsrfHeaderName: 'X-CSRF-Token',
})