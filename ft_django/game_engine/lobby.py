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

from .ball import Ball
from .vector import Vector

class Lobby:
	def __init__(self, gameServer):
		self.gameServer = gameServer
		self.lobby_id = len(self.gameServer.lobbys)


		self.clients = []
		self.clients_per_lobby = 3

		self.ball = Ball(self, 0.15)

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

	async def playerDied(self, dead_player):
		self.ball.pos = Vector(0, 0)
		self.ball.vel = Vector(1.2, 0)
		self.clients_per_lobby -= 1

		await self.sendData("call", {"command": 'scene.server.playerDead',
									"args": ["'" + dead_player + "'"]})
		
		time.sleep(3)
		self.time = 0

		self.walls = self.init_map(self.clients_per_lobby)
		player_id = int(dead_player.replace("player", ""))
		player = self.clients[player_id]

		self.removeClient(player)
		for c in self.clients:
			if (c.client_id > player_id):
				c.client_id -= 1
			await c.initConnection()
			await self.ball.updateBall()


	async def update(self):
		while self.running:
			if (self.time == 0):
				self.time = time.time()
				continue
			self.dt = time.time() - self.time
			self.time = time.time()

			time.sleep(self.gameServer.dt)
			
			await self.ball.update()

			for c in self.clients:
				await c.update()

	def receive(self, data):
		if ("client_id" not in data or data["client_id"] >= len(self.clients)):
			return
		if ("player_keyboard" in data):
			self.clients[data["client_id"]].keyboard = data["player_keyboard"]

	async def addClient(self, player):
		self.clients.append(player)

		await player.initConnection()

		print("len lobby.clients:", len(self.clients), "in lobby id: ", self.lobby_id)
		if (len(self.clients) == self.clients_per_lobby):
			self.ball.vel = Vector(1.2, 2.4)

			for c in self.clients:
				await self.ball.updateBall()
				await c.sendData("game_status", "START")

	def removeClient(self, client):
		self.clients.remove(client)

		if (len(self.clients) == 0):
			self.gameServer.lobbys.remove(self)

	async def sendData(self, *args):
		for c in self.clients:
			await c.sendData(*args)

	async def sendToOther(self, client, *args):
		for c in self.clients:
			if (c != client):
				await c.sendData(*args)
