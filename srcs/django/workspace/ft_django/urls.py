"""
URL configuration for ft_django project.

The `urlpatterns` list routes URLs to views. For more information please see:
	https://docs.djangoproject.com/en/4.2/topics/http/urls/
Examples:
Function views
	1. Add an import:  from my_app import views
	2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
	1. Add an import:  from other_app.views import Home
	2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
	1. Import the include() function: from django.urls import include, path
	2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.urls import path, include
from .pong_socket import PongSocket
from .chat_socket import ChatSocket


ws_urlpatterns = [
	path('ws/pong', PongSocket.as_asgi()),
	path('ws/chat', ChatSocket.as_asgi())
]

urlpatterns = [
	path('api/', include('api_app.urls')),
	path('api', include('api_app.urls')),
]
