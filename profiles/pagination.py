from rest_framework.pagination import PageNumberPagination

class TutorPagination(PageNumberPagination):
    page_size = 6  # количество репетиторов на странице
    page_size_query_param = 'page_size'  # можно передавать ?page_size=20
    max_page_size = 100