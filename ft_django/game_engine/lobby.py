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
from .player import Player

class Lobby:
	def __init__(self, game_server, uid, game_mode, player_num, theme, ball_speed, limit):
		self.game_server = game_server
		self.lobby_id = len(self.game_server.lobbies)
		
		self.uid = uid
		self.game_mode = game_mode
		self.clients_per_lobby = player_num
		self.theme = theme
		self.ball_speed = ball_speed
		self.limit = limit

		self.clients: list[Player] = []
		self.client_ready: list[Player] = []

		self.balls = [Ball(self, 0.15, 0)]

		self.player_size = 0.5
		self.segment_size = 4

		self.middle_vertex_positions = []
		self.angleVertex = []

		self.walls = self.init_map(self.clients_per_lobby)

		self.time = 0
		self.dt = 0

		self.running = True
		self.update_thread = threading.Thread(target=asyncio.run, args=(self.update(),))
		self.update_thread.start()


	def init_map(self, num_players):
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
		from api_app.models import Game as Game, User, Stats

		game = Game.objects.get(uid=self.uid)
		assert game is not None

		stats: list[Stats] = []

		for player in self.clients:
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

		game.save()

	async def playerDied(self, ball, dead_player):
		if (ball.last_player):
			ball.last_player.kills += 1

		self.balls = [Ball(self, 0.15, 0)]
		self.balls[0].vel = Ball.getBallSpeed(self.clients_per_lobby)
		#maybe wait for ready here

		player_id = int(dead_player.replace("player", ""))
		player = self.clients[player_id]
		player.die()

		await self.sendData("call", {"command": 'scene.server.playerDead',
									"args": ["'" + dead_player + "'"]})
		
		if (self.game_mode == "BR" and self.clients_per_lobby == 2):
			ball.last_player.duration = datetime.timestamp(datetime.now()) - ball.last_player.start_time + 1
			self.onEnd()
			return

		time.sleep(3)

		self.clients_per_lobby -= 1
		self.time = 0

		self.walls = self.init_map(self.clients_per_lobby)

		self.removeClient(player)
		for c in self.clients:
			if (c.client_id > player_id):
				c.client_id -= 1
			await c.initConnection()
			await self.balls[0].updateBall()


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

	async def receive(self, data):
		client_id = data["client_id"]
		if ("client_id" not in data or client_id >= len(self.clients)):
			return

		if ("ready" in data):
			self.client_ready[client_id] = True
			# if (all(self.client_ready)):
			if (len(self.clients) == self.clients_per_lobby):
				self.balls[0].vel = Ball.getBallSpeed(self.clients_per_lobby)

				for c in self.clients:
					await self.balls[0].updateBall()
					await c.sendData("game_status", "START")

		if ("player_keyboard" in data):
			self.clients[client_id].keyboard = data["player_keyboard"]

	async def addClient(self, player):
		self.clients.append(player)
		await player.initConnection()

		print("len lobby.clients:", len(self.clients), "in lobby id: ", self.lobby_id)

	def removeClient(self, client):
		self.clients.remove(client)

		if (len(self.clients) == 0):
			self.game_server.lobbies.remove(self)

	async def sendData(self, *args):
		for c in self.clients:
			await c.sendData(*args)

	async def sendToOther(self, client, *args):
		for c in self.clients:
			if (c != client):
				await c.sendData(*args)
