class BulkMemberEmailConflictError(Exception):
    def __init__(self, emails: list[str]):
        self.emails = emails
        super().__init__("Some email addresses already exist")
