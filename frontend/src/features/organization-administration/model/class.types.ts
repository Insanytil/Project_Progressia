export type SchoolClassMember = {
  id: string
  email: string
}

export type SchoolClass = {
  id: string
  name: string
  academic_year: string
  teachers: SchoolClassMember[]
  students: SchoolClassMember[]
  created_at: string
}

export type SchoolClassListParams = {
  page: number
  pageSize: number
  search?: string
  academicYear?: string
}

export type PaginatedSchoolClasses = {
  items: SchoolClass[]
  pagination: {
    page: number
    page_size: number
    total: number
    total_pages: number
  }
}

export type CreateSchoolClassInput = {
  name: string
  academic_year: string
  teacher_ids: string[]
  student_ids: string[]
}

export type UpdateSchoolClassMembersInput = Pick<
  CreateSchoolClassInput,
  'teacher_ids' | 'student_ids'
>

export type SchoolClassMemberOption = {
  id: string
  email: string
}

export type AssignableClassRole = 'teacher' | 'student'

export type PaginatedSchoolClassMemberOptions = {
  items: SchoolClassMemberOption[]
  pagination: {
    page: number
    page_size: number
    total: number
    total_pages: number
  }
}
