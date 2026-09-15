export type StudyOptionCourse = {
  course_id: string
  course_name: string
  course_option_id: string
  weekly_hours: number
}

export type StudyOption = {
  id: string
  name: string
  academic_year_id: string
  courses: StudyOptionCourse[]
  pathways: StudyOptionPathway[]
  total_weekly_hours: number
  created_at: string
}

export type StudyOptionPathway = {
  id: string
  name: string
  courses: StudyOptionCourse[]
  weekly_hours: number
}

export type StudyOptionCourseInput = Pick<
  StudyOptionCourse,
  'course_id' | 'course_option_id'
>

export type StudyOptionListParams = {
  page: number
  pageSize: number
  academicYearId: string
  search?: string
}

export type PaginatedStudyOptions = {
  items: StudyOption[]
  pagination: {
    page: number
    page_size: number
    total: number
    total_pages: number
  }
}

export type CreateStudyOptionInput = {
  name: string
  academic_year_id: string
  courses: StudyOptionCourseInput[]
}

export type UpdateStudyOptionCoursesInput = Pick<
  CreateStudyOptionInput,
  'academic_year_id' | 'courses'
>

export type UpdateStudyOptionPathwaysInput = {
  academic_year_id: string
  pathways: Array<{
    id?: string
    name: string
    courses: StudyOptionCourseInput[]
  }>
}

export type UpdateStudyOptionPathwayInput = {
  academic_year_id: string
  name: string
  courses: StudyOptionCourseInput[]
}
