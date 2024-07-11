import pyotp
from django.http import HttpRequest
from django.contrib.auth import authenticate

from .models import User
from . import jwt


class Response:
	def __init__(self, message: str | None = None, ok: bool | None = None, *args, **kwargs):
		self.__dict__['ok'] = message is None if ok is None else ok
		self.__dict__['message'] = message
		self.__dict__['args'] = args
		self.__dict__['kwargs'] = kwargs

	def __repr__(self):
		return f"<Response:{self.ok};{self.message}>"

	def __str__(self):
		return str(self.message)

	def __bool__(self):
		return bool(self.ok)

	def __eq__(self, other):
		return bool(self.ok) == bool(other)

	def __ne__(self, other):
		return bool(self.ok) != bool(other)

	def __and__(self, other):
		return bool(self.ok) and bool(other)

	def __or__(self, other):
		return bool(self.ok) or bool(other)

	def __getitem__(self, key):
		if key not in self.__dict__['kwargs']:
			return None
		return self.__dict__['kwargs'][key]

	def __setitem__(self, key, value):
		self.__dict__['kwargs'][key] = value

	def __getattr__(self, key):
		if key in self.__dict__:
			return self.__dict__[key]
		if key in self.__dict__['kwargs']:
			return self.kwargs[key]
		return None

	def __setattr__(self, key, value):
		if key in self.__dict__:
			self.__dict__[key] = value
		else:
			self.__dict__['kwargs'][key] = value


def register(request: HttpRequest, username: str, first_name: str,
		last_name: str, email: str, password: str | None, **extra_fields) -> Response:
	try:
		user = User.objects.create_user( # type: ignore
			username=username,
			first_name=first_name,
			last_name=last_name,
			email=email,
			password=password,
			**extra_fields)
		user.save()
		return Response(user=user, username=user.username)
	except Exception as e:
		return Response(str(e))


def login(request: HttpRequest, username: str, password: str | None = None, a2f_code: str | None = None, oauth: bool = False) -> Response:
	if oauth:
		user: User = authenticate(request, username=username, oauth = True)
	else:
		user: User = authenticate(request, username=username, password=password) # type: ignore
	if user is None:
		return Response('errors.invalidCredentials')

	if not oauth:
		if user.a2f_token is not None:
			if a2f_code is None:
				return Response('errors.missingA2F')
			if not pyotp.TOTP(user.a2f_token).verify(a2f_code):
				return Response('errors.invalidCredentials')

	jwt_token = jwt.generate_token(user.username)
	return Response(token=jwt_token, user=user, username=user.username)


def is_authenticated(request: HttpRequest) -> Response:
	token = request.headers.get('Authorization')
	if token is not None:
		if token.startswith('Bearer '):
			token = token[7:]
		else:
			token = None
	user = None
	if token is not None:
		user = jwt.verify_token(token)
	if user is None:
		return Response('errors.invalidToken')
	return Response(token=token, user=user)
