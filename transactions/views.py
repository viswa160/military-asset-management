from datetime import datetime, time

from django.db.models import Sum
from django.utils import timezone

from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.exceptions import ValidationError

from assets.models import Base, EquipmentType
from transactions.models import (
    Purchase,
    Transfer,
    Assignment,
    Expenditure,
    OpeningBalance,
)
from transactions.serializers import (
    BaseSerializer,
    EquipmentTypeSerializer,
    PurchaseSerializer,
    TransferSerializer,
    AssignmentSerializer,
    ExpenditureSerializer,
)
from accounts.permissions import (
    IsAdmin,
    IsAdminOrCommander,
    IsAdminOrLogistics,
)


class BaseViewSet(viewsets.ModelViewSet):
    queryset = Base.objects.all()
    serializer_class = BaseSerializer

    def get_permissions(self):
        if self.request.method in ["GET", "HEAD", "OPTIONS"]:
            return [IsAuthenticated()]
        return [IsAuthenticated(), IsAdmin()]


class EquipmentTypeViewSet(viewsets.ModelViewSet):
    queryset = EquipmentType.objects.all()
    serializer_class = EquipmentTypeSerializer

    def get_permissions(self):
        if self.request.method in ["GET", "HEAD", "OPTIONS"]:
            return [IsAuthenticated()]
        return [IsAuthenticated(), IsAdmin()]


class PurchaseViewSet(viewsets.ModelViewSet):
    queryset = Purchase.objects.all()
    serializer_class = PurchaseSerializer
    permission_classes = [IsAuthenticated, IsAdminOrLogistics]


class TransferViewSet(viewsets.ModelViewSet):
    queryset = Transfer.objects.all()
    serializer_class = TransferSerializer
    permission_classes = [IsAuthenticated, IsAdminOrLogistics]


class AssignmentViewSet(viewsets.ModelViewSet):
    serializer_class = AssignmentSerializer
    permission_classes = [IsAuthenticated, IsAdminOrCommander]

    def get_queryset(self):
        user = self.request.user

        if user.role == "COMMANDER":
            return Assignment.objects.filter(base__name=user.base_name)

        return Assignment.objects.all()


class ExpenditureViewSet(viewsets.ModelViewSet):
    serializer_class = ExpenditureSerializer
    permission_classes = [IsAuthenticated, IsAdminOrCommander]

    def get_queryset(self):
        user = self.request.user

        if user.role == "COMMANDER":
            return Expenditure.objects.filter(base__name=user.base_name)

        return Expenditure.objects.all()


