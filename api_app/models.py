import random
from django.contrib.postgres.fields import ArrayField
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager
from django.db import models


class UserManager(BaseUserManager):
	def create_user(self, username, email, password, first_name, last_name, **extra_fields):
		if not username:
			raise ValueError('Users must have a username')
		if not email:
			raise ValueError('Users must have an email address')

		user = self.model(
			username=username,
			email=self.normalize_email(email),
			first_name=first_name,
			last_name=last_name,
			**extra_fields
		)

		user.set_password(password)
		user.save(using=self._db)
		return user

	def create_superuser(self, username, email, password, first_name, last_name, **extra_fields):
		user = self.create_user(
			username=username,
			email=email,
			password=password,
			first_name=first_name,
			last_name=last_name,
			**extra_fields
		)
		user.is_admin = True
		user.save(using=self._db)
		return user


class User(AbstractBaseUser):
	username	= models.CharField(primary_key=True, max_length=24)
	created_at	= models.DateTimeField(auto_now=True, blank=False)
	email		= models.CharField(max_length=255, unique=True)
	password	= models.CharField(max_length=255)
	first_name	= models.CharField(max_length=24)
	last_name	= models.CharField(max_length=24)
	lang		= models.CharField(max_length=2, default='en')
	picture		= models.CharField(max_length=1024, null=True, default=None)
	a2f_token	= models.CharField(max_length=32, null=True, default=None)
	is_admin	= models.BooleanField(default=False)

	objects = UserManager()

	USERNAME_FIELD = 'username'
	REQUIRED_FIELDS = ['email', 'first_name', 'last_name']

	def __str__(self):
		return self.username

	def has_perm(self, perm, obj=None):
		return self.is_admin

	def has_module_perms(self, app_label):
		return self.is_admin

	@staticmethod
	def get(username=None, **kwargs):
		try:
			kw = {'username': username, **kwargs} if username is not None else kwargs
			return User.objects.get(**kw)
		except User.DoesNotExist:
			return None

	def json(self, show_email=False):
		return {
			'username': self.username,
			'createdAt': self.created_at,
			'email': self.email if show_email else None,
			'firstName': self.first_name,
			'lastName': self.last_name,
			'picture': self.picture,
			'lang': self.lang,
			'a2f': self.a2f_token is not None,
			'isAdmin': self.is_admin,
			'lastLogin': self.last_login,
		}


class GameMode(models.TextChoices):
	TIME_OUT		= 'TO', 'Time Out'
	FIRST_TO		= 'FT', 'First To'
	BATTLE_ROYALE	= 'BR', 'Battle Royale'

	@staticmethod
	def items():
		return GameMode.TIME_OUT, GameMode.FIRST_TO, GameMode.BATTLE_ROYALE

	@staticmethod
	def mods():
		return GameMode.TIME_OUT[0], GameMode.FIRST_TO[0], GameMode.BATTLE_ROYALE[0]

	@staticmethod
	def names():
		return GameMode.TIME_OUT[1], GameMode.FIRST_TO[1], GameMode.BATTLE_ROYALE[1]


