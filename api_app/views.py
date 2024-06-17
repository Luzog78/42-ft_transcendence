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
	if result:
		result = auth.login(request, username=username, password=password)
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
	a2f_code = None
	if 'a2f_code' in data:
		a2f_code = data['a2f_code']
	result = auth.login(request, username=username, password=password, a2f_code=a2f_code)
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
	waiting, playing, ended = [], [], []
	i = 0
	try:
		while True:
			json = games[i].json()
			if json['waiting']:
				waiting.append(json)
			elif json['playing']:
				playing.append(json)
			else:
				ended.append(json)
			i += 1
	except IndexError:
		pass
	return JsonResponse({
		'ok': True,
		'waitingLength': len(waiting),
		'playingLength': len(playing),
		'endedLength': len(ended),
		'total': i,
		'waiting': waiting,
		'playing': playing,
		'ended': ended,
	})


@csrf_exempt
def view_game_list(request):
	if request.method != 'POST':
		return JsonResponse({'ok': False, 'error': 'errors.invalidMethod'})
	
	data = json.loads(request.body.decode(request.encoding or 'utf-8'))
	if 'uids' not in data:
		return JsonResponse({'ok': False, 'error': 'errors.invalidRequest'})
	
	uids = data['uids']
	l, l_not_found = [], []
	for uid in uids:
		game = Game.objects.filter(uid=uid)
		if not game:
			l_not_found.append(uid)
		else:
			game = game[0]
			l.append(game.json())

	return JsonResponse({
		'ok': True,
		'length': len(l),
		'notFoundLength': len(l_not_found),
		'total': len(uids),
		'games': l,
		'notFound': l_not_found,
	})


@csrf_exempt
def view_game_user(request, username: str):
	games = Game.objects.filter(players__contains=[username])
	won, lost = [], []
	i = 0
	try:
		while True:
			if games[i].winner and games[i].winner.username == request.user.username:
				won.append(games[i].uid)
			else:
				lost.append(games[i].uid)
			i += 1
	except IndexError:
		pass
	winrate = float(len(won)) / (len(won) + len(lost)) * 100
	winrate = f'{"0" if winrate < 10 else ""}{winrate:.8f}'
	return JsonResponse({
		'ok': True,
		'wonLength': len(won),
		'lostLength': len(lost),
		'total': i,
		'winrate': winrate,
		'won': won,
		'lost': lost,
	})


@csrf_exempt
def view_game_uid(request, uid: str):
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
	if request.user.is_authenticated:
		return JsonResponse({ 'ok': False })

	auth.register(request,
		username='123',
		first_name='123',
		last_name='123',
		email='123@123.net',
		password='1234')
	auth.login(request, username='123', password='1234')
	user = auth.get_user(request)

	Game.objects.create(uid=Game.new_uid())
	Game.objects.create(uid=Game.new_uid())
	Game.objects.create(uid=Game.new_uid())
	Game.objects.create(uid=Game.new_uid())

	Game.objects.create(uid=Game.new_uid(), players=['123'], winner=user)
	Game.objects.create(uid=Game.new_uid(), players=['123'], winner=user)
	Game.objects.create(uid=Game.new_uid(), players=['123'])
	Game.objects.create(uid=Game.new_uid(), players=['123'])

	return JsonResponse({
		'ok': True,
		'success': 'Whatever...',
		'whatever': whatever,
	})
