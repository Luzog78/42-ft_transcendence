import os
import time
import json
import random
from django.http import JsonResponse, HttpRequest
from django.views.decorators.csrf import csrf_exempt

from .models import GameMode, User, Game, Stats
from . import auth, checker
from ft_django import settings
from ft_django.tournament import pool as tournament_manager
from ft_django import pong_socket


@csrf_exempt
def view_err404(request: HttpRequest):
	return JsonResponse({'ok': False, 'error': 'errors.404'})


@csrf_exempt
def view_root(request: HttpRequest):
	return JsonResponse({
		'ok': True,
		'api': 'v1',
		'endpoints': [
			'login',
			'register',
			'user',
			'user/<str:username>',
			'user/<str:username>/set',
			'user/<str:username>/del',
			'games',
			'game/l',
			'game/u/<str:username>',
			'game/g/<str:uid>',
			'game/new',
			'game/rand',
			'stats/<int:id>',
			'stats/u/<str:username>',
			'stats/g/<str:uid>',
			'<int:whatever>',
		],
		'errors': [
			'errors.404',
			'errors.invalidMethod',
			'errors.invalidRequest',
			'errors.notLoggedIn',
			'errors.invalidUsername',
			'errors.invalidFirstName',
			'errors.invalidLastName',
			'errors.invalidPassword',
			'errors.invalidEmail',
			'errors.usernameAlreadyUsed',
			'errors.emailAlreadyUsed',
			'errors.userNotFound',
			'errors.invalidLang',
			'errors.a2fBadLength',
			'errors.gameNotFound',
			'errors.statsNotFound',
		],
		'successes': [
			'successes.registered',
			'successes.loggedIn',
			'successes.firstNameSet',
			'successes.lastNameSet',
			'successes.emailSet',
			'successes.passwordSet',
			'successes.langSet',
			'successes.a2fEnabled',
			'successes.a2fDisabled',
		],
	})


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

	success, error = [], []

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
			a2f = data['a2f']
			if not (a2f is None or checker.a2f_code(a2f)):
				error.append('errors.a2fBadLength')
			else:
				user.a2f_token = a2f
				if a2f is None:
					success.append('successes.a2fDisabled')
				else:
					success.append('successes.a2fEnabled')

		user.save()
	except Exception as e:
		return JsonResponse({'ok': False, 'error': f'Error: {e}', 'success': success, 'error': error})

	return JsonResponse({
		'ok': True,
		'successes': success,
		'errors': error,
		**user.json(show_email=True),
	})


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

	basedir = f'{settings.BASE_DIR}/game_app'
	static = '/static/img/pic'

	realdir = f'{basedir}{static}'
	name = f'{static}/{username}-{time.time()}.{extension}'
	filename = f'{basedir}{name}'

	try:
		for dir_path, dir_names, file_names in os.walk(realdir):
			if str(dir_path) == str(realdir):
				for file_name in file_names:
					if file_name.startswith(f'{username}-'):
						os.remove(f'{dir_path}/{file_name}')

		with open(filename, 'wb') as f:
			f.write(request.FILES['picture'].read())

		user.picture = name
		user.save()
	except Exception as e:
		return JsonResponse({'ok': False, 'error': f'Error: {e}'})

	return JsonResponse({'ok': True, 'success': 'successes.pictureSet', 'picture': name})


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


@csrf_exempt
def view_games(request: HttpRequest):
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
def view_game_list(request: HttpRequest):
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
def view_game_user(request: HttpRequest, username: str):
	games = Game.objects.filter(players__contains=[username])
	won, lost, other = [], [], []
	i = 0
	try:
		while True:
			item = [games[i].uid, games[i].get_date()]
			if games[i].is_ended():
				if games[i].winner and games[i].winner.user \
					and games[i].winner.user.username == username: # type: ignore
					won.append(item)
				else:
					lost.append(item)
			else:
				other.append(item)
			i += 1
	except IndexError:
		pass
	won_len, lost_len = len(won), len(lost)
	winrate = (float(won_len) / (won_len + lost_len) * 100) if i else 0
	winrate = f'{"0" if winrate < 10 else ""}{winrate:.8f}'
	return JsonResponse({
		'ok': True,
		'wonLength': won_len,
		'lostLength': lost_len,
		'total': i,
		'winrate': winrate,
		'won': won,
		'lost': lost,
		'other': other,
	})


