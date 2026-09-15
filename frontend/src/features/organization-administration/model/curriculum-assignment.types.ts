export type TeacherCourseAuthorizations = {
  academic_year_id: string
  courses: Array<{ course_id: string; course_name: string }>
}

export type EnrollmentCourse = {
  course_id: string
  course_name: string
  weekly_hours: number
  source: 'common' | 'pathway'
}

export type StudentStudyOptionEnrollment = {
  academic_year_id: string
  study_option_id: string
  study_option_name: string
  pathway_id: string | null
  pathway_name: string | null
  courses: EnrollmentCourse[]
  total_weekly_hours: number
}

export type UpdateStudentEnrollmentInput = {
  academic_year_id: string
  study_option_id: string
  pathway_id: string | null
}
