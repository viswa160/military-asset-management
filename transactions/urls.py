from django.urls import path
from rest_framework.routers import DefaultRouter

from transactions.views import (
    BaseViewSet,
    EquipmentTypeViewSet,
    PurchaseViewSet,
    TransferViewSet,
    AssignmentViewSet,
    ExpenditureViewSet,
    DashboardView,
)


router = DefaultRouter()

router.register('bases', BaseViewSet, basename='bases')
router.register(
    'equipment-types',
    EquipmentTypeViewSet,
    basename='equipment-types'
)
router.register('purchases', PurchaseViewSet, basename='purchases')
router.register('transfers', TransferViewSet, basename='transfers')
router.register('assignments', AssignmentViewSet, basename='assignments')
router.register('expenditures', ExpenditureViewSet, basename='expenditures')


urlpatterns = [
    path('dashboard/', DashboardView.as_view(), name='dashboard'),
]

urlpatterns += router.urls