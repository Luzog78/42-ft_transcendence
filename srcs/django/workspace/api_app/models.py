import random
from django.contrib.postgres.fields import ArrayField
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager
from django.db import models
import asyncio


class Usernames(models.Model):
	'''
	Required fields:
		username: str
	'''

	username	= models.CharField(primary_key=True, max_length=24)

	def __str__(self):
		return self.username


class UserManager(BaseUserManager):
	def create_user(self, username, email, password, first_name, last_name, **extra_fields):
		if not username:
			raise ValueError('Users must have a username')
		if not email:
			raise ValueError('Users must have an email address')

		Usernames.objects.create(username=username).save()

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
		if not username:
			raise ValueError('Users must have a username')
		if not email:
			raise ValueError('Users must have an email address')

		Usernames.objects.create(username=username).save()

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
	'''
	Required fields:
		username: str
		created_at: datetime
		email: str
		password: str
		first_name: str
		last_name: str

	Auto fields:
		create_at: datetime
		last_login: datetime

	Additionnal fields:
		active: bool
		lang: str
		picture: str
		ratio: float
		a2f_token: str
		is_admin: bool
	'''

	username	= models.CharField(primary_key=True, max_length=24)
	active		= models.BooleanField(default=True)
	created_at	= models.DateTimeField(auto_now=True, blank=False)
	email		= models.CharField(max_length=255, unique=True)
	password	= models.CharField(max_length=255, null=True)
	first_name	= models.CharField(max_length=24)
	last_name	= models.CharField(max_length=24)
	picture		= models.CharField(max_length=1024, null=True, default=None)
	lang		= models.CharField(max_length=2, default='en')
	ratio		= models.FloatField(default=0.5)
	a2f_token	= models.CharField(max_length=32, null=True, default=None)
	is_admin	= models.BooleanField(default=False)
	login_42	= models.CharField(max_length=24, null=True, default=None)

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
			'ratio': self.ratio,
			'a2f': self.a2f_token is not None,
			'isAdmin': self.is_admin,
			'lastLogin': self.last_login,
			'isOauth': self.login_42 is not None,
		}


class GameMode(models.TextChoices):
	TIME_OUT		= 'TO', 'Time Out'
	FIRST_TO		= 'FT', 'First To'
	BATTLE_ROYALE	= 'BR', 'Battle Royale'

	@staticmethod
	def get_items():
		return [('TO', 'Time Out'), ('FT', 'First To'), ('BR', 'Battle Royale')]

	@staticmethod
	def get_mods():
		return ['TO', 'FT', 'BR']

	@staticmethod
	def get_names():
		return ['Time Out', 'First To', 'Battle Royale']

	@staticmethod
	def parse(mode):
		mode = mode.upper()
		for k, v in GameMode.get_items():
			if mode == k or mode == v:
				return k, v
		return None


class Game(models.Model):
	'''
	Required fields:
		uid: str

	Auto fields:
		created_at: datetime

	Additionnal fields:
		mode: str
		players: list[str]
		restricted: bool
		started_at: datetime
		ended_at: datetime
		winner: Stats
		best_streak: Stats
		rebounces: Stats
		ultimate: Stats
		duration: Stats
	'''

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
	'''
	Required fields:
		user: User
		game: Game
		score: int
		kills: int
		best_streak: int
		rebounces: int
		ultimate: float
		duration: float
		won: bool

	Auto fields:
		id: int
	'''

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
	'''
	Required fields:
		author: User
		target: User
		content: str

	Auto fields:
		id: int
		send_at: datetime
	'''

	id			= models.AutoField(primary_key=True)
	send_at		= models.DateTimeField(auto_now=True)
	author		= models.ForeignKey(User, related_name='+', on_delete=models.SET_NULL, null=True)
	target		= models.ForeignKey(User, related_name='+', on_delete=models.SET_NULL, null=True)
	content		= models.CharField(max_length=2048)

	def __str__(self):
		return self.id

	def json(self, json_users=True):
		author = (self.author.json() if json_users else self.author.username) if self.author is not None else None
		target = (self.target.json() if json_users else self.target.username) if self.target is not None else None
		return {
			'id': self.id,
			'send_at': self.send_at,
			'author': author,
			'target': target,
			'content': self.content
		}


class GameChat(models.Model):
	'''
	Required fields:
		author: User
		game: Game
		content: str

	Auto fields:
		id: int
		send_at: datetime
	'''

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


class Status(models.TextChoices):
	PENDING		= 'P', 'Pending'
	ONGOING		= 'O', 'Ongoing'
	FINISHED	= 'F', 'Finished'

	@staticmethod
	def get_items():
		return [('P', 'Pending'), ('O', 'Ongoing'), ('F', 'Finished')]

	@staticmethod
	def get_mods():
		return ['P', 'O', 'F']

	@staticmethod
	def get_names():
		return ['Pending', 'Ongoing', 'Finished']

	@staticmethod
	def parse(status):
		status = status.upper()
		for k, v in Status.get_items():
			if status == k or status == v:
				return k, v
		return None


# import traceback # todo remove
class Match(models.Model):
	'''
	Required fields:
		player_count: int

	Auto fields:
		id: int

	Additionnal fields:
		players: list[str]
		winner: User
		status: str
		uid: str
		game: Game
	'''

	id				= models.AutoField(primary_key=True)
	player_count	= models.IntegerField()
	players			= ArrayField(models.CharField(max_length=24), default=list)
	winner			= models.ForeignKey(User, on_delete=models.SET_NULL, null=True) # type: ignore
	status			= models.CharField(max_length=1, choices=Status.choices, default=Status.PENDING)
	game			= models.ForeignKey(Game, on_delete=models.SET_NULL, null=True) # type: ignore

	def __str__(self):
		return self.id

	def json(self):
		return {
			'id': self.id,
			'playerCount': self.player_count,
			'players': self.players,
			'winner': self.winner.username if self.winner is not None else None,
			'status': self.status,
			'game': self.game.uid if self.game is not None else None,

			'ended': self.status == Status.FINISHED,
		}

	def add_player(self, player_username: str):
		# for line in traceback.format_stack(): # todo remove
		# 	print(line.strip())
		# print("add player", player_username)
		self.players.append(player_username)
		if len(self.players) == self.player_count:
			self.start()
		else:
			self.save()

	def start(self):
		from ft_django.chat_socket import find_user_socket # circular import fix
		self.status = Status.ONGOING
		self.game = Game.objects.create(
			uid=Game.new_uid(),
			mode=GameMode.BATTLE_ROYALE,
			players=self.players,
			restricted=True,
		)
		self.save()
		for player in self.players:
			sockets = find_user_socket(player)
			for socket in sockets:
				asyncio.run(socket.sendJson({'type': 'tournamentMatchStart', 'gameUid': self.game.uid}))

	def end(self):
		assert self.game is not None
		self.winner = self.game.winner.user
		self.status = Status.FINISHED
		self.save()


class Pool(models.Model):
	'''
	Required fields:
		matches_count: int
		player_per_match: int

	Auto fields:
		id: int
		matches: list[Match]  ->> In the manager

	Additionnal fields:
		status: str
	'''

	id					= models.AutoField(primary_key=True)
	matches_count		= models.IntegerField()
	player_per_match	= models.IntegerField()
	matches				= ArrayField(models.CharField(max_length=24), default=list)
	status				= models.CharField(max_length=1, choices=Status.choices, default=Status.PENDING)

	def __str__(self):
		return self.id

	def json(self, json_matches=True):
		matches: list = [] if json_matches else self.matches
		if json_matches:
			for match in self.matches:
				m = Match.objects.get(id=match)
				if m:
					matches.append(m.json())
		return {
			'id': self.id,
			'matchesCount': self.matches_count,
			'playerPerMatch': self.player_per_match,
			'matches': matches,
			'status': self.status,

			'ended': self.status == Status.FINISHED,
		}

	def init(self):
		self.save()
		self.matches = []
		for _ in range(self.matches_count):
			match = Match.objects.create(player_count=self.player_per_match)
			self.matches.append(match.id)
		self.save()
		return self

	def get_match(self, index: int):
		return Match.objects.get(id=self.matches[index])

	def try_to_end(self):
		if all(self.get_match(i).status == Status.FINISHED for i in range(len(self.matches))):
			self.status = Status.FINISHED
			self.save()

	def get_winners(self):
		return [self.get_match(i).winner for i in range(len(self.matches))]



class Tournament(models.Model):
	'''
	Required fields:
		tid: str
		player_count: int

	Auto fields:
		created_at: datetime
		pools: list[int]  ->> In the manager

	Additionnal fields:
		players: list[str]
		current_pool: int
		status: str
	'''

	tid				= models.CharField(primary_key=True, max_length=5, blank=False, null=False)
	created_at		= models.DateTimeField(auto_now=True, blank=False)
	player_count	= models.IntegerField()
	players			= ArrayField(models.CharField(max_length=24), default=list)
	pools			= ArrayField(models.IntegerField(), default=list)
	current_pool	= models.IntegerField(default=0)
	status			= models.CharField(max_length=1, choices=Status.choices, default=Status.PENDING)

	@staticmethod
	def new_uid() -> str:
		charset1 = 'abcdefghijklmnopqrstuvwxyz'
		charset2 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
		max_tries = len(set(charset1)) ** 2 * len(set(charset2)) ** 3
		while max_tries:
			uid = ''.join(random.choices(charset1, k=2) + random.choices(charset2, k=3))
			if not Tournament.objects.filter(tid=uid).exists():
				return uid
			max_tries -= 1
		return None # type: ignore

	def __str__(self):
		return self.tid

	def json(self, json_pools=True, json_matches=True):
		pools: list = [] if json_pools else self.pools
		if json_pools:
			for pool in self.pools:
				p = Pool.objects.get(id=pool)
				if p:
					pools.append(p.json(json_matches))
		return {
			'tid': self.tid,
			'createdAt': self.created_at,
			'playerCount': self.player_count,
			'players': self.players,
			'pools': pools,
			'currentPool': self.current_pool,
			'status': self.status,

			'ended': self.status == Status.FINISHED,
		}

	def init(self):
		self.save()
		self.pools = []
		calcs = self.calc_pools(self.player_count)
		for m, p in calcs:
			pool = Pool.objects.create(matches_count=m, player_per_match=p).init()
			self.pools.append(pool.id)
		self.save()
		return self

	@staticmethod
	def decompose(n: int) -> list[int]:
		"""
		Takes a positive integer n >= 2.
		Decomposes it into its prime factors.
		Sorts the factors in descending order.
		"""
		if n < 2:
			return []
		factors = []
		divisor = 2
		while n > 1:
			while n % divisor == 0:
				factors.append(divisor)
				n //= divisor
			divisor += 1
		return factors[::-1]

	@staticmethod
	def is_legit(player_count: int, max_players: int = 30, min_players: int = 2) -> tuple[bool, int] :
		"""
		Checks if the player count is legit for a tournament.
		Returns a tuple of (is_legit, wrong_count).

		Ex.: if player_count == 62: "Cannot create game with 31 players."
		"""
		pools = Tournament.decompose(player_count)
		if len(pools) == 0:
			return False, player_count
		for p in pools:
			if p > max_players or p < min_players:
				return False, p
		return True, 0

	@staticmethod
	def calc_pools(player_count: int) -> list[tuple[int, int]]:
		"""
		Calculates the number of pools and the number of players per match for each pool.
		Returns a list of tuples of (matches_count, player_per_match).
		"""
		factors = Tournament.decompose(player_count)
		pools = []
		for n in factors:
			pools.append((player_count // n, n))
			player_count //= n
		return pools

	@staticmethod
	def on_game_end(uid: str):
		tournaments = Tournament.objects.all()
		for tournament in tournaments:
			pools = [tournament.get_pool(i) for i in range(len(tournament.pools))]
			for pool in pools:
				matches = [pool.get_match(i) for i in range(len(pool.matches))]
				for match in matches:
					if match.game and match.game.uid == uid:
						match.end()
						pool.try_to_end()
						if pool.status == Status.FINISHED:
							tournament.end_pool()
						return

	def get_pool(self, index: int):
		return Pool.objects.get(id=self.pools[index])

	def add_player(self, player_username: str):
		self.players.append(player_username)
		if len(self.players) == self.player_count:
			self.dispatch()
			self.status = Status.ONGOING
		self.save()

	def quit(self, player_username: str):
		self.players.remove(player_username)
		self.save()

	def dispatch(self):
		pool = self.get_pool(self.current_pool)
		players = self.players if self.current_pool == 0 else [
			winner.username
			for winner in self.get_pool(self.current_pool - 1).get_winners()
			if winner is not None
		]

		for i, player in enumerate(players):
			pool.get_match(i // pool.player_per_match).add_player(player)

	def end_pool(self):
		self.current_pool += 1
		if self.current_pool < len(self.pools):
			self.dispatch()
		else:
			self.status = Status.FINISHED
			self.save()


class Ressources(models.Model):
	'''
	Required fields:
		name: str
		type: str
		size: int
		data: bytes

	Auto fields:
		created_at: datetime

	Additionnal fields:
		info: str
	'''

	name		= models.CharField(primary_key=True, max_length=511)
	created_at	= models.DateTimeField(auto_now=True)
	type		= models.CharField(max_length=255)
	size		= models.IntegerField()
	info		= models.CharField(max_length=1023, null=True, default=None)
	data		= models.BinaryField()

	def __str__(self):
		return self.name

	def json(self):
		return {
			'name': self.name,
			'createdAt': self.created_at,
			'type': self.type,
			'size': self.size,
		}

class FriendList(models.Model):
	'''
	todo docstring
	'''

	author		= models.ForeignKey(User, related_name='+', on_delete=models.CASCADE, null=False)
	target		= models.ForeignKey(User, related_name='+', on_delete=models.CASCADE, null=False)
	pending		= models.BooleanField(null=False, default=True)

	def json(self):
		return {
			'author': self.author.username,
			'target': self.target.username,
			'pending': self.pending,
		}

class BlockList(models.Model):
	'''
	todo docstring
	'''

	author		= models.ForeignKey(User, related_name='+', on_delete=models.CASCADE, null=False)
	target		= models.ForeignKey(User, related_name='+', on_delete=models.CASCADE, null=False)

	def json(self):
		return {
			'author': self.author.username,
			'target': self.target.username,
		}