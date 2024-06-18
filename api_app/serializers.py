from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.tokens import RefreshToken

class MyTokenObtainPairSerializer(TokenObtainPairSerializer):
	@classmethod



	def get_token(self, user):
		print(self)
		print(user)
		print(type(user))

		token = super().get_token(user)
		print(token)

		return token