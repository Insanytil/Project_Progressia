import uuid


class SchoolClassAlreadyExistsError(Exception):
    pass


class SchoolClassNotFoundError(Exception):
    pass


class StudentsAlreadyAssignedError(Exception):
    def __init__(self, *, student_ids: set[uuid.UUID]):
        self.student_ids = student_ids
        super().__init__(
            "Some students are already assigned to a class for this academic year"
        )


class InvalidSchoolClassMembersError(Exception):
    def __init__(
        self,
        *,
        teacher_ids: set[uuid.UUID],
        student_ids: set[uuid.UUID],
    ):
        self.teacher_ids = teacher_ids
        self.student_ids = student_ids
        super().__init__("Some selected users cannot be assigned to this class")
