"""
ASGI config for ft_django project.

It exposes the ASGI callable as a module-level variable named ``application``.

For more information on this file, see
https://docs.djangoproject.com/en/4.2/howto/deployment/asgi/
"""

import os

from django.core.asgi import get_asgi_application
from channels.routing import ProtocolTypeRouter, URLRouter
from channels.auth import AuthMiddlewareStack

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'ft_django.settings')
os.environ["DJANGO_ALLOW_ASYNC_UNSAFE"] = "true"

from . import urls

application = ProtocolTypeRouter({
	"http": get_asgi_application(),
	"websocket": AuthMiddlewareStack(
		URLRouter(
			urls.ws_urlpatterns
		)
	),
})
