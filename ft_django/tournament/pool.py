from api_app.models import GameMode, User, Game, Tounament as TounamentModel


def decompose(n: int) -> list[int]:
	"""
	Takes a positive integer n >= 2.
	Decomposes it into its prime factors.
	Sorts the factors in descending order.
	"""
	factors = []
	divisor = 2
	while n > 1:
		while n % divisor == 0:
			factors.append(divisor)
			n //= divisor
		divisor += 1
	return factors[::-1]


class Status:
	PENDING = "pending"
	ONGOING = "ongoing"
	FINISHED = "finished"


class Tounament:
	def __init__(self, tid: str, player_count: int):
		self.tid = tid
		self.player_count = player_count

		self.players: list[User] = []
		self.pools = [Pool(m, p) for m, p in self.calc_pools(player_count)]

		self.current_pool = 0
		self.status = Status.PENDING

	@staticmethod
	def from_json(json: dict) -> 'Tounament | None':
		try:
			tounament = Tounament(json["tid"], json["player_count"])
			tounament.players = [User.objects.get(username=username) for username in json["players"]]
			tounament.pools = [Pool.from_json(j) for j in json["pools"]]
			tounament.current_pool = json["current_pool"]
			tounament.status = json["status"]
			return tounament
		except Exception as e:
			print(e)
			return None

	@staticmethod
	def calc_pools(player_count) -> list[tuple[int, int]]:
		"""
		Calculates the number of pools and the number of players per match for each pool.
		Returns a list of tuples of (matches_count, player_per_match).
		"""
		factors = decompose(player_count)
		pools = []
		for n in factors:
			pools.append((player_count // n, n))
			player_count //= n
		return pools
	
	def json(self) -> dict:
		return {
			"tid": self.tid,
			"player_count": self.player_count,
			"players": [player.username for player in self.players],
			"pools": [pool.json() for pool in self.pools],
			"current_pool": self.current_pool,
			"status": self.status,
		}

	def save(self):
		t, created = TounamentModel.objects.get_or_create(tid=self.tid)
		t.content = self.json()
		t.save()
	
	def register(self):
		active_tounaments.append(self)
		self.save()

	def add_player(self, player):
		self.players.append(player)
		if len(self.players) == self.player_count:
			self.dispatch()
			self.status = Status.ONGOING
	
	def quit(self, player):
		self.players.remove(player)

	def dispatch(self):
		pool = self.pools[self.current_pool]
		players = self.players if self.current_pool == 0 else self.pools[self.current_pool - 1].get_winners()

		for i, player in enumerate(players):
			pool.matches[i // pool.player_per_match].add_player(player)

	def end_pool(self):
		self.current_pool += 1
		if self.current_pool < len(self.pools):
			self.dispatch()
		else:
			self.status = Status.FINISHED
			self.save()

	def get_matches_uid(self) -> list[str]:
		return [match.uid for pool in self.pools for match in pool.matches]


class Pool:
	def __init__(self, matches_count, player_per_match):
		self.matches_count = matches_count
		self.player_per_match = player_per_match
		self.matches = [Match(player_per_match) for _ in range(matches_count)]
		self.status = Status.PENDING

	@staticmethod
	def from_json(json: dict) -> 'Pool':
		pool = Pool(json["matches_count"], json["player_per_match"])
		pool.matches = [Match.from_json(j) for j in json["matches"]]
		pool.status = json["status"]
		return pool
	
	def json(self) -> dict:
		return {
			"matches_count": self.matches_count,
			"player_per_match": self.player_per_match,
			"matches": [match.json() for match in self.matches],
			"status": self.status,
		}

	def try_to_end(self):
		if all(match.status == Status.FINISHED for match in self.matches):
			self.status = Status.FINISHED

	def get_winners(self):
		return [match.winner for match in self.matches]


class Match:
	def __init__(self, player_count):
		self.player_count: int = player_count
		self.players: list[User] = []
		self.winner: User | None = None # type: ignore
		self.status = Status.PENDING
		self.uid: str = None # type: ignore
		self.game: Game | None = None # type: ignore

	@staticmethod
	def from_json(json: dict) -> 'Match':
		match = Match(json["player_count"])
		match.players = [User.objects.get(username=username) for username in json["players"]]
		match.winner = User.objects.get(username=json["winner"]) if json["winner"] is not None else None
		match.status = json["status"]
		match.uid = json["uid"]
		match.game = Game.objects.get(uid=json["game"]) if json["game"] is not None else None
		return match

	def json(self) -> dict:
		return {
			"player_count": self.player_count,
			"players": [player.username for player in self.players],
			"winner": self.winner.username if self.winner is not None else None,
			"status": self.status,
			"uid": self.uid,
			"game": self.game.uid if self.game is not None else None,
		}

	def add_player(self, player):
		self.players.append(player)
		if len(self.players) == self.player_count:
			self.start()

	def start(self):
		self.status = Status.ONGOING
		self.game = Game.objects.create(
			uid=Game.new_uid(),
			mode=GameMode.BATTLE_ROYALE,
			player=self.players,
			restricted=True,
		)
		self.uid = self.game.uid

	def end(self):
		assert self.game is not None
		self.winner = self.game.winner.user
		self.status = Status.FINISHED


active_tounaments: list[Tounament] = []


def on_game_end(uid: str):
	for tounament in active_tounaments[:]:
		for pool in tounament.pools:
			for match in pool.matches:
				if match.uid == uid:
					match.end()
					pool.try_to_end()
					if pool.status == Status.FINISHED:
						tounament.end_pool()
						if tounament.status == Status.FINISHED:
							active_tounaments.remove(tounament)
					return


def load_tounaments():
	for tounament in TounamentModel.objects.filter(ended=False):
		t = Tounament.from_json(tounament.json())
		if t is not None:
			t.register()
