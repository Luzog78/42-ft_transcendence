from django.contrib.auth.backends import ModelBackend
from django.contrib.auth.hashers import check_password
from django.core.exceptions import ValidationError

from .models import User


class CustomBackend(ModelBackend):
	def authenticate(self, request, username=None, password=None, oauth=False):
		try:
			if oauth:
				return User.objects.get(login_42=username)
			else:
				user = User.objects.get(username=username)
				if check_password(password, user.password):
					return user
		except User.DoesNotExist:
			return None
		except ValidationError:
			return None
		return None