class Game(models.Model):
	uid			= models.CharField(primary_key=True, max_length=5, blank=False, null=False)
	mode		= models.CharField(max_length=2, choices=GameMode.choices, default=GameMode.BATTLE_ROYALE)
	players		= ArrayField(models.CharField(max_length=24), default=list)
	restricted	= models.BooleanField(default=False)
	created_at	= models.DateTimeField(auto_now=True, blank=False)
	started_at	= models.DateTimeField(auto_now=False, blank=True, null=True, default=None)
	ended_at	= models.DateTimeField(auto_now=False, blank=True, null=True, default=None)
	winner:			'Stats'	= models.ForeignKey('Stats', related_name='+', on_delete=models.SET_NULL, null=True, default=None) # type: ignore
	best_streak:	'Stats'	= models.ForeignKey('Stats', related_name='+', on_delete=models.SET_NULL, null=True, default=None) # type: ignore
	rebounces:		'Stats'	= models.ForeignKey('Stats', related_name='+', on_delete=models.SET_NULL, null=True, default=None) # type: ignore
	ultimate:		'Stats'	= models.ForeignKey('Stats', related_name='+', on_delete=models.SET_NULL, null=True, default=None) # type: ignore
	duration:		'Stats'	= models.ForeignKey('Stats', related_name='+', on_delete=models.SET_NULL, null=True, default=None) # type: ignore

	@staticmethod
	def new_uid() -> str:
		charset1 = 'abcdefghijklmnopqrstuvwxyz'
		charset2 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
		max_tries = len(set(charset1)) ** 2 * len(set(charset2)) ** 3
		while max_tries:
			uid = ''.join(random.choices(charset1, k=2) + random.choices(charset2, k=3))
			if not Game.objects.filter(uid=uid).exists():
				return uid
			max_tries -= 1
		return None # type: ignore

	def __str__(self):
		return self.uid

	def is_ended(self) -> bool:
		return self.ended_at is not None or self.winner is not None

	def is_playing(self) -> bool:
		return self.started_at is not None and not self.is_ended()

	def is_waiting(self) -> bool:
		return not self.is_playing() and not self.is_ended()

	def get_date(self):
		return self.created_at if self.is_waiting() else self.started_at if self.is_playing() else self.ended_at

	def json(self, json_stats=True):
		winner = (self.winner.json(json_user=True, json_game=False) if json_stats else {'id': self.winner.id}) if self.winner is not None else None
		best_streak = (self.best_streak.json(json_user=True, json_game=False) if json_stats else {'id': self.best_streak.id}) if self.best_streak is not None else None
		rebounces = (self.rebounces.json(json_user=True, json_game=False) if json_stats else {'id': self.rebounces.id}) if self.rebounces is not None else None
		ultimate = (self.ultimate.json(json_user=True, json_game=False) if json_stats else {'id': self.ultimate.id}) if self.ultimate is not None else None
		duration = (self.duration.json(json_user=True, json_game=False) if json_stats else {'id': self.duration.id}) if self.duration is not None else None
		return {
			'uid': self.uid,
			'mode': self.mode,
			'players': self.players,
			'restricted': self.restricted,
			'createdAt': self.created_at,
			'startedAt': self.started_at,
			'endedAt': self.ended_at,
			'winner': winner,
			'bestStreak': best_streak,
			'rebounces': rebounces,
			'ultimate': ultimate,
			'duration': duration,

			'date': self.get_date(),
			'ended': self.is_ended(),
			'playing': self.is_playing(),
			'waiting': self.is_waiting(),
		}


class Stats(models.Model):
	id			= models.AutoField(primary_key=True)
	user		= models.ForeignKey(User, on_delete=models.CASCADE)
	game		= models.ForeignKey(Game, on_delete=models.SET_NULL, null=True)
	score		= models.IntegerField()
	kills		= models.IntegerField()
	best_streak	= models.IntegerField()
	rebounces	= models.IntegerField()
	ultimate	= models.FloatField()
	duration	= models.FloatField()
	won			= models.BooleanField()

	def __str__(self):
		return self.id

	def json(self, json_user=True, json_game=True):
		user = (self.user.json() if json_user else {'username': self.user.username}) if self.user is not None else None
		game = (self.game.json() if json_game else {'uid': str(self.game)}) if self.game is not None else None # type: ignore
		return {
			'id': self.id,
			'user': user,
			'game': game,
			'score': self.score,
			'kills': self.kills,
			'bestStreak': self.best_streak,
			'rebounces': self.rebounces,
			'ultimate': self.ultimate,
			'duration': self.duration,
			'won': self.won,
		}

class PrivateChat(models.Model):
	id			= models.AutoField(primary_key=True)
	send_at		= models.DateTimeField(auto_now=True)
	author		= models.ForeignKey(User, related_name='+', on_delete=models.SET_NULL, null=True)
	target		= models.ForeignKey(User, related_name='+', on_delete=models.SET_NULL, null=True)
	content		= models.CharField(max_length=2048)

	def __str__(self):
		return self.id

	def json(self, json_users=True):
		author = (self.author.json() if json_users else {'username': self.author.username}) if self.author is not None else None
		target = (self.target.json() if json_users else {'username': self.target.username}) if self.target is not None else None
		return {
			'id': self.id,
			'send_at': self.send_at,
			'author': author,
			'target': target,
			'content': self.content
		}

class GameChat(models.Model):
	id			= models.AutoField(primary_key=True)
	send_at		= models.DateTimeField(auto_now=True)
	author		= models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
	game		= models.ForeignKey(Game, on_delete=models.CASCADE)
	content		= models.CharField(max_length=2048)

	def __str__(self):
		return self.id

	def json(self, json_user=True, json_game=True):
		author = (self.author.json() if json_user else {'username': self.author.username}) if self.author is not None else None
		game = (self.game.json() if json_game else {'uid': str(self.game)}) if self.game is not None else None

		return {
			'id': self.id,
			'send_at': self.send_at,
			'author': author,
			'game': game,
			'content': self.content
		}


class Tounament(models.Model):
	tid			= models.CharField(primary_key=True, max_length=5, blank=False, null=False)
	content		= models.JSONField(default=dict)
	ended		= models.BooleanField(default=False)

	def __str__(self):
		return self.tid

	def json(self):
		return {
			'tid': self.tid,
			'content': self.content,
			'ended': self.ended
	}
