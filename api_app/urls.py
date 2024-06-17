from django.urls import path, re_path
from .views import view_err404, view_test, \
					view_root, view_login, view_logout, view_register, \
					view_user, \
					view_games, view_game_list, view_game_user, view_game_uid, \
					view_game_new, view_game_rand, \
					view_stats_id, view_stats_user, view_stats_game


urlpatterns = [ re_path('.*', view_err404) ]

def r(v, p): urlpatterns.insert(0, path(p, v, name='api-' + v.__name__))


r(view_root,		'')
r(view_login,		'login')
r(view_logout,		'logout')
r(view_register,	'register')
r(view_user,		'user')
r(view_user,		'user/<str:username>')
r(view_games,		'games')
r(view_game_list,	'game/l')
r(view_game_user,	'game/u/<str:username>')
r(view_game_uid,	'game/g/<str:uid>')
r(view_game_new,	'game/new')
r(view_game_rand,	'game/rand')
r(view_stats_id,	'stats/<int:id>')
r(view_stats_user,	'stats/u/<str:username>')
r(view_stats_game,	'stats/g/<str:uid>')
r(view_test,		'<int:whatever>')

