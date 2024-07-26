import json
from django.http import JsonResponse, HttpRequest
from django.views.decorators.csrf import csrf_exempt

from api_app import auth
from api_app.models import GameMode, User, Status, Tournament


@csrf_exempt
def view_tournament_get(request: HttpRequest):
	tournaments = Tournament.objects.all();
	return JsonResponse({
		'ok': True,
		'length': len(tournaments),
		'tournaments': [[t.tid, t.created_at] for t in tournaments],
	})


@csrf_exempt
def view_tournament_new(request: HttpRequest):
	if not (response := auth.is_authenticated(request)):
		return JsonResponse({'ok': False, 'error': 'errors.notLoggedIn'})

	if request.method != 'POST':
		return JsonResponse({'ok': False, 'error': 'errors.invalidMethod'})

	data = json.loads(request.body.decode(request.encoding or 'utf-8'))

	valid = 'players' in data and isinstance(data['players'], int) and 2 <= data['players'] <= 1000 \
		and 'mode' in data and (GameMode.equals(data['mode'], GameMode.BATTLE_ROYALE) \
			or GameMode.equals(data['mode'], GameMode.TIC_TAC_TOE))

	if valid:
		i = 0
		if GameMode.equals(data['mode'], GameMode.TIC_TAC_TOE):
			valid, i = Tournament.is_legit(data['players'], min_players=2, max_players=2)
		else:
			valid, i = Tournament.is_legit(data['players'])
		if not valid:
			return JsonResponse({'ok': False, 'error': 'errors.cannotCreateGameOf', 'args': [ i ]})
	else:
		return JsonResponse({'ok': False, 'error': 'errors.invalidRequest'})

	tournament = Tournament.objects.create(tid=Tournament.new_uid(), mode=data['mode'], player_count=data['players']).init()
	return JsonResponse({'ok': True, 'success': 'successes.tournamentCreated', **tournament.json()})


@csrf_exempt
def view_tournament_lst(request: HttpRequest):
	if not (response := auth.is_authenticated(request)):
		return JsonResponse({'ok': False, 'error': 'errors.notLoggedIn'})

	if request.method != 'POST':
		return JsonResponse({'ok': False, 'error': 'errors.invalidMethod'})

	data = json.loads(request.body.decode(request.encoding or 'utf-8'))

	valid = 'tids' in data and isinstance(data['tids'], list)

	if 'details' in data:
		valid = valid and isinstance(data['details'], bool)
	else:
		data['details'] = False

	if not valid:
		return JsonResponse({'ok': False, 'error': 'errors.invalidRequest'})

	tids = data['tids']
	found = []
	not_found = []
	for tid in tids:
		t = Tournament.objects.filter(tid=tid)
		if not t:
			not_found.append(tid)
			continue
		found.append(t[0].json(data['details']))

	return JsonResponse({
		'ok': True,
		'details': data['details'],
		'foundLength': len(found),
		'notFoundLength': len(not_found),
		'found': found,
		'notFound': not_found
	})


@csrf_exempt
def view_tournament_tid(request: HttpRequest, tid: str):
	t = Tournament.objects.filter(tid=tid)
	if t:
		return JsonResponse({'ok': True, **t[0].json()})
	return JsonResponse({'ok': False, 'error': 'errors.tournamentNotFound'})


@csrf_exempt
def view_tournament_join(request: HttpRequest, tid: str, username: str):
	if not (response := auth.is_authenticated(request)):
		return JsonResponse({'ok': False, 'error': 'errors.notLoggedIn'})

	tournament = Tournament.objects.filter(tid=tid)
	if not tournament:
		return JsonResponse({'ok': False, 'error': 'errors.tournamentNotFound'})
	tournament = tournament[0]

	if not (user := User.get(username)):
		return JsonResponse({'ok': False, 'error': 'errors.userNotFound'})

	if response.user != username and not (
			(client := User.objects.filter(username=response.user)) \
			and client.is_admin): # type: ignore
		return JsonResponse({'ok': False, 'error': 'errors.invalidRequest'})

	if tournament.status != Status.PENDING:
		return JsonResponse({'ok': False, 'error': 'errors.tournamentAlreadyStarted'})

	if username in tournament.players:
		return JsonResponse({'ok': False, 'error': 'errors.alreadyJoined'})

	tournament.add_player(user.username)
	return JsonResponse({'ok': True, 'success': 'successes.tournamentJoined'})


@csrf_exempt
def view_tournament_quit(request: HttpRequest, tid: str, username: str):
	if not (response := auth.is_authenticated(request)):
		return JsonResponse({'ok': False, 'error': 'errors.notLoggedIn'})

	tournament = Tournament.objects.filter(tid=tid)
	if not tournament:
		return JsonResponse({'ok': False, 'error': 'errors.tournamentNotFound'})
	tournament = tournament[0]

	if not (user := User.get(username)):
		return JsonResponse({'ok': False, 'error': 'errors.userNotFound'})

	if response.user != username and not (
			(client := User.objects.filter(username=response.user)) \
			and client.is_admin): # type: ignore
		return JsonResponse({'ok': False, 'error': 'errors.invalidRequest'})

	if tournament.status != Status.PENDING:
		return JsonResponse({'ok': False, 'error': 'errors.tournamentAlreadyStarted'})

	if username not in tournament.players:
		return JsonResponse({'ok': False, 'error': 'errors.notJoined'})

	tournament.quit(user.username)
	return JsonResponse({'ok': True, 'success': 'successes.tournamentQuit'})
