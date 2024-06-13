import json
from django.http import JsonResponse
from django.contrib.auth import authenticate, login as auth_login, logout as auth_logout
from django.contrib.auth.models import User
from django.views.decorators.csrf import csrf_exempt


@csrf_exempt
def err404(request):
	return JsonResponse({'ok': False, 'error': 'errors.404'})


@csrf_exempt
def register(request):
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
	if len(username) < 3 or len(username) > 24 \
		or any(c not in 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789_' for c in username):
		return JsonResponse({'ok': False, 'error': 'errors.invalidUsername'})
	if len(first_name) < 1 or len(first_name) > 24:
		return JsonResponse({'ok': False, 'error': 'errors.invalidFirstName'})
	if len(last_name) < 1 or len(last_name) > 24:
		return JsonResponse({'ok': False, 'error': 'errors.invalidLastName'})
	if len(password) < 4:
		return JsonResponse({'ok': False, 'error': 'errors.invalidPassword'})
	if len(email) < 6 or len(email) > 254:
		return JsonResponse({'ok': False, 'error': 'errors.invalidEmail'})

	if len(User.objects.filter(username=username)) > 0:
		return JsonResponse({'ok': False, 'error': 'errors.usernameAlreadyUsed'})
	if len(User.objects.filter(email=email)) > 0:
		return JsonResponse({'ok': False, 'error': 'errors.emailAlreadyUsed'})

	try:
		user = User.objects.create_user(
			username=username,
			first_name=first_name,
			last_name=last_name,
			email=email,
			password=password)
		user.save()
		auth_login(request, authenticate(request, username=username, password=password))
	except Exception as e:
		return JsonResponse({'ok': False, 'error': f'Internal server error: {e}'})
	return JsonResponse({'ok': True, 'success': 'successes.registered'})


@csrf_exempt
def login(request):
	if request.method != 'POST':
		return JsonResponse({'ok': False, 'error': 'errors.invalidMethod'})

	data = json.loads(request.body.decode(request.encoding or 'utf-8'))
	if 'username' not in data or 'password' not in data:
		return JsonResponse({'ok': False, 'error': 'errors.invalidRequest'})

	username = data['username']
	password = data['password']
	user = authenticate(request, username=username, password=password)
	if user is None:
		return JsonResponse({'ok': False, 'error': 'errors.invalidCredentials'})
	auth_login(request, user)
	return JsonResponse({
		'ok': True,
		'success': 'successes.loggedIn',
		'username': request.user.username,
		'firstName': request.user.first_name,
		'lastName': request.user.last_name,
		'email': request.user.email
	})


@csrf_exempt
def logout(request):
	auth_logout(request)
	return JsonResponse({'ok': True, 'success': 'successes.loggedOut'})


@csrf_exempt
def profile(request):
	if not request.user.is_authenticated:
		return JsonResponse({'ok': False, 'error': 'errors.notLoggedIn'})
	return JsonResponse({
		'ok': True,
		'username': request.user.username,
		'firstName': request.user.first_name,
		'lastName': request.user.last_name,
		'email': request.user.email
	})
