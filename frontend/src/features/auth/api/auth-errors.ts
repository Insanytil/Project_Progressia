import axios from 'axios'

export function isUnauthorizedError(error: unknown): boolean {
  return axios.isAxiosError(error) && error.response?.status === 401
}

export function getLoginErrorMessage(error: unknown): string {
  if (isUnauthorizedError(error)) {
    return 'Adresse e-mail ou mot de passe incorrect.'
  }

  return 'La connexion est momentanément indisponible. Veuillez réessayer.'
}
