export function getCurrentAcademicYearStart(): number {
  const now = new Date()
  return now.getMonth() >= 7 ? now.getFullYear() : now.getFullYear() - 1
}

export function formatAcademicYear(startYear: string, endYear: string): string {
  return `${startYear}-${endYear}`
}

export function isConsecutiveAcademicYear(
  startYear: string,
  endYear: string,
): boolean {
  return Number(endYear) === Number(startYear) + 1
}

export function getAcademicYearOptions(): string[] {
  const currentStart = getCurrentAcademicYearStart()
  return Array.from(
    { length: 22 },
    (_, index) => String(currentStart + 11 - index),
  )
}
