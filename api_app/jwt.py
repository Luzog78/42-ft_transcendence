import time
import json
import base64
import hashlib
import hmac

from ft_django import settings


type Token = str


def generate_token(user):
	jwt_header = {
		"alg": "HS256",
		"typ": "JWT"
	}
	jwt_payload = {
		"user": user,
		"exp": int(time.time()) + 60 * 60 * 24 * 30 # 1 mois
	}
	jwt_header_json = json.dumps(jwt_header)
	jwt_payload_json = json.dumps(jwt_payload)
	jwt_header_b64 = base64.urlsafe_b64encode(bytes(jwt_header_json, 'utf-8')).rstrip(b"=")
	jwt_payload_b64 = base64.urlsafe_b64encode(bytes(jwt_payload_json, 'utf-8')).rstrip(b"=")

	token = jwt_header_b64 + b'.' + jwt_payload_b64
	signature = base64.urlsafe_b64encode(hmac.new(bytes(settings.SECRET_KEY, "utf-8"),
		msg=token,digestmod=hashlib.sha256).digest()).rstrip(b"=").decode()

	return token.decode('utf-8') + '.' + signature


def base64_decode_stripped(string):
	"""
	Adds back in the required padding before decoding.
	"""
	padding = 4 - (len(string) % 4)
	string = string + ("=" * padding)
	return base64.urlsafe_b64decode(string)


def verify_token(token: Token) -> str | None:
	data = token.split('.')
	if len(data) != 3:
		return None
	
	try:
		jwt_header_json = json.loads(base64_decode_stripped(data[0]))
		jwt_payload_json = json.loads(base64_decode_stripped(data[1]))
	except:
		return None
	
	if 'alg' not in jwt_header_json or 'typ' not in jwt_header_json \
		or jwt_header_json['alg'] != 'HS256' or jwt_header_json['typ'] != 'JWT':
		return None
	
	if 'exp' not in jwt_payload_json or 'user' not in jwt_payload_json \
		or not isinstance(jwt_payload_json["exp"], int) or jwt_payload_json["exp"] < time.time():
		return None

	signature = base64.urlsafe_b64encode(hmac.new(bytes(settings.SECRET_KEY, "utf-8"),
		msg=bytes(data[0] + "." + data[1], "utf-8"),digestmod=hashlib.sha256).digest()).rstrip(b"=").decode()
	if (signature != data[2]):
		return None
	return jwt_payload_json["user"]