class DashboardView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):

        # -----------------------------
        # Read filter values
        # -----------------------------
        base_id = request.GET.get("base")
        equipment_type_id = request.GET.get("equipment_type")
        start_date_text = request.GET.get("start_date")
        end_date_text = request.GET.get("end_date")

        # -----------------------------
        # Convert dates safely
        # -----------------------------
        start_date = None
        end_date = None

        if start_date_text:
            try:
                start_date = datetime.strptime(
                    start_date_text,
                    "%Y-%m-%d"
                ).date()
            except ValueError:
                raise ValidationError({
                    "start_date": "Use YYYY-MM-DD format."
                })

        if end_date_text:
            try:
                end_date = datetime.strptime(
                    end_date_text,
                    "%Y-%m-%d"
                ).date()
            except ValueError:
                raise ValidationError({
                    "end_date": "Use YYYY-MM-DD format."
                })

        if start_date and end_date and start_date > end_date:
            raise ValidationError({
                "date": "From Date cannot be after To Date."
            })

        # -----------------------------
        # Base querysets
        # -----------------------------
        opening_balances = OpeningBalance.objects.all()
        purchases = Purchase.objects.all()
        assignments = Assignment.objects.all()
        expenditures = Expenditure.objects.all()
        transfers = Transfer.objects.all()

        # -----------------------------
        # Base filter
        # -----------------------------
        if base_id:
            opening_balances = opening_balances.filter(
                base_id=base_id
            )

            purchases = purchases.filter(
                base_id=base_id
            )

            assignments = assignments.filter(
                base_id=base_id
            )

            expenditures = expenditures.filter(
                base_id=base_id
            )

        # -----------------------------
        # Equipment filter
        # -----------------------------
        if equipment_type_id:
            opening_balances = opening_balances.filter(
                equipment_type_id=equipment_type_id
            )

            purchases = purchases.filter(
                equipment_type_id=equipment_type_id
            )

            assignments = assignments.filter(
                equipment_type_id=equipment_type_id
            )

            expenditures = expenditures.filter(
                equipment_type_id=equipment_type_id
            )

            transfers = transfers.filter(
                equipment_type_id=equipment_type_id
            )

        # -----------------------------
        # Date filter
        # -----------------------------

        # Opening balance:
        # use opening balance available on/before From Date
        if start_date:
            opening_balances = opening_balances.filter(
                as_of_date__lte=start_date
            )

        elif end_date:
            opening_balances = opening_balances.filter(
                as_of_date__lte=end_date
            )

        # Purchases
        if start_date:
            purchases = purchases.filter(
                purchase_date__gte=start_date
            )

        if end_date:
            purchases = purchases.filter(
                purchase_date__lte=end_date
            )

        # Convert dates to timezone-aware datetime values
        # for DateTimeField filtering.
        start_datetime = None
        end_datetime = None

        if start_date:
            start_datetime = timezone.make_aware(
                datetime.combine(
                    start_date,
                    time.min
                )
            )

        if end_date:
            end_datetime = timezone.make_aware(
                datetime.combine(
                    end_date,
                    time.max
                )
            )

        # Assignments
        if start_datetime:
            assignments = assignments.filter(
                assignment_date__gte=start_datetime
            )

        if end_datetime:
            assignments = assignments.filter(
                assignment_date__lte=end_datetime
            )

        # Expenditures
        if start_datetime:
            expenditures = expenditures.filter(
                expenditure_date__gte=start_datetime
            )

        if end_datetime:
            expenditures = expenditures.filter(
                expenditure_date__lte=end_datetime
            )

        # -----------------------------
        # Transfer calculations
        # -----------------------------

        transfer_in_query = transfers
        transfer_out_query = transfers

        if base_id:
            transfer_in_query = transfers.filter(
                to_base_id=base_id
            )

            transfer_out_query = transfers.filter(
                from_base_id=base_id
            )

        if start_datetime:
            transfer_in_query = transfer_in_query.filter(
                transfer_date__gte=start_datetime
            )

            transfer_out_query = transfer_out_query.filter(
                transfer_date__gte=start_datetime
            )

        if end_datetime:
            transfer_in_query = transfer_in_query.filter(
                transfer_date__lte=end_datetime
            )

            transfer_out_query = transfer_out_query.filter(
                transfer_date__lte=end_datetime
            )

        # -----------------------------
        # Calculate totals
        # -----------------------------

        opening_balance = (
            opening_balances.aggregate(
                total=Sum("quantity")
            )["total"]
            or 0
        )

        purchase_total = (
            purchases.aggregate(
                total=Sum("quantity")
            )["total"]
            or 0
        )

        transfer_in = (
            transfer_in_query.aggregate(
                total=Sum("quantity")
            )["total"]
            or 0
        )

        transfer_out = (
            transfer_out_query.aggregate(
                total=Sum("quantity")
            )["total"]
            or 0
        )

        assigned = (
            assignments.aggregate(
                total=Sum("quantity")
            )["total"]
            or 0
        )

        expended = (
            expenditures.aggregate(
                total=Sum("quantity")
            )["total"]
            or 0
        )

        # -----------------------------
        # Dashboard formulas
        # -----------------------------

        net_movement = (
            purchase_total
            + transfer_in
            - transfer_out
        )

        closing_balance = (
            opening_balance
            + net_movement
            - assigned
            - expended
        )

        # -----------------------------
        # Return dashboard data
        # -----------------------------

        return Response({
            "opening_balance": opening_balance,
            "purchases": purchase_total,
            "transfer_in": transfer_in,
            "transfer_out": transfer_out,
            "net_movement": net_movement,
            "assigned": assigned,
            "expended": expended,
            "closing_balance": closing_balance,
        })

    
from rest_framework.views import APIView
from rest_framework.response import Response


class CurrentUserView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response({
            "username": request.user.username,
            "role": request.user.role,
            "base_name": request.user.base_name,
        })