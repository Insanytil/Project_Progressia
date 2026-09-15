const ACADEMIC_YEAR_KEY_PREFIX = 'progressia.current-academic-year-id'

function storageKey(organizationId: string): string {
  return `${ACADEMIC_YEAR_KEY_PREFIX}.${organizationId}`
}

export function getStoredAcademicYearId(
  organizationId: string,
): string | null {
  if (typeof window === 'undefined') return null
  return window.sessionStorage.getItem(storageKey(organizationId))
}

export function storeAcademicYearId(
  organizationId: string,
  academicYearId: string | null,
): void {
  if (typeof window === 'undefined') return
  if (academicYearId) {
    window.sessionStorage.setItem(storageKey(organizationId), academicYearId)
  } else {
    window.sessionStorage.removeItem(storageKey(organizationId))
  }
}
