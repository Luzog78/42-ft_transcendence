import time
from datetime import datetime

from api_app.models import Game, GameMode, User, Stats, Tournament


class TTTLimit:
	COLORS = [
		'white', 'black', 'red', 'blue', 'green', 'yellow', 'purple', 'aqua'
	]

	SHAPES = [
		'circle', 'cross', 'triangle', 'square'
	]

	DEFAULT = (COLORS.index('red') << 4 | SHAPES.index('circle')) << 8 \
			| (COLORS.index('blue') << 4 | SHAPES.index('cross')) # red circle vs blue cross: 0x2031 (8241)

	@staticmethod
	def get_shape_id(val: int) -> int:
		return val & 0b1111

	@staticmethod
	def get_color_id(val: int) -> int:
		return (val >> 4) & 0b1111

	@staticmethod
	def get_ids(val: int) -> tuple[int, int]:
		return TTTLimit.get_shape_id(val), TTTLimit.get_color_id(val)

	@staticmethod
	def split_vals_ids(val: int) -> tuple[tuple[int, int], tuple[int, int]]:
		return TTTLimit.get_ids((val >> 8) & 0b11111111), TTTLimit.get_ids(val & 0b11111111)

	@staticmethod
	def get_shape(id: int) -> str:
		return TTTLimit.SHAPES[id % len(TTTLimit.SHAPES)]

	@staticmethod
	def get_color(id: int) -> str:
		return TTTLimit.COLORS[id % len(TTTLimit.COLORS)]

	@staticmethod
	def parse(val: int) -> tuple[tuple[str, str], tuple[str, str]]:
		((shape1, color1), (shape2, color2)) = TTTLimit.split_vals_ids(val)
		return (TTTLimit.get_shape(shape1), TTTLimit.get_color(color1)), \
				(TTTLimit.get_shape(shape2), TTTLimit.get_color(color2))


class TTTLobby:
	lobbies: list['TTTLobby'] = []

	@staticmethod
	def create_game() -> Game | None:
		try:
			return Game.objects.create(
				uid=Game.new_uid(),
				mode=GameMode.TIC_TAC_TOE,
			)
		except Exception as e:
			return None

	@staticmethod
	def get_lobby(user: User, create: bool = False, limit: int = TTTLimit.DEFAULT) -> 'TTTLobby | None':
		for lobby in TTTLobby.lobbies:
			if lobby.player1 is not None and lobby.player1.username == user.username:
				return lobby
			if lobby.player2 is not None and lobby.player2.username == user.username:
				return lobby

		if not create:
			return None

		game = TTTLobby.create_game()
		if game is None:
			return None
		return TTTLobby(game, limit).register()

	@staticmethod
	def get_lobby_by_game(game: Game, create: bool = True, limit: int = TTTLimit.DEFAULT) -> 'TTTLobby | None':
		for lobby in TTTLobby.lobbies:
			if lobby.game.uid == game.uid:
				return lobby

		if not create:
			return None

		return TTTLobby(game, limit).register()

	def __init__(self, game: Game, limit: int = TTTLimit.DEFAULT):
		self.game: Game				= game
		self.player1: User | None	= None
		self.player2: User | None	= None
		self.turn: int				= 0
		self.board: list[int]		= [0, 0, 0, 0, 0, 0, 0, 0, 0]
		self.start_timestamp: int	= 0
		((self.shape1, self.color1), (self.shape2, self.color2)) = TTTLimit.parse(limit)

	def json(self) -> dict:
		return {
			'uid': self.game.uid,
			'player1': self.player1.username if self.player1 is not None else None,
			'player2': self.player2.username if self.player2 is not None else None,
			'turn': self.turn,
			'board': self.board,
			'start_timestamp': self.start_timestamp,
			'user1Shape': self.shape1,
			'user1Color': self.color1,
			'user2Shape': self.shape2,
			'user2Color': self.color2,
		}

	def register(self) -> 'TTTLobby':
		self.lobbies.append(self)
		return self

	def unregister(self):
		self.lobbies.remove(self)

	def is_present(self, user: User) -> bool:
		return self.player1 is not None and self.player1.username == user.username \
			or self.player2 is not None and self.player2.username == user.username

	def join(self, user: User) -> bool:
		if (self.player1 is not None and self.player1.username == user.username) \
			or (self.player2 is not None and self.player2.username == user.username):
			return False

		if self.game.restricted and user.username not in self.game.players:
			return False

		if self.player1 is None:
			self.player1 = user
			if self.player1 is not None and self.player2 is not None:
				self.start_timestamp = int(time.time())
				self.game.started_at = datetime.now()
				self.game.save()
				self.turn = 1
			return True

		elif self.player2 is None:
			self.player2 = user
			if self.player1 is not None and self.player2 is not None:
				self.start_timestamp = int(time.time())
				self.turn = 1
				self.game.started_at = datetime.now()
				self.game.save()
			return True

		return False

	def leave(self, user: User) -> bool:
		if self.player1 is not None and self.player1.username == user.username:
			self.player1 = None
			return True

		elif self.player2 is not None and self.player2.username == user.username:
			self.player2 = None
			return True

		return False

	def play(self, user: User, slot: int) -> bool:
		if self.player1 is None or self.player2 is None:
			return False

		if self.player1.username != user.username and self.player2.username != user.username:
			return False

		if self.board[slot] != 0:
			return False

		if self.player1.username == user.username and self.turn == 1:
			self.board[slot] = 1
			self.turn = 2
			self.check_winner()
			self.check_board()
			return True

		elif self.player2.username == user.username and self.turn == 2:
			self.board[slot] = 2
			self.turn = 1
			self.check_winner()
			self.check_board()
			return True

		return False

	def check_board(self):
		full = True
		for e in self.board:
			if e == 0:
				full = False
				break

		if full:
			self.board = [0, 0, 0, 0, 0, 0, 0, 0, 0]

	def check_winner(self):
		winner = 0

		# Check rows
		for i in range(0, 7, 3):
			if self.board[i] == self.board[i + 1] == self.board[i + 2] != 0:
				winner = self.board[i]

		# Check columns
		for i in range(3):
			if self.board[i] == self.board[i + 3] == self.board[i + 6] != 0:
				winner = self.board[i]

		# Check diagonals
		if self.board[0] == self.board[4] == self.board[8] != 0:
			winner = self.board[0]

		if self.board[2] == self.board[4] == self.board[6] != 0:
			winner = self.board[2]

		if winner != 0:
			if self.game is None or self.player1 is None or self.player2 is None:
				return

			duration = int(time.time()) - self.start_timestamp

			stats1 = Stats.objects.create(
				user=self.player1,
				game=self.game,
				score=1 if winner == 1 else 0,
				kills=0 if winner == 1 else 1,
				best_streak=1 if winner == 1 else 0,
				rebounces=0,
				ultimate=0,
				duration=duration,
				won=True if winner == 1 else False,
			)
			stats2 = Stats.objects.create(
				user=self.player2,
				game=self.game,
				score=1 if winner == 2 else 0,
				kills=0 if winner == 2 else 1,
				best_streak=1 if winner == 2 else 0,
				rebounces=0,
				ultimate=0,
				duration=duration,
				won=True if winner == 2 else False,
			)

			self.game.ended_at = datetime.now()
			self.game.players = [self.player1.username, self.player2.username]
			self.game.winner = stats1 if winner == 1 else stats2
			self.game.best_streak = stats1 if winner == 1 else stats2
			self.game.rebounces = stats1 if winner == 1 else stats2
			self.game.ultimate = stats1 if winner == 1 else stats2
			self.game.duration = stats1 if winner == 1 else stats2
			self.game.save()

			self.unregister()

			Tournament.on_game_end(self.game.uid)
