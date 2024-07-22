import time
import json
import random
from django.http import JsonResponse, HttpRequest
from django.views.decorators.csrf import csrf_exempt

from api_app import auth, checker
from api_app.models import Ressources, User



@csrf_exempt
def view_user(request: HttpRequest, username: str | None = None):
	user = None
	show_email = False

	if username is None:
		if not (response := auth.is_authenticated(request)):
			return JsonResponse({'ok': False, 'error': 'errors.notLoggedIn'})
		user = User.objects.filter(username=response.user)
		if not user:
			return JsonResponse({'ok': False, 'error': 'errors.userNotFound'})
		user = user[0]
		show_email = True

	else:
		if not (user := User.get(username)):
			return JsonResponse({'ok': False, 'error': 'errors.userNotFound'})
		if (response := auth.is_authenticated(request)) \
			and (response.user == username or (
				(client := User.objects.filter(username=response.user)) \
				and client[0].is_admin)): # type: ignore
			show_email = True

	return JsonResponse({
		'ok': True,
		**user.json(show_email=show_email),
	})


@csrf_exempt
def view_user_set(request: HttpRequest, username: str):
	if not (response := auth.is_authenticated(request)):
		return JsonResponse({'ok': False, 'error': 'errors.notLoggedIn'})

	if request.method != 'POST':
		return JsonResponse({'ok': False, 'error': 'errors.invalidMethod'})

	if not (user := User.get(username)):
		return JsonResponse({'ok': False, 'error': 'errors.userNotFound'})

	if response.user != username and not (
			(client := User.objects.filter(username=response.user)) \
			and client.is_admin): # type: ignore
		return JsonResponse({'ok': False, 'error': 'errors.invalidRequest'})

	data = json.loads(request.body.decode(request.encoding or 'utf-8'))

	for key, _ in data.items():
		if key not in ['firstName', 'lastName', 'email', 'oldPassword', 'password', 'lang', 'a2f']:
			return JsonResponse({'ok': False, 'error': 'errors.invalidRequest'})

	success, error, complement = [], [], {}

	try:
		if 'firstName' in data:
			first_name = data['firstName']
			if not checker.first_name(first_name):
				error.append('errors.invalidFirstName')
			elif first_name != user.first_name:
				user.first_name = first_name
				success.append('successes.firstNameSet')

		if 'lastName' in data:
			last_name = data['lastName']
			if not checker.last_name(last_name):
				error.append('errors.invalidLastName')
			elif last_name != user.last_name:
				user.last_name = last_name
				success.append('successes.lastNameSet')

		if 'email' in data:
			email = data['email']
			if not checker.email(email):
				error.append('errors.invalidEmail')
			elif email != user.email:
				user.email = email
				success.append('successes.emailSet')

		if 'password' in data:
			if user.login_42 is not None:
				error.append('errors.editPasswordOAuth')
			else:
				oldPassword = data['oldPassword']
				password = data['password']
				if not checker.password(password):
					error.append('errors.invalidPassword')
				elif not user.check_password(oldPassword):
					error.append('errors.invalidCredentials')
				else:
					user.set_password(password)
					success.append('successes.passwordSet')

		if 'lang' in data:
			lang = data['lang']
			if not checker.locale(lang):
				error.append('errors.invalidLang')
			elif lang != user.lang:
				user.lang = lang
				success.append('successes.langSet')

		if 'a2f' in data:
			if user.login_42 is not None:
				error.append('errors.toggleA2FOauth')
			else:
				if data['a2f']:
					token_arr = [random.choice('ABCDEFGHIJKLMNOPQRSTUVWXYZ234567') for i in range(32)]
					token = ''.join(token_arr)
					user.a2f_token = token
					success.append('successes.a2fEnabled')
					complement["a2f_token"] = token
				else:
					user.a2f_token = None
					success.append('successes.a2fDisabled')

		user.save()
	except Exception as e:
		res = {'ok': False, 'error': f'Error: {e}', 'success': success, 'error': error}
		if len(complement) != 0:
			res["complement"] = complement
		return JsonResponse(res)

	res = {
		'ok': True,
		'successes': success,
		'errors': error,
		**user.json(show_email=True),
	}
	if len(complement) != 0:
		res["complement"] = complement
	return JsonResponse(res)


@csrf_exempt
def view_user_setpic(request: HttpRequest, username: str):
	if request.method != 'POST':
		return JsonResponse({'ok': False, 'error': 'errors.invalidMethod'})

	if not (response := auth.is_authenticated(request)):
		return JsonResponse({'ok': False, 'error': 'errors.notLoggedIn'})

	if not (user := User.get(username)):
		return JsonResponse({'ok': False, 'error': 'errors.userNotFound'})

	if response.user != username and not (
			(client := User.objects.filter(username=response.user)) \
			and client.is_admin): # type: ignore
		return JsonResponse({'ok': False, 'error': 'errors.invalidRequest'})

	if 'picture' not in request.FILES:
		return JsonResponse({'ok': False, 'error': 'errors.invalidRequest'})

	file = request.FILES['picture']

	if file.size > 4194304:
		return JsonResponse({'ok': False, 'error': 'errors.pictureTooBig'})

	extension = None
	match file.content_type:
		case 'image/jpeg': extension = 'jpg'
		case 'image/png': extension = 'png'
		case 'image/gif': extension = 'gif'
		case 'image/webp': extension = 'webp'
		case 'image/svg+xml': extension = 'svg'
		case 'image/bmp': extension = 'bmp'
		case 'image/tiff': extension = 'tiff'
		case 'image/x-icon': extension = 'ico'
		case _: return JsonResponse({'ok': False, 'error': 'errors.invalidPictureType'})

	try:
		name = f'{username}-{time.time()}.{extension}'

		r = Ressources.objects.filter(info=username)
		for res in r:
			res.delete()
		Ressources.objects.create(name=name, info=username,
			type=file.content_type, size=file.size, data=file.read())

		name = f'/api/ressource/{name}?raw=true'

		user.picture = name
		user.save()

		return JsonResponse({'ok': True, 'success': 'successes.pictureSet', 'picture': name})
	except Exception as e:
		return JsonResponse({'ok': False, 'error': f'Error: {e}'})


@csrf_exempt
def view_user_del(request: HttpRequest, username: str):
	if not (response := auth.is_authenticated(request)):
		return JsonResponse({'ok': False, 'error': 'errors.notLoggedIn'})

	if not (user := User.get(username)):
		return JsonResponse({'ok': False, 'error': 'errors.userNotFound'})

	if response.user != username and not (
			(client := User.objects.filter(username=response.user)) \
			and client.is_admin): # type: ignore
		return JsonResponse({'ok': False, 'error': 'errors.invalidRequest'})

	try:
		user.delete()
	except Exception as e:
		return JsonResponse({'ok': False, 'error': f'Error: {e}'})
	return JsonResponse({'ok': True})
