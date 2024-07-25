import json
import requests
from re import search
from django.http import JsonResponse, HttpRequest
from django.views.decorators.csrf import csrf_exempt

from api_app import auth, checker
from api_app.models import User, Usernames
from ft_django import settings


@csrf_exempt
def view_oauth42(request: HttpRequest):
	if not settings.OAUTH_42 or not settings.OAUTH_42['client_id'] or not settings.OAUTH_42['client_secret']:
		return JsonResponse({'ok': False, 'error': 'errors.oauthApiUnreachable'})
	return JsonResponse({'ok': True, 'token': settings.OAUTH_42['client_id']})


@csrf_exempt
def view_register(request: HttpRequest):
	if request.method != 'POST':
		return JsonResponse({'ok': False, 'error': 'errors.invalidMethod'})

	data = json.loads(request.body.decode(request.encoding or 'utf-8'))
	if 'username' not in data or 'password' not in data or 'email' not in data:
		return JsonResponse({'ok': False, 'error': 'errors.invalidRequest'})

	username = data['username']
	password = data['password']
	first_name = data['firstName']
	last_name = data['lastName']
	email = data['email']
	if not checker.username(username):
		return JsonResponse({'ok': False, 'error': 'errors.invalidUsername'})
	if not checker.first_name(first_name):
		return JsonResponse({'ok': False, 'error': 'errors.invalidFirstName'})
	if not checker.last_name(last_name):
		return JsonResponse({'ok': False, 'error': 'errors.invalidLastName'})
	if not checker.password(password):
		return JsonResponse({'ok': False, 'error': 'errors.invalidPassword'})
	if not checker.email(email):
		return JsonResponse({'ok': False, 'error': 'errors.invalidEmail'})

	if len(Usernames.objects.filter(username=username)) > 0:
		return JsonResponse({'ok': False, 'error': 'errors.usernameAlreadyUsed'})
	if len(User.objects.filter(email=email)) > 0:
		return JsonResponse({'ok': False, 'error': 'errors.emailAlreadyUsed'})

	result = auth.register(request,
				username=username,
				first_name=first_name,
				last_name=last_name,
				email=email,
				password=password)
	if result:
		result = auth.login(request, username=username, password=password)
	if not result or not result.token:
		return JsonResponse({'ok': False, 'error': f'{result}'})
	return JsonResponse({'ok': True, 'success': 'successes.registered', 'token': result.token})


@csrf_exempt
def view_login(request: HttpRequest):
	if request.method != 'POST':
		return JsonResponse({'ok': False, 'error': 'errors.invalidMethod'})

	data = json.loads(request.body.decode(request.encoding or 'utf-8'))
	if 'username' not in data or 'password' not in data:
		return JsonResponse({'ok': False, 'error': 'errors.invalidRequest'})

	username = data['username']
	password = data['password']
	a2f_code = data.get('a2f_code', None)

	response = auth.login(request, username=username, password=password, a2f_code=a2f_code)
	if not response or not response.token:
		return JsonResponse({'ok': False, 'error': f'{response}'})
	return JsonResponse({
		'ok': True,
		'success': 'successes.loggedIn',
		'token': response.token,
		**User.objects.get(username=response.username).json(show_email=True),
	})


@csrf_exempt
def view_auth_callback(request: HttpRequest):
	def ApiError(requestResponse):
		if requestResponse is not None and requestResponse.status_code == 401:
			error = json.loads(requestResponse.text)
			if error['error'] == 'invalid_grant':
				return JsonResponse({'ok': False, 'error': 'errors.oauthGrantExpired'})
			elif error['error'] == 'invalid_client':
				return JsonResponse({'ok': False, 'error': 'errors.oauthInvalidServerAccess'})
			else:
				return JsonResponse({'ok': False, 'error': 'errors.oauthUnexpectedApiError'})
		else:
			return JsonResponse({'ok': False, 'error': 'errors.oauthApiUnreachable'})

	if request.method != 'POST':
		return JsonResponse({'ok': False, 'error': 'errors.invalidMethod'})

	data = json.loads(request.body.decode(request.encoding or 'utf-8'))
	if 'code' not in data or 'redirect_uri' not in data:
		return JsonResponse({'ok': False, 'error': 'errors.invalidRequest'})
	if not settings.OAUTH_42 or not settings.OAUTH_42['client_id'] or not settings.OAUTH_42['client_secret']:
		return ApiError(None)
	data = {
		'grant_type': 'authorization_code',
		'code': data['code'],
		'redirect_uri': data['redirect_uri'],
		'client_id': settings.OAUTH_42['client_id'],
		'client_secret': settings.OAUTH_42['client_secret']
	}
	res = requests.post("https://api.intra.42.fr/oauth/token", data=data)
	if res.ok:
		access = json.loads(res.text)
		headers = {
			'Authorization': 'Bearer ' + access['access_token']
		}
		res = requests.get("https://api.intra.42.fr/v2/me", headers=headers)
		if res.ok:
			profile = json.loads(res.text)
			user = User.objects.filter(login_42=profile['login'])
			if not user:
				username = profile['login']
				existingUsername = User.objects.filter(username__startswith=username)
				if existingUsername:
					while existingUsername.filter(username=username):
						numberMatch = search("[0-9]+$", username)
						if numberMatch:
							pos = numberMatch.span()[0]
							login = username[:pos]
							number = int(username[pos:]) + 1
							username = login + str(number)
						else:
							username += '2'

				result = auth.register(request,
							username=username,
							first_name=profile['first_name'],
							last_name=profile['last_name'],
							email=profile['email'],
							password=None,
							login_42=profile['login'],
							picture=profile['image']['link'])

				if result:
					result = auth.login(request, username=profile['login'], oauth=True)
				if not result or not result.token:
					return JsonResponse({'ok': False, 'error': f'{result}'})
				return JsonResponse({
					'ok': True,
					'success': 'successes.registered',
					'token': result.token,
					**User.objects.get(username=result.username).json(show_email=True)
				})
			else:
				response = auth.login(request, username=profile['login'], oauth=True)
				if not response or not response.token:
					return JsonResponse({'ok': False, 'error': f'{response}'})
				return JsonResponse({
					'ok': True,
					'success': 'successes.loggedIn',
					'token': response.token,
					**User.objects.get(username=response.username).json(show_email=True),
				})
		else:
			return ApiError(res)
	else:
		return ApiError(res)


@csrf_exempt
def view_is_logged(request: HttpRequest):
	if not (response := auth.is_authenticated(request)):
		return JsonResponse({'ok': False, 'error': 'errors.notLoggedIn'})
	return JsonResponse({'ok': True, 'username': response.user})
