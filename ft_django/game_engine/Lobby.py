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

from game_engine.Ball import Ball
from game_engine.Vector import Vector

class Lobby():
	def __init__(self, gameServer):
		self.gameServer = gameServer
		self.lobby_id = len(self.gameServer.lobbys)

		self.clients = []
		self.clientsPerLobby = 2

		self.ball = Ball(self, 0.15)
		self.walls = []

	async def update(self):
		await self.ball.update()

	def receive(self, data):
		if (data["walls"]):
			self.walls = data["walls"]

	async def addClient(self, player):
		self.clients.append(player)

		await player.sendData("modify", {"scene.server.lobby_id": self.lobby_id,
								   		"scene.server.client_id": player.client_id})
		if (player.client_id == 0):
			await player.sendData("call", {"command": "scene.initConnection", "args": []})

		print("clients in lobby: ", len(self.clients))
		if (len(self.clients) == self.clientsPerLobby):
			self.ball.vel = Vector(1.2, 0, 1.2)

			for c in self.clients:
				await self.ball.updateBall()
				await c.sendData("game_status", "START")

	def removeClient(self, client):
		self.clients.remove(client)

	async def sendData(self, *args):
		for c in self.clients:
			await c.sendData(*args)