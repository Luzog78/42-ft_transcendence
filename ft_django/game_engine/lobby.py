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

from .ball import Ball
from .vector import Vector

class Lobby:
	def __init__(self, gameServer):
		self.gameServer = gameServer
		self.lobby_id = len(self.gameServer.lobbys)

		self.clients = []
		self.clients_per_lobby = 30

		self.ball = Ball(self, 0.15)

		self.segment_size = 0
		self.middle_vertex_positions = []
		self.angleVertex = []

		self.player_size = 0.5

		self.walls = self.init_map(self.clients_per_lobby)

	def init_map(self, num_players):
		if (num_players == 2):
			return {"wall1": [Vector(2, 4 + 0.2), Vector(2, -4 + 0.2)],
				"wall2": [Vector(-2, 4 + 0.2), Vector(-2, -4 + 0.2)],
				"player0": [Vector(0.5, 4.075), Vector(-0.5, 4.075)],
				"player1": [Vector(0.5, -4.075), Vector(-0.5, -4.075)]}

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

			middle_vertex_positions.append(Vector((firstVertex.x + nextVertex.x) / 2,
										(firstVertex.y + nextVertex.y) / 2))
			angleVertex.append(math.atan2(nextVertex.y - firstVertex.y, nextVertex.x - firstVertex.x))

		self.middle_vertex_positions = middle_vertex_positions
		self.angleVertex = angleVertex

		return walls

	async def update(self):
		await self.ball.update()

		for c in self.clients:
			await c.update()

	def receive(self, data):
		if ("player_keyboard" in data):
			self.clients[data["client_id"]].keyboard = data["player_keyboard"]

	async def addClient(self, player):
		self.clients.append(player)
		
		player.addSelfWall()

		await player.sendData("modify", {"scene.server.lobby_id": self.lobby_id,
								   		"scene.server.client_id": player.client_id})
		await player.sendData("call", {"command": "scene.initConnection", "args": [self.clients_per_lobby]})
		
		await player.updateName()

		print("len lobby.clients:", len(self.clients), "in lobby id: ", self.lobby_id)
		if (len(self.clients) == self.clients_per_lobby):
			self.ball.vel = Vector(1.2, 1.2)

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
