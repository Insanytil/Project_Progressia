from enum import StrEnum


class OrganizationRole(StrEnum):
    ORGANIZATION_ADMIN = "organization_admin"
    TEACHER = "teacher"
    STUDENT = "student"