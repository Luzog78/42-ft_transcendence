# **************************************************************************** #
#                                                                              #
#                                                         :::      ::::::::    #
#    Lobby.py                                           :+:      :+:    :+:    #
#                                                     +:+ +:+         +:+      #
#    By: marvin <marvin@student.42.fr>              +#+  +:+       +#+         #
#                                                 +#+#+#+#+#+   +#+            #
#    Created: 2024/06/15 14:43:10 by marvin            #+#    #+#              #
#    Updated: 2024/06/15 14:43:10 by marvin           ###   ########.fr        #
#                                                                              #
# **************************************************************************** #

import math
import asyncio
import threading
import time
from datetime import datetime

from .ball import Ball
from .vector import Vector
from .bot import Bot
from .player import Player
from .spectator import Spectator
from api_app.models import Tournament


class Lobby:
	def __init__(self, game_server, uid: str, game_mode: str, player_num: int, theme: int, ball_speed: float, limit):
		self.game_server		= game_server
		self.lobby_id:		int = len(self.game_server.lobbies)

		self.uid:				str		= uid
		self.game_mode:			str		= game_mode
		self.clients_per_lobby:	int		= player_num
		self.theme:				int		= theme
		self.ball_speed:		float	= ball_speed
		self.limit						= limit
		self.start_time:		float	= 0

		self.initial_clients_per_lobby: int					= player_num
		self.last_killer:				Player | Bot | None = None
		self.status:					str					= "WAITING"

		self.clients:		list[Player | Bot]	= []
		self.dead_clients:	list[Player | Bot]	= []
		self.client_ready:	list[bool]			= []
		self.spectators:	list[Spectator]		= []

		self.balls: list[Ball] = [Ball(self, 0.15, 0)]

		self.player_size:	float	= 0.5
		self.segment_size:	float	= 4

		self.middle_vertex_positions:	list[Vector]	= []
		self.angleVertex:				list[float]		= []

		self.walls: dict[str, list[Vector]]	= self.initMap(self.clients_per_lobby)

		self.time	= 0
		self.dt		= 0

		self.running		= True
		self.update_thread	= threading.Thread(target=asyncio.run, args=(self.update(),))
		self.update_thread.start()

	def initMap(self, num_players: int) -> dict[str, list[Vector]]:
		self.client_ready = [False] * num_players

		if num_players == 2:
			self.player_size = 0.5
			self.segment_size = 4
			return {"wall1": [Vector(2, 4 + 0.2), Vector(2, -4 + 0.2)],
				"wall2": [Vector(-2, 4 + 0.2), Vector(-2, -4 + 0.2)],
				"player0": [Vector(0.5, 4.075), Vector(-0.5, 4.075)],
				"player1": [Vector(0.5, -4.075), Vector(-0.5, -4.075)],
				"score0": [Vector(-3, 4.15), Vector(3, 4.15)],
				"score1": [Vector(-3, -4.15), Vector(3, -4.15)]}

		walls = {}

		map_radius = math.sqrt(num_players) * 2 + 2
		map_angle = (2 * math.pi) / num_players
		vertex = []
		for i in range(num_players):
			vertex.append(Vector(math.cos(map_angle * i) * map_radius, math.sin(map_angle * i) * map_radius))
		vertex.reverse()

		middle_vertex_positions = []
		angleVertex = []

		for i in range(num_players):
			firstVertex = vertex[i]
			nextVertex = vertex[(i + 1) % num_players]

			if i == 0:
				self.player_size = (firstVertex.distance(nextVertex) * 0.3) / 2
				self.segment_size = firstVertex.distance(nextVertex)

			angle = math.atan2(nextVertex.y - firstVertex.y, nextVertex.x - firstVertex.x)
			middle_vertex_positions.append(Vector((firstVertex.x + nextVertex.x) / 2,
										(firstVertex.y + nextVertex.y) / 2))
			angleVertex.append(angle)

			angle = angle + math.pi / 2
			back_direction = Vector(math.cos(angle), math.sin(angle)) * 0.05
			firstVertex += back_direction
			nextVertex += back_direction

			walls["score" + str(i)] = [firstVertex, nextVertex]

		self.middle_vertex_positions = middle_vertex_positions
		self.angleVertex = angleVertex

		return walls

	def onEnd(self):
		from api_app.models import Game, User, Stats
		from api_app import auth

		game = Game.objects.get(uid=self.uid)
		assert game is not None

		stats: list[Stats] = []

		player_list = self.clients + self.dead_clients
		for player in player_list:
			username = ""
			if isinstance(player, Player):
				if player.client.username is None:
					continue
				username = player.client.username
			elif isinstance(player, Bot):
				username = player.username

			user = User.get(username)
			if user is None and isinstance(player, Bot):
				user = auth.register(None, username, "Bot", str(player.client_id), username + '@server', None)
				print("Bot user created", user)
				if user:
					user = user['user']
				else:
					continue

			player.duration += 3

			print("save stats of", username)
			stat = Stats.objects.create(
				user=user,
				game=game,
				score=player.kills,
				kills=player.deaths,
				best_streak=player.best_streak,
				rebounces=player.rebounces,
				ultimate=player.ultimate_speed,
				duration=player.duration,
				won=False,
			)

			stat.save()
			stats.append(stat)


		best_score = max(stats, key=lambda s: s.score)

		game.ended_at = datetime.now()
		game.best_streak = max(stats, key=lambda s: s.best_streak)
		game.rebounces = max(stats, key=lambda s: s.rebounces)
		game.ultimate = max(stats, key=lambda s: s.ultimate)
		game.duration = max(stats, key=lambda s: s.duration)

		if self.game_mode == "BR":
			game.winner = game.duration
			game.duration.won = True
			game.duration.save()
		else:
			game.winner = best_score
			best_score.won = True
			best_score.save()

		players = [p.client.username if isinstance(p, Player) else p.username for p in player_list]
		game.players = [username for username in players if username is not None]
		print("party dead :", game.players)
		game.save()

		Tournament.on_game_end(self.uid)

	async def BRDied(self, player_id: int, player: Player | Bot):
		if self.clients_per_lobby == 2:
			winner = self.clients[player_id - 1]
			winner.duration = datetime.timestamp(datetime.now()) - winner.start_time + 2
			self.onEnd()

			time.sleep(3)
			await self.sendData("game_status", "END")

			return

		time.sleep(3)

		self.clients_per_lobby -= 1
		self.time = 0
		self.walls = self.initMap(self.clients_per_lobby)

		self.dead_clients.append(player)
		self.removeClient(player)

		for c in self.clients:
			if c.client_id > player_id:
				c.client_id -= 1
			if isinstance(c, Player):
				await c.initPlayer()
			if isinstance(c, Bot):
				await c.initBot()
		for s in self.spectators:
			await s.initSpectator()

		if (all([isinstance(c, Bot) for c in self.clients])):
			threading.Thread(target=asyncio.run, args=(self.countdown(),)).start()

	async def TOFTDied(self, killer: Player | Bot | None, player_id: int, player: Player | Bot | None):
		time.sleep(1)

		if self.game_mode == "FT" and killer != None and killer.kills >= self.limit:
			self.onEnd()
			await self.sendData("game_status", "END")

			return

		self.balls[0].vel = Ball.getBallSpeed(self.clients_per_lobby, self.ball_speed)
		await self.balls[0].updateBall()

		if killer:
			score_name = f"player{killer.client_id}textscore"
			await self.sendData("call", {"command": f'scene.get("{score_name}").updateText', "args": [str(killer.kills)]})

		

	async def playerDied(self, ball: Ball, dead_player: str):
		if len(self.clients) == 0:
			return

		self.status = "WAITING"

		player_id = int(dead_player.replace("player", ""))
		player = self.clients[player_id]
		player.die()

		killer = ball.last_player
		if (self.clients_per_lobby == 2):
			killer = self.clients[1 - player_id]
		
		if (killer != None):
			if (self.last_killer != None and killer != self.last_killer):
				if (self.last_killer.streak > self.last_killer.best_streak):
					self.last_killer.best_streak = self.last_killer.streak
				self.last_killer.streak = 0
			self.last_killer = killer
			killer.streak += 1
			killer.kills += 1

		for ball in self.balls:
			del ball
		self.balls = [Ball(self, 0.15, 0)]

		await self.sendData("call", {"command": 'scene.server.playerDead',
									"args": ["'" + dead_player + "'"]})

		if self.game_mode == "BR":
			threading.Thread(target=asyncio.run, args=(self.BRDied(player_id, player),)).start()
		elif self.game_mode == "TO" or self.game_mode == "FT":
			threading.Thread(target=asyncio.run, args=(self.TOFTDied(killer, player_id, player),)).start()
		

	async def fillBot(self):
		bots_num = self.clients_per_lobby - len(self.clients)
		starting_id = len(self.clients)
		for i in range(bots_num):
			bot = Bot(self, i + starting_id)
			await self.addBot(bot)

	async def update(self):
		while self.running:
			if self.game_mode == "TO" and self.start_time != 0 and datetime.timestamp(datetime.now()) - self.start_time > self.limit:
				self.onEnd()

				self.status = "END"
				await self.sendData("game_status", "END")
				return
			
			if self.time == 0:
				self.time = time.time()
				continue

			self.dt = time.time() - self.time
			self.time = time.time()

			time.sleep(self.game_server.dt)

			for ball in self.balls:
				await ball.update()
			for c in self.clients:
				await c.update()
			for s in self.spectators:
				await s.update()

	async def countdown(self):
		time.sleep(3)
		if self.clients_per_lobby == self.initial_clients_per_lobby:
			self.start_time = datetime.timestamp(datetime.now())

		self.balls[0].vel = Ball.getBallSpeed(self.clients_per_lobby, self.ball_speed)
		await self.balls[0].updateBall()

		clients = self.clients + self.spectators
		for c in clients:
			if isinstance(c, Player) or isinstance(c, Bot):
				c.start_time = datetime.timestamp(datetime.now())
			if isinstance(c, Player) or isinstance(c, Spectator):
				await c.sendData("game_status", "START")

	async def receive(self, data: dict):
		if "client_id" not in data and isinstance(data["client_id"], int):
			return
		client_id: int = data["client_id"]

		if "fill" in data:
			if client_id != 0 or len(self.clients) == self.clients_per_lobby:
				del data["fill"]
				return
			await self.fillBot()

		if "ready" in data:
			self.client_ready[client_id] = True

		if "fill" in data or "ready" in data:
			if len(self.clients) == self.clients_per_lobby and self.status == "WAITING":
				threading.Thread(target=asyncio.run, args=(self.countdown(),)).start()

		if "player_keyboard" in data:
			if client_id < len(self.clients):
				client = self.clients[client_id]
				if isinstance(client, Player):
					client.keyboard = data["player_keyboard"]
			else:
				self.spectators[client_id].keyboard = data["player_keyboard"]

	async def addClient(self, player: Player):
		self.clients.append(player)
		await self.sendData("call", {"command": 'setWaitingTotalPlayerCount',
									"args": [ f'{self.clients_per_lobby}' ]})
		await player.initPlayer()

	async def addSpectator(self, spectator: Spectator):
		self.spectators.append(spectator)
		await spectator.initSpectator()

	async def addBot(self, bot: Bot):
		self.clients.append(bot)
		await bot.initBot()

	def removeClient(self, client: Player | Spectator | Bot):
		if client in self.clients:
			self.clients.remove(client)

		if len(self.clients) == 0:
			self.game_server.lobbies.remove(self)

	async def sendData(self, *args):
		for c in self.clients:
			if isinstance(c, Player):
				await c.sendData(*args)
		for s in self.spectators:
			await s.sendData(*args)

	async def sendToOther(self, client, *args):
		for c in self.clients:
			if c != client and isinstance(c, Player):
				await c.sendData(*args)
		for s in self.spectators:
			await s.sendData(*args)
