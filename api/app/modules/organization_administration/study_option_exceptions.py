class StudyOptionAlreadyExistsError(Exception):
    pass


class StudyOptionNotFoundError(Exception):
    pass


class InvalidStudyOptionCoursesError(Exception):
    pass


class InvalidStudyOptionPathwaysError(Exception):
    pass


class StudyOptionPathwayInUseError(Exception):
    pass