@csrf_exempt
def view_game_new(request):
	if not (response := auth.is_authenticated(request)):
		return JsonResponse({'ok': False, 'error': 'errors.notLoggedIn'})

	if request.method != 'POST':
		return JsonResponse({'ok': False, 'error': 'errors.invalidMethod'})

	data = json.loads(request.body.decode(request.encoding or 'utf-8'))

	valid = 'mode' in data and data['mode'] in ["TO", "FT", "BR"] \
		and 'players' in data and isinstance(data['players'], int) and 2 <= data['players'] <= 30 \
		and 'theme' in data and isinstance(data['theme'], int) and 0 <= data['theme'] <= 3 \
		and 'speed' in data and isinstance(data['speed'], int) and 0 <= data['speed'] <= 2

	limit = None
	if valid and data['mode'] == "TO":
		valid = 'limitTO' in data and isinstance(data['limitTO'], int) and 2 <= data['limitTO'] <= 60
		limit = data['limitTO']
	if valid and data['mode'] == "FT":
		valid = 'limitFT' in data and isinstance(data['limitFT'], int) and 2 <= data['limitFT'] <= 50
		limit = data['limitFT']

	if not valid:
		return JsonResponse({'ok': False, 'error': 'errors.invalidRequest'})

	game = Game.objects.create(uid=Game.new_uid())

	pong_socket.game_server.createLobby(
		uid=game.uid,
		game_mode=data["mode"],
		player_num=data["players"],
		theme=data["theme"],
		ball_speed=data["speed"],
		limit=limit,
	)

	return JsonResponse({
		'ok': True,
		'success': 'successes.gameCreated',
		**game.json(),
	})


@csrf_exempt
def view_game_rand(request: HttpRequest):
	if not (response := auth.is_authenticated(request)):
		return JsonResponse({'ok': False, 'error': 'errors.notLoggedIn'})
	games = Game.objects.filter(started_at=None)
	waiting = []
	i = 0
	try:
		while True:
			json = games[i].json()
			if json['waiting']:
				waiting.append(json)
			i += 1
	except IndexError:
		pass
	if not waiting:
		return JsonResponse({
			'ok': True,
			'found': False,
		})
	game = random.choice(waiting)
	return JsonResponse({
		'ok': True,
		'found': True,
		**game,
	})


@csrf_exempt
def view_game_uid(request: HttpRequest, uid: str):
	game = Game.objects.filter(uid=uid)
	if not game:
		return JsonResponse({'ok': False, 'error': 'errors.gameNotFound'})
	game = game[0]
	return JsonResponse({
		'ok': True,
		**game.json(),
	})


@csrf_exempt
def view_stats_id(request: HttpRequest, id: int):
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
def view_stats_user(request: HttpRequest, username: str):
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
def view_stats_game(request: HttpRequest, uid: str):
	stats = Stats.objects.filter(game__uid=uid)
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
def view_tournament_get(request: HttpRequest):
	if tournament_manager.active_tounaments:
		return JsonResponse({
			'ok': True,
			'length': len(tournament_manager.active_tounaments),
			'tournaments': [t.json() for t in tournament_manager.active_tounaments],
		})
	return JsonResponse({'ok': True, 'length': 0, 'tournaments': []})


@csrf_exempt
def view_tournament_new(request: HttpRequest):
	if not (response := auth.is_authenticated(request)):
		return JsonResponse({'ok': False, 'error': 'errors.notLoggedIn'})

	if request.method != 'POST':
		return JsonResponse({'ok': False, 'error': 'errors.invalidMethod'})

	data = json.loads(request.body.decode(request.encoding or 'utf-8'))

	valid = 'players' in data and isinstance(data['players'], int) and 2 <= data['players'] <= 30

	if not valid:
		return JsonResponse({'ok': False, 'error': 'errors.invalidRequest'})

	tounament = tournament_manager.Tounament(Game.new_uid(), data['players'])
	tounament.register()

	return JsonResponse({'ok': True, 'success': 'successes.tournamentCreated', **tounament.json()})


@csrf_exempt
def view_tournament_tid(request: HttpRequest, tid: str):
	for t in tournament_manager.active_tounaments:
		if t.tid == tid:
			return JsonResponse({'ok': True, **t.json()})
	return JsonResponse({'ok': False, 'error': 'errors.tournamentNotFound'})


@csrf_exempt
def view_tournament_join(request: HttpRequest, tid: str, username: str):
	if not (response := auth.is_authenticated(request)):
		return JsonResponse({'ok': False, 'error': 'errors.notLoggedIn'})

	tounament = None
	for t in tournament_manager.active_tounaments:
		if t.tid == tid:
			tounament = t
			break
	if tounament is None:
		return JsonResponse({'ok': False, 'error': 'errors.tournamentNotFound'})

	if not (user := User.get(username)):
		return JsonResponse({'ok': False, 'error': 'errors.userNotFound'})

	if response.user != username and not (
			(client := User.objects.filter(username=response.user)) \
			and client.is_admin): # type: ignore
		return JsonResponse({'ok': False, 'error': 'errors.invalidRequest'})

	if tounament.status != tournament_manager.Status.PENDING:
		return JsonResponse({'ok': False, 'error': 'errors.tournamentAlreadyStarted'})

	return JsonResponse({'ok': True, 'success': 'successes.tournamentJoined'})


