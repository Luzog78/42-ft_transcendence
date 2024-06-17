from django.urls import path, re_path
from .views import view_err404, view_root, view_login, view_logout, \
					view_register, view_user, view_game, view_games, \
					view_stats_id, view_stats_user, view_stats_game, view_test


urlpatterns = [ re_path('.*', view_err404) ]

def r(v, p): urlpatterns.insert(0, path(p, v, name='api-' + v.__name__))


r(view_root,		'')
r(view_login,		'login')
r(view_logout,		'logout')
r(view_register,	'register')
r(view_user,		'user')
r(view_user,		'user/<str:username>')
r(view_games,		'games')
r(view_game,		'game/<str:uid>')
r(view_stats_id,	'stats/<int:id>')
r(view_stats_user,	'stats/u/<str:username>')
r(view_stats_game,	'stats/g/<str:uid>')
r(view_test,		'<int:whatever>')

