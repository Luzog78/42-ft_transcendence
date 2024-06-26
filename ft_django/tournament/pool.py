from api_app.models import User


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

	def add_player(self, player):
		self.players.append(player)
		if len(self.players) == self.player_count:
			self.status = Status.ONGOING

	def dispatch(self):
		pool = self.pools[self.current_pool]
		players = self.players if self.current_pool == 0 else self.pools[self.current_pool - 1].get_winners()

		for i, player in enumerate(players):
			pool.matches[i // pool.player_per_match].add_player(player)

	def get_matches_uid(self) -> list[str]:
		return [match.uid for pool in self.pools for match in pool.matches]


class Pool:
	def __init__(self, matches_count, player_per_match):
		self.matches_count = matches_count
		self.player_per_match = player_per_match
		self.matches = [Match(player_per_match) for _ in range(matches_count)]
		self.status = Status.PENDING

	def get_winners(self):
		return [match.winner for match in self.matches]


class Match:
	def __init__(self, player_count):
		self.player_count = player_count
		self.players = []
		self.winner = None
		self.status = Status.PENDING
		self.uid: str = None # type: ignore

	def add_player(self, player):
		self.players.append(player)
		if len(self.players) == self.player_count:
			self.start()

	def start(self):
		self.status = Status.ONGOING
		# TODO: start the match
		pass

	def end(self, winner):
		self.winner = winner
		self.status = Status.FINISHED