@csrf_exempt
def view_tournament_quit(request: HttpRequest, tid: str, username: str):
	if not (response := auth.is_authenticated(request)):
		return JsonResponse({'ok': False, 'error': 'errors.notLoggedIn'})

	tounament = None
	for t in tournament_manager.active_tounaments:
		if t.tid == tid:
			tounament = t
			break
	if tounament is None:
		return JsonResponse({'ok': False, 'error': 'errors.tournamentNotFound'})

	if not (user := User.get(username)):
		return JsonResponse({'ok': False, 'error': 'errors.userNotFound'})

	if response.user != username and not (
			(client := User.objects.filter(username=response.user)) \
			and client.is_admin): # type: ignore
		return JsonResponse({'ok': False, 'error': 'errors.invalidRequest'})

	if tounament.status != tournament_manager.Status.PENDING:
		return JsonResponse({'ok': False, 'error': 'errors.tournamentAlreadyStarted'})

	tounament.quit(user)

	return JsonResponse({'ok': True, 'success': 'successes.tournamentQuit'})




@csrf_exempt
def view_test(request: HttpRequest, whatever: int):
	if whatever == 0:

		if not tournament_manager.active_tounaments:
			t = tournament_manager.Tounament(Game.new_uid(), 10)
			t.register()

		t = tournament_manager.active_tounaments[0]

		users = User.objects.all()

		i = 0
		for u in users:
			if i >= 10:
				break
			t.add_player(u)
			i += 1


		a = User.objects.get(username='aaaa')
		t.pools[0].matches[0].winner = a
		t.pools[0].matches[0].status = tournament_manager.Status.FINISHED
		t.pools[1].matches[0].add_player(a)
		a = User.objects.get(username='6666')
		t.pools[0].matches[1].winner = a
		t.pools[0].matches[1].status = tournament_manager.Status.FINISHED
		t.pools[1].matches[0].add_player(a)
		t.current_pool += 1

		return JsonResponse({'ok': True, 'success': 'Whatever...'})

	def user(usrnm) -> User:
		res = auth.register(request,
			username=f'{usrnm}',
			first_name=f'{usrnm}',
			last_name=f'{usrnm}',
			email=f'{usrnm}@42.fr',
			password='1234',
			picture='https://media.senscritique.com/media/000019789638/300/doc.jpg')
		print(usrnm, res.ok, res.message, res.user)
		return res.user # type: ignore

	us: list[User] = [
		user('0000'),
		user('1111'),
		user('2222'),
		user('3333'),
		user('4444'),
		user('5555'),
		user('6666'),
		user('7777'),
		user('8888'),
		user('9999'),
		user('aaaa'),
		user('bbbb'),
	]

	Game.objects.create(uid=Game.new_uid(), players=[u.username for u in us])
	Game.objects.create(uid=Game.new_uid(), players=[u.username for u in us])
	Game.objects.create(uid=Game.new_uid(), players=[u.username for u in us])
	Game.objects.create(uid=Game.new_uid(), players=[u.username for u in us])

	g0 = Game.objects.create(uid=Game.new_uid(), players=[u.username for u in us])
	g1 = Game.objects.create(uid=Game.new_uid(), players=[u.username for u in us])
	g2 = Game.objects.create(uid=Game.new_uid(), players=[u.username for u in us])
	g3 = Game.objects.create(uid=Game.new_uid(), players=[u.username for u in us])

	gs: list[Game] = [g0, g1, g2, g3] # type: ignore

	def stats(g: Game, u: User, won: bool) -> Stats:
		return Stats.objects.create(
			user=u,
			game=g,
			score=random.randint(0, 100),
			kills=random.randint(0, 100),
			best_streak=random.randint(0, 50),
			rebounces=random.randint(0, 1000),
			ultimate=random.uniform(0, 16),
			duration=random.randint(0, 600),
			won=won,
		)

	s = [
		stats(g0, us[0], True),
		stats(g0, us[1], False),
		stats(g0, us[2], False),
		stats(g0, us[3], False),
		stats(g1, us[0], False),
		stats(g1, us[1], True),
		stats(g1, us[2], False),
		stats(g1, us[3], False),
		stats(g2, us[0], False),
		stats(g2, us[1], False),
		stats(g2, us[2], True),
		stats(g2, us[3], False),
		stats(g3, us[0], False),
		stats(g3, us[1], False),
		stats(g3, us[2], False),
		stats(g3, us[3], True),
	]

	g0.winner = s[0]
	g0.best_streak = s[0]
	g0.rebounces = s[1]
	g0.ultimate = s[2]
	g0.duration = s[3]
	g0.save()

	g1.winner = s[5]
	g1.best_streak = s[4]
	g1.rebounces = s[5]
	g1.ultimate = s[6]
	g1.duration = s[7]
	g1.save()

	g2.winner = s[10]
	g2.best_streak = s[8]
	g2.rebounces = s[9]
	g2.ultimate = s[10]
	g2.duration = s[11]
	g2.save()

	g3.winner = s[15]
	g3.best_streak = s[12]
	g3.rebounces = s[13]
	g3.ultimate = s[14]
	g3.duration = s[15]
	g3.save()

	t = tournament_manager.Tounament(Game.new_uid(), len(us))
	t.register()

	s = request.headers.get('Authorization', None)

	return JsonResponse({
		'ok': True,
		'success': 'Whatever...',
		'whatever': whatever,
		'str': s,
		'tounament': t.json(),
	})
