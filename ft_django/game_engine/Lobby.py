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

import random
import math

from game_engine.Ball import Ball
from game_engine.Vector import Vector

def init_map(lobby, num_players):
	if (num_players == 2):
		return {"wall1": [{"x": 2, "y": 4}, {"x": 2, "y": -4}],
			"wall2": [{"x": -2, "y": 4}, {"x": -2, "y": -4}],
			"player0": [{"x": 0.5, "y": 4}, {"x": -0.5, "y": 4}],
			"player1": [{"x": 0.5, "y": -4}, {"x": -0.5, "y": -4}]}
	
	walls = {}
	
	mapRadius = math.sqrt(num_players) * 2 + 2
	mapAngle = (2 * math.pi) / num_players
	vertex = []
	for i in range(num_players):
		vertex.append(Vector(math.cos(mapAngle * i) * mapRadius, 0, math.sin(mapAngle * i) * mapRadius))
	vertex.reverse()

	middleVertexPositions = []
	angleVertex = []
	for i in range(num_players):
		firstVertex = vertex[i]
		nextVertex = vertex[(i + 1) % num_players]
		
		middleVertexPositions.append(Vector((firstVertex.x + nextVertex.x) / 2, 0,
									(firstVertex.z + nextVertex.z) / 2))
		angleVertex.append(math.atan2(nextVertex.z - firstVertex.z, nextVertex.x - firstVertex.x))

	lobby.middleVertexPositions = middleVertexPositions
	lobby.angleVertex = angleVertex

	return walls

class Lobby():
	def __init__(self, gameServer):
		self.gameServer = gameServer
		self.lobby_id = len(self.gameServer.lobbys)

		self.clients = []
		self.clientsPerLobby = 3

		self.ball = Ball(self, 0.15)

		self.middleVertexPositions = []
		self.angleVertex = []
		self.walls = init_map(self, self.clientsPerLobby)

	async def update(self):
		await self.ball.update()

		for c in self.clients:
			await c.update()

	def receive(self, data):
		if ("player_keyboard" in data):
			self.clients[data["client_id"]].keyboard = data["player_keyboard"]

	async def addClient(self, player):
		self.clients.append(player)
		await player.addSelfWall()
		await player.sendData("modify", {"scene.server.lobby_id": self.lobby_id,
								   		"scene.server.client_id": player.client_id})
		await player.sendData("call", {"command": "scene.initConnection", "args": [self.clientsPerLobby]})

		print("len lobby.clients:", len(self.clients), "in lobby id: ", self.lobby_id)
		if (len(self.clients) == self.clientsPerLobby):
			angleRad = math.radians(50)

			self.ball.vel = Vector(math.cos(angleRad) * 1.2, 0, math.sin(angleRad) * 1.2)

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