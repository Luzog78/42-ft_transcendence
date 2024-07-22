from django.http import JsonResponse, HttpRequest
from django.views.decorators.csrf import csrf_exempt

from api_app.models import Stats


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
	stats = Stats.objects.filter(user__username=username)
	l = [s.json() for s in stats]
	return JsonResponse({
		'ok': True,
		'length': len(l),
		'stats': l
	})


@csrf_exempt
def view_stats_game(request: HttpRequest, uid: str):
	stats = Stats.objects.filter(game__uid=uid)
	l = [s.json() for s in stats]
	return JsonResponse({
		'ok': True,
		'length': len(l),
		'stats': l,
	})
