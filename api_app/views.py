import json
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt

from .models import User, Game, Stats
from . import auth


@csrf_exempt
def view_err404(request):
	return JsonResponse({'ok': False, 'error': 'errors.404'})


@csrf_exempt
def view_root(request):
	return JsonResponse({
		'ok': True,
		'api': 'v1',
		'endpoints': [
			'login',
			'logout',
			'register',
			'user',
			'user/<str:username>',
			'games',
			'game/<str:uid>',
			'stats/<int:id>',
			'stats/u/<str:username>',
			'stats/g/<str:uid>',
			'<int:whatever>',
		],
		'errors': [
			'errors.404',
			'errors.invalidMethod',
			'errors.invalidRequest',
			'errors.invalidUsername',
			'errors.invalidFirstName',
			'errors.invalidLastName',
			'errors.invalidPassword',
			'errors.invalidEmail',
			'errors.usernameAlreadyUsed',
			'errors.emailAlreadyUsed',
			'errors.notLoggedIn',
			'errors.userNotFound',
			'errors.gameNotFound',
			'errors.statsNotFound',
		],
		'successes': [
			'successes.registered',
			'successes.loggedIn',
			'successes.loggedOut',
			'successes.gameCreated',
		],
	})


@csrf_exempt
def view_register(request):
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

	result = auth.register(request,
						username=username,
						first_name=first_name,
						last_name=last_name,
						email=email,
						password=password)
	if not result:
		return JsonResponse({'ok': False, 'error': f'Internal server error: {result}'})
	return JsonResponse({'ok': True, 'success': 'successes.registered'})


@csrf_exempt
def view_login(request):
	if request.method != 'POST':
		return JsonResponse({'ok': False, 'error': 'errors.invalidMethod'})

	data = json.loads(request.body.decode(request.encoding or 'utf-8'))
	if 'username' not in data or 'password' not in data:
		return JsonResponse({'ok': False, 'error': 'errors.invalidRequest'})

	username = data['username']
	password = data['password']
	result = auth.login(request, username=username, password=password)
	if not result:
		return JsonResponse({'ok': False, 'error': f'{result}'})
	return JsonResponse({
		'ok': True,
		'success': 'successes.loggedIn',
		**request.user.json(show_email=True),
	})


@csrf_exempt
def view_logout(request):
	result = auth.logout(request)
	if not result:
		return JsonResponse({'ok': False, 'error': f'{result}'})
	return JsonResponse({'ok': True, 'success': 'successes.loggedOut'})


@csrf_exempt
def view_user(request, username: str | None = None):
	user = None
	show_email = False
	if username is None:
		if not request.user.is_authenticated:
			return JsonResponse({'ok': False, 'error': 'errors.notLoggedIn'})
		user = request.user
		show_email = True
	else:
		user = User.objects.filter(username=username)
		if not user:
			return JsonResponse({'ok': False, 'error': 'errors.userNotFound'})
		user = user[0]
		if request.user.is_authenticated and (
			request.user.username == username or request.user.is_admin):
			show_email = True
	return JsonResponse({
		'ok': True,
		**user.json(show_email=show_email),
	})


@csrf_exempt
def view_games(request):
	games = Game.objects.all()
	l = []
	i = 0
	try:
		while True:
			l.append(games[i].json())
			i += 1
	except IndexError:
		pass
	return JsonResponse({
		'ok': True,
		'length': i,
		'games': l
	})


@csrf_exempt
def view_game(request, uid: str):
	game = None
	if uid == 'new':
		if not request.user.is_authenticated:
			return JsonResponse({'ok': False, 'error': 'errors.notLoggedIn'})
		game = Game.objects.create(uid=Game.new_uid())
	else:
		game = Game.objects.filter(uid=uid)
		if not game:
			return JsonResponse({'ok': False, 'error': 'errors.gameNotFound'})
		game = game[0]
	return JsonResponse({
		'ok': True,
		**game.json(),
	})


@csrf_exempt
def view_stats_id(request, id: int):
	stats = Stats.objects.filter(id=id)
	if not stats:
		return JsonResponse({'ok': False, 'error': 'errors.statsNotFound'})
	stats = stats[0]
	return JsonResponse({
		'ok': True,
		'length': 1,
		'stats': [
			{
				**stats.json(),
			},
		],
	})


@csrf_exempt
def view_stats_user(request, username: str):
	stats = Stats.objects.filter(username=username)
	l = []
	i = 0
	try:
		while True:
			l.append(stats[i].json())
			i += 1
	except IndexError:
		pass
	return JsonResponse({
		'ok': True,
		'length': i,
		'stats': l
	})


@csrf_exempt
def view_stats_game(request, uid: str):
	stats = Stats.objects.filter(game_uid=uid)
	l = []
	i = 0
	try:
		while True:
			l.append(stats[i].json())
			i += 1
	except IndexError:
		pass
	return JsonResponse({
		'ok': True,
		'length': i,
		'stats': l
	})


@csrf_exempt
def view_test(request, whatever):
	vals = User.objects.all().values()
	return JsonResponse({
		'ok': True,
		'success': 'Whatever...',
		'whatever': whatever,
		'vals': str(vals)
	})
