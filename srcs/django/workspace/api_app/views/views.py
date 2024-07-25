import json
import random
import asyncio
from django.http import HttpResponse, JsonResponse, HttpRequest
from django.views.decorators.csrf import csrf_exempt

from api_app import auth
from api_app.models import Ressources, User, Game, Stats, Tournament
from ft_django.tic_tac_toe import TTTLobby
from ft_django import pong_socket


endpoints: list[str] = []


@csrf_exempt
def view_err404(request: HttpRequest):
	return JsonResponse({'ok': False, 'error': 'errors.404'})


@csrf_exempt
def view_root(request: HttpRequest):
	return JsonResponse({
		'ok': True,
		'api': 'v1',
		'endpoints': endpoints,
		'errors': [
			'errors.404',
			'errors.a2fBadLength',
			'errors.alreadyJoined',
			'errors.cannotCreateGameOf',
			'errors.chatNotConnected',
			'errors.couldNotLogout',
			'errors.editPasswordOAuth',
			'errors.emailAlreadyUsed',
			'errors.firstNameTooLong',
			'errors.firstNameTooShort',
			'errors.gameNotFound',
			'errors.invalidCredentials',
			'errors.invalidEmail',
			'errors.invalidFirstName',
			'errors.invalidLang',
			'errors.invalidLastName',
			'errors.invalidMethod',
			'errors.invalidPassword',
			'errors.invalidPictureType',
			'errors.invalidRequest',
			'errors.invalidToken',
			'errors.invalidUID',
			'errors.invalidUsername',
			'errors.lastNameTooLong',
			'errors.lastNameTooShort',
			'errors.MessageTooLong',
			'errors.missingA2F',
			'errors.missingAuthorization',
			'errors.missingRequestInformations',
			'errors.mustBeLoggedIn',
			'errors.noGameFound',
			'errors.notAuthenticated',
			'errors.notJoined',
			'errors.notLoggedIn',
			'errors.oauthGrantExpired',
			'errors.oauthInvalidServerAccess',
			'errors.oauthUnexpectedApiError',
			'errors.oauthApiUnreachable',
			'errors.passwordMismatch',
			'errors.passwordTooShort',
			'errors.pictureTooBig',
			'errors.ressourceNotFound',
			'errors.selectBallSpeed',
			'errors.selectGameMode',
			'errors.selectPlayers',
			'errors.selectPoints',
			'errors.selectTheme',
			'errors.sessionExpired',
			'errors.statsNotFound',
			'errors.toggleA2FOauth',
			'errors.tournamentAlreadyStarted',
			'errors.tournamentNotFound',
			'errors.usernameAlreadyUsed',
			'errors.usernameIllegal',
			'errors.usernameTooLong',
			'errors.usernameTooShort',
			'errors.userNotFound',
			'errors.UserNotFound',
			'errors.AlreadyFriend',
			'errors.FriendRequestSent',
			'errors.FriendRequestYourself',
			'errors.RelationDoesNotExist',
			'errors.AlreadyBlocked',
			'errors.NotImplementedYet',
			'errors.oauthMissingCredentials',
			'errors.alreadyConnectedLobby',
		],
		'successes': [
			'successes.a2fDisabled',
			'successes.a2fDisabled',
			'successes.a2fEnabled',
			'successes.a2fEnabled',
			'successes.emailSet',
			'successes.emailSet',
			'successes.firstNameSet',
			'successes.firstNameSet',
			'successes.gameCreated',
			'successes.langSet',
			'successes.langSet',
			'successes.lastNameSet',
			'successes.lastNameSet',
			'successes.loggedIn',
			'successes.loggedIn',
			'successes.loggedOut',
			'successes.passwordSet',
			'successes.passwordSet',
			'successes.pictureSet',
			'successes.registered',
			'successes.registered',
			'successes.tournamentCreated',
			'successes.tournamentJoined',
			'successes.tournamentQuit',
			'successes.acceptedFriendRequest',
			'successes.FriendRequestSent',
			'successes.cancelFriendRequest',
		],
	})


@csrf_exempt
def view_ressource(request: HttpRequest, name: str):
	r = Ressources.objects.filter(name=name)
	if not r:
		return JsonResponse({'ok': False, 'error': 'errors.ressourceNotFound'})
	r = r[0]

	if 'raw' in request.GET and request.GET['raw'].lower() not in ['false', 'f', 'no', 'n', '0']:
		return HttpResponse(r.data, content_type=f'{r.type}; charset=utf8')
	return JsonResponse({'ok': True, **r.json()})


@csrf_exempt
def view_pong(request: HttpRequest):
	if not (response := auth.is_authenticated(request)):
		return JsonResponse({'ok': False, 'error': 'errors.notLoggedIn'})

	socket = None
	for s in pong_socket.game_server.clients:
		if s.client.username == response.user:
			socket = s.client
			break

	if request.method == 'POST':
		data = json.loads(request.body.decode(request.encoding or 'utf-8'))

		print(json.dumps(data))

		if not socket:
			socket = pong_socket.PongSocket(online=False)

		asyncio.run(pong_socket.game_server.receive(data, socket))

	else:
		if not socket:
			return JsonResponse({'ok': False, 'error': 'errors.notJoined'})

		return JsonResponse({'ok': True, "buffer": socket.buffer})

	return JsonResponse({'ok': True, 'pong': 'pong'})


@csrf_exempt
def view_ttt(request: HttpRequest, uid: str):
	if not (response := auth.is_authenticated(request)):
		return JsonResponse({'ok': False, 'error': 'errors.notLoggedIn'})

	if request.method == 'POST':
		return JsonResponse({'ok': False, 'error': 'errors.invalidMethod'})

	if not (user := User.get(response.user)):
		return JsonResponse({'ok': False, 'error': 'errors.userNotFound'})

	game = Game.objects.filter(uid=uid)
	if not game:
		return JsonResponse({'ok': False, 'error': 'errors.gameNotFound'})
	game = game[0]

	if game.is_ended():
		winner = game.winner.user.username if game.winner and game.winner.user else None
		players = game.players
		idx = players.index(winner) + 1 if winner in players else 0
		return JsonResponse({'ok': True,
			'end': True,
			'winner': f'user{idx}',
			'game': game.json(),
		})

	ttt_lobby = TTTLobby.get_lobby_by_game(game)
	if not ttt_lobby:
		return JsonResponse({'ok': False})

	if not ttt_lobby.is_present(user):
		if not ttt_lobby.join(user):
			return JsonResponse({'ok': False, 'error': 'errors.notInGame'})

	slot = None
	if 'slot' in request.GET:
		slot = request.GET['slot']
		if slot not in '012345678':
			return JsonResponse({'ok': False})

		try:
			slot = int(slot)
		except ValueError:
			return JsonResponse({'ok': False})

	if slot == -1:
		ttt_lobby.leave(user)
	elif slot is not None:
		ttt_lobby.play(user, slot)

	return JsonResponse({'ok': True, 'game': game.json(), 'lobby': ttt_lobby.json()})


@csrf_exempt
def view_test(request: HttpRequest, whatever: int):
	if whatever == 0:

		for _ in range(50):
			Tournament.objects.create(tid=Tournament.new_uid(), player_count=random.randint(2, 30)).init()

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

	# t = tournament_manager.Tournament(Game.new_uid(), len(us))
	# t.register()

	s = request.headers.get('Authorization', None)

	return JsonResponse({
		'ok': True,
		'success': 'Whatever...',
		'whatever': whatever,
		'str': s,
		# 'tournament': t.json(),
	})
