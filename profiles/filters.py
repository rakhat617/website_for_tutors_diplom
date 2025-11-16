import django_filters
from django.db.models import Q
from users.models import User

class TutorFilter(django_filters.FilterSet):
    search = django_filters.CharFilter(method='filter_search')
    subject = django_filters.NumberFilter(field_name="subjects__id")
    min_price = django_filters.NumberFilter(field_name="price_per_hour", lookup_expr="gte")
    max_price = django_filters.NumberFilter(field_name="price_per_hour", lookup_expr="lte")
    min_rating = django_filters.NumberFilter(field_name="rating", lookup_expr="gte")

    def filter_search(self, queryset, name, value):
        return queryset.filter(
            Q(first_name__icontains=value) |
            Q(last_name__icontains=value) |
            Q(bio__icontains=value)
        )

    class Meta:
        model = User
        fields = ['subject', 'min_price', 'max_price', 'min_rating', 'search']

