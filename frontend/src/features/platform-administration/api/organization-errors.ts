import axios from 'axios'

type ApiErrorPayload = {
  detail?: string
}

export function getOrganizationMutationError(error: unknown): string {
  if (axios.isAxiosError<ApiErrorPayload>(error)) {
    if (error.response?.status === 409) {
      return 'Une organisation utilise déjà ce nom ou ce slug.'
    }

    if (error.response?.status === 422) {
      return 'Certaines informations sont invalides.'
    }
  }

  return 'Une erreur est survenue. Veuillez réessayer.'
}

export function getOrganizationDeletionError(error: unknown): string {
  if (axios.isAxiosError<ApiErrorPayload>(error) && error.response?.status === 409) {
    return 'Cette organisation contient encore des membres et ne peut pas être supprimée.'
  }

  return 'L’organisation n’a pas pu être supprimée.'
}
