from django.urls import path, re_path
from . import views

urlpatterns = [
	path('login', views.login, name='api-login'),
	path('logout', views.logout, name='api-logout'),
	path('register', views.register, name='api-register'),
	path('profile', views.profile, name='api-profile'),
	path('<int:whatever>', views.test, name='api-test'),
	re_path('.*', views.err404),
]
