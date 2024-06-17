from django.contrib.auth import authenticate, login as auth_login, logout as auth_logout

from .models import User


class Response:
	def __init__(self, message: str | None = None, ok: bool | None = None, *args, **kwargs):
		self.ok = message is None if ok is None else ok
		self.message = message
		self.args = args
		self.kwargs = kwargs

	def __repr__(self):
		return f"<Response:{self.ok};{self.message}>"

	def __str__(self):
		return self.message

	def __bool__(self):
		return self.ok

	def __eq__(self, other):
		return self.ok == bool(other)

	def __ne__(self, other):
		return self.ok != bool(other)

	def __and__(self, other):
		return self.ok and bool(other)

	def __or__(self, other):
		return self.ok or bool(other)


def register(request, username: str, first_name: str,
		last_name: str, email: str, password: str) -> Response:
	try:
		user = User.objects.create_user(
			username=username,
			first_name=first_name,
			last_name=last_name,
			email=email,
			password=password)
		user.save()
		auth_login(request,
			authenticate(request, username=username, password=password))
	except Exception as e:
		return Response(str(e))
	return Response()


def login(request, username: str, password: str) -> Response:
	auth_user = authenticate(request, username=username, password=password)
	if auth_user is None:
		return Response('errors.invalidCredentials')
	auth_login(request, auth_user)
	return Response()


def logout(request) -> Response:
	auth_logout(request)
	return Response()


def get_user(request) -> User | None:
	user = User.objects.get(username=request.user.username,
							password=request.user.password)
	return user
