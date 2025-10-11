from django.urls import path
from users.views import RegisterView, ActivateAccountView, CustomTokenObtainPairView, CustomTokenRefreshView

urlpatterns = [
    path("register/", RegisterView.as_view(), name="register"),
    path("activate/<str:code>/", ActivateAccountView.as_view(), name="activate-account"),
    path('login/', CustomTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('refresh/', CustomTokenRefreshView.as_view(), name='token_refresh'),
]