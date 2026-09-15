import axios from 'axios'

type ClassApiError = {
  detail?: string | {
    message?: string
    student_ids?: string[]
  }
}

export function getClassMutationError(error: unknown): string {
  if (!axios.isAxiosError<ClassApiError>(error)) {
    return 'Une erreur est survenue. Veuillez réessayer.'
  }

  const detail = error.response?.data.detail
  if (
    error.response?.status === 409
    && typeof detail === 'object'
    && detail?.student_ids?.length
  ) {
    return 'Un ou plusieurs élèves appartiennent déjà à une autre classe pour cette année scolaire.'
  }
  if (error.response?.status === 409) {
    return 'Une classe portant ce nom existe déjà pour cette année scolaire.'
  }
  if (error.response?.status === 422) {
    return 'Certains membres ne sont plus disponibles avec le rôle attendu.'
  }
  return 'La classe n’a pas pu être enregistrée. Veuillez réessayer.'
}
