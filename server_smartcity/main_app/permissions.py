from rest_framework import permissions


class IsCitizen(permissions.BasePermission):
    message = 'Hanya citizen yang diizinkan membuat laporan.'

    def has_permission(self, request, view):
        return (
            request.user
            and request.user.is_authenticated
            and getattr(request.user, 'is_member', False)
            and not getattr(request.user, 'is_admin', False)
        )


class IsOwnerAndDraftOrReadOnly(permissions.BasePermission):
    message = 'Laporan hanya dapat diubah atau dihapus oleh pemiliknya saat status masih DRAFT.'

    def has_object_permission(self, request, view, obj):
        if request.method in permissions.SAFE_METHODS:
            return True

        return obj.reporter == request.user and obj.status == 'DRAFT'