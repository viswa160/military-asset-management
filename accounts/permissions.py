from rest_framework.permissions import BasePermission


class IsAdmin(BasePermission):
    def has_permission(self, request, view):
        return (
            request.user.is_authenticated
            and (
                request.user.is_superuser
                or request.user.role == 'ADMIN'
            )
        )


class IsBaseCommander(BasePermission):
    """
    Allows access only to Base Commanders.
    """

    def has_permission(self, request, view):
        return (
            request.user.is_authenticated
            and request.user.role == 'COMMANDER'
        )


class IsLogisticsOfficer(BasePermission):
    """
    Allows access only to Logistics Officers.
    """

    def has_permission(self, request, view):
        return (
            request.user.is_authenticated
            and request.user.role == 'LOGISTICS'
        )


class IsAdminOrCommander(BasePermission):
    """
    Allows access to Admins and Base Commanders.
    """

    def has_permission(self, request, view):
        return (
            request.user.is_authenticated
            and request.user.role in ['ADMIN', 'COMMANDER']
        )


class IsAdminOrLogistics(BasePermission):
    """
    Allows access to Admins and Logistics Officers.
    """

    def has_permission(self, request, view):
        return (
            request.user.is_authenticated
            and request.user.role in ['ADMIN', 'LOGISTICS']
        )