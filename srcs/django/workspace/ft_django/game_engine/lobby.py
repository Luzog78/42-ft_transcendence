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

from api_app.models import Tournament

from .ball import Ball
from .vector import Vector
from .player import Player
from .spectator import Spectator

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

		self.clients:		list[Player]	= []
		self.dead_clients:	list[Player]	= []
		self.client_ready:	list[bool]		= []
		self.spectators:	list[Spectator]	= []

		self.balls: list[Ball] = [Ball(self, 0.15, 0)]

		self.player_size:	float	= 0.5
		self.segment_size:	float	= 4

		self.middle_vertex_positions:	list[Vector]	= []
		self.angleVertex:				list[float]		= []

		self.walls: dict[str, list[Vector]]	= self.init_map(self.clients_per_lobby)

		self.time	= 0
		self.dt		= 0

		self.running		= True
		self.update_thread	= threading.Thread(target=asyncio.run, args=(self.update(),))
		self.update_thread.start()

	def init_map(self, num_players: int) -> dict[str, list[Vector]]:
		self.client_ready = [False] * num_players

		if (num_players == 2):
			self.player_size = 0.5
			self.segment_size = 4
			return {"wall1": [Vector(2, 4 + 0.2), Vector(2, -4 + 0.2)],
				"wall2": [Vector(-2, 4 + 0.2), Vector(-2, -4 + 0.2)],
				"player0": [Vector(0.5, 4.075), Vector(-0.5, 4.075)],
				"player1": [Vector(0.5, -4.075), Vector(-0.5, -4.075)],
				"score0": [Vector(-3, 4.15), Vector(3, 4.15)],
				"score1": [Vector(-3, -4.15), Vector(3, -4.15)]}

		walls = {}

		mapRadius = math.sqrt(num_players) * 2 + 2
		mapAngle = (2 * math.pi) / num_players
		vertex = []
		for i in range(num_players):
			vertex.append(Vector(math.cos(mapAngle * i) * mapRadius, math.sin(mapAngle * i) * mapRadius))
		vertex.reverse()

		middle_vertex_positions = []
		angleVertex = []

		for i in range(num_players):
			firstVertex = vertex[i]
			nextVertex = vertex[(i + 1) % num_players]

			if (i == 0):
				self.player_size = (firstVertex.distance(nextVertex) * 0.3) / 2
				self.segment_size = firstVertex.distance(nextVertex)

			angle = math.atan2(nextVertex.y - firstVertex.y, nextVertex.x - firstVertex.x)
			middle_vertex_positions.append(Vector((firstVertex.x + nextVertex.x) / 2,
										(firstVertex.y + nextVertex.y) / 2))
			angleVertex.append(angle)

			angle = angle + math.pi / 2
			back_direction = Vector(math.cos(angle), math.sin(angle)) * 0.15
			firstVertex += back_direction
			nextVertex += back_direction

			walls["score" + str(i)] = [firstVertex, nextVertex]

		self.middle_vertex_positions = middle_vertex_positions
		self.angleVertex = angleVertex

		return walls

	def onEnd(self):
		from api_app.models import Game, User, Stats

		game = Game.objects.get(uid=self.uid)
		assert game is not None

		stats: list[Stats] = []

		player_list = self.clients + self.dead_clients

		for player in player_list:
			print("save stats of", player.client.username)
			user = User.objects.get(username=player.client.username)
			assert user is not None

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

		game.players = [p.client.username for p in self.clients] # TODO: what to do if if p.client.username is None ?

		game.save()

		Tournament.on_game_end(self.uid)

	async def playerDied(self, ball: Ball, dead_player: str):
		if (ball.last_player):
			ball.last_player.kills += 1

		for ball in self.balls:
			del ball
		self.balls = [Ball(self, 0.15, 0)]

		player_id = int(dead_player.replace("player", ""))
		player = self.clients[player_id]
		player.die()

		print("player dead: ", dead_player, player_id)
		await self.sendData("call", {"command": 'scene.server.playerDead',
									"args": ["'" + dead_player + "'"]})

		if (self.game_mode == "BR" and self.clients_per_lobby == 2):
			winner = self.clients[player_id - 1]
			winner.duration = datetime.timestamp(datetime.now()) - winner.start_time + 2
			self.onEnd()
			
			time.sleep(3)
			await self.sendData("game_status", "END")
			
			self.game_server.kill(self)
			return

		time.sleep(3)

		self.clients_per_lobby -= 1
		self.time = 0
		self.walls = self.init_map(self.clients_per_lobby)

		self.dead_clients.append(player)
		self.removeClient(player)

		for c in self.clients:
			if (c.client_id > player_id):
				c.client_id -= 1
			await c.initPlayer()
		for s in self.spectators:
			await s.initSpectator()


	async def update(self):
		while self.running:
			if (self.time == 0):
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

	async def receive(self, data: dict):
		client_id = data["client_id"]
		if ("client_id" not in data):
			return

		if ("ready" in data):
			self.client_ready[client_id] = True
			# if (all(self.client_ready)):
			if (len(self.clients) == self.clients_per_lobby):
				async def countdown(lobby: Lobby):
					time.sleep(3)
					lobby.balls[0].vel = Ball.getBallSpeed(lobby.clients_per_lobby)
					clients = lobby.clients + lobby.spectators
					for c in clients:
						await lobby.balls[0].updateBall()
						await c.sendData("game_status", "START")

				count_thread = threading.Thread(target=asyncio.run, args=(countdown(self),))
				count_thread.start()


		if ("player_keyboard" in data):
			if (client_id < len(self.clients)):
				self.clients[client_id].keyboard = data["player_keyboard"]
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



	def removeClient(self, client: Player):
		if (client in self.clients):
			self.clients.remove(client)

		if (len(self.clients) == 0):
			self.game_server.lobbies.remove(self)

	async def sendData(self, *args):
		for c in self.clients:
			await c.sendData(*args)
		for s in self.spectators:
			await s.sendData(*args)

	async def sendToOther(self, client, *args):
		for c in self.clients:
			if (c != client):
				await c.sendData(*args)
		for s in self.spectators:
			await s.sendData(*args)
