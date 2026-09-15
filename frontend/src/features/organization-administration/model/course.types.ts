export type CourseOption = {
  id: string
  weekly_hours: number
}

export type Course = {
  id: string
  name: string
  academic_year_id: string
  options: CourseOption[]
  created_at: string
}

export type CourseListParams = {
  page: number
  pageSize: number
  academicYearId: string
  search?: string
}

export type PaginatedCourses = {
  items: Course[]
  pagination: {
    page: number
    page_size: number
    total: number
    total_pages: number
  }
}

export type CreateCourseInput = {
  name: string
  academic_year_id: string
  options: number[]
}

export type UpdateCourseOptionsInput = Pick<
  CreateCourseInput,
  'academic_year_id' | 'options'
>
