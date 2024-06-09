
from django.urls import path, re_path
from . import views

urlpatterns = [
	re_path('static/.*', views.static),
	re_path('.*', views.index),
]
