import json
from django.http import JsonResponse, HttpRequest
from django.views.decorators.csrf import csrf_exempt

from api_app import auth
from api_app.models import GameMode, User, Game
from ft_django import pong_socket
from ft_django.tic_tac_toe import TTTLobby


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

	valid = 'mode' in data and data['mode'] in GameMode.get_mods() \
		and 'players' in data and isinstance(data['players'], int) and 2 <= data['players'] <= 30 \
		and 'theme' in data and isinstance(data['theme'], int) and 0 <= data['theme'] <= 3 \
		and 'speed' in data and isinstance(data['speed'], int) and 0 <= data['speed'] <= 2

	limit = None
	if valid and GameMode.equals(data['mode'], GameMode.TIME_OUT):
		valid = 'limitTO' in data and isinstance(data['limitTO'], int) and 60 <= data['limitTO'] <= 3600
		limit = data['limitTO']
	if valid and GameMode.equals(data['mode'], GameMode.FIRST_TO):
		valid = 'limitFT' in data and isinstance(data['limitFT'], int) and 1 <= data['limitFT'] <= 100
		limit = data['limitFT']
	if valid and GameMode.equals(data['mode'], GameMode.TIC_TAC_TOE):
		valid = 'limitTC' in data and isinstance(data['limitTC'], int)
		limit = data['limitTC']

	if not valid:
		return JsonResponse({'ok': False, 'error': 'errors.invalidRequest'})

	game = Game.objects.create(uid=Game.new_uid(), mode=data['mode'])

	if GameMode.equals(data['mode'], GameMode.TIC_TAC_TOE):
		assert isinstance(limit, int)
		ttt_lobby = TTTLobby.get_lobby_by_game(game, limit=limit, create=True)
		if ttt_lobby is None:
			return JsonResponse({'ok': False, 'error': 'errors.noGameFound'})

	else:
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
	user = User.objects.get(username=response.user)

	games = Game.objects.filter(started_at=None)
	waiting = []
	i = 0
	try:
		while True:
			json = games[i].json()
			if json['waiting']:
				average_level = 0
				for player in json['players']:
					average_level += User.objects.get(username=player).ratio
				if len(json['players']):
					average_level /= len(json['players'])
				else:
					average_level = 0.5
				waiting.append((json, average_level))
			i += 1
	except IndexError:
		pass
	if not waiting:
		return JsonResponse({
			'ok': True,
			'found': False,
		})

	user_ratio = user.ratio
	game = waiting[0]
	for json, ratio in waiting[1:]:
		if abs(user_ratio - ratio) < abs(user_ratio - game[1]):
			game = (json, ratio)
	return JsonResponse({
		'ok': True,
		'found': True,
		**game[0],
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
