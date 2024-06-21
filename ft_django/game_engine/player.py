# **************************************************************************** #
#                                                                              #
#                                                         :::      ::::::::    #
#    Player.py                                          :+:      :+:    :+:    #
#                                                     +:+ +:+         +:+      #
#    By: marvin <marvin@student.42.fr>              +#+  +:+       +#+         #
#                                                 +#+#+#+#+#+   +#+            #
#    Created: 2024/06/15 14:50:56 by marvin            #+#    #+#              #
#    Updated: 2024/06/15 14:50:56 by marvin           ###   ########.fr        #
#                                                                              #
# **************************************************************************** #

import math

from .vector import Vector

class Player:
	def __init__(self, lobby, client, client_id):
		self.lobby = lobby
		self.client = client

		self.client_id = client_id

		self.angle = 0
		self.pos = Vector(0, 0)

		self.keyboard = {}

	async def addSelfWall(self):
		if (self.lobby.clients_per_lobby == 2):
			vertex = self.lobby.walls["player" + str(self.client_id)]
			middle = (vertex[0] + vertex[1]) / 2
			self.pos = middle

			return

		mid = self.lobby.middleVertexPositions[self.client_id]
		angle = self.lobby.angleVertex[self.client_id]

		self.angle = angle
		self.pos = mid

		firstPoint = Vector(mid.x + math.cos(angle) * self.lobby.player_size, mid.y + math.sin(angle) * self.lobby.player_size)
		secondPoint = Vector(mid.x + math.cos(angle - math.pi) * self.lobby.player_size, mid.y + math.sin(angle - math.pi) * self.lobby.player_size)

		self.lobby.walls["player" + str(self.client_id)] = [firstPoint, secondPoint]
		await self.sendToOther("call", {"command": "newPlayer", "args": ["player" + str(self.client_id)]})

	async def move(self, x, y):
		player_vertex = self.lobby.walls["player" + str(self.client_id)]

		rotate_pos = Vector(math.cos(self.angle) * x, math.sin(self.angle) * y)

		for i in range(len(player_vertex)):
			player_vertex[i] += rotate_pos
		self.pos += rotate_pos

		playerBoxJS = "scene.get('player" + str(self.client_id) + "').player"
		await self.sendToOther("modify", {f"{playerBoxJS}.position.x": self.pos.x,
		  							f"{playerBoxJS}.position.z": self.pos.y})

	async def update(self):
		if (len(self.lobby.walls) == 0):
			return

		if (any([key in "ws" for key in self.keyboard.keys() if self.keyboard[key] == True])):
			if ("w" in self.keyboard and self.keyboard["w"] == True):
				await self.move(-1.2 * self.lobby.gameServer.dt, -1.2 * self.lobby.gameServer.dt)
			elif ("s" in self.keyboard and self.keyboard["s"] == True):
				await self.move(1.2 * self.lobby.gameServer.dt, 1.2 * self.lobby.gameServer.dt)

	async def sendData(self, *args):
		await self.client.sendData(*args)

	async def sendToOther(self, *args):
		await self.lobby.sendToOther(self, *args)
