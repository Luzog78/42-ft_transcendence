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

from game_engine.Vector import Vector

class Player():
	def __init__(self, lobby, client, client_id):
		self.lobby = lobby
		self.client = client

		self.client_id = client_id

		self.angle = 0
		self.pos = Vector(0, 0, 0)

		self.keyboard = {}

	async def addSelfWall(self):
		if (self.lobby.clientsPerLobby == 2):
			vertex = self.lobby.walls["player" + str(self.client_id)]
			middle = Vector((vertex[0]["x"] + vertex[1]["x"]) / 2, 0, (vertex[0]["y"] + vertex[1]["y"]) / 2)
			self.pos = middle
			
			return

		mid = self.lobby.middleVertexPositions[self.client_id]
		angle = self.lobby.angleVertex[self.client_id]

		self.angle = angle
		self.pos = mid

		playerSize = 0.5
		playerForward = -0.075

		firstPoint = Vector(mid.x + math.cos(angle) * playerSize, 0, mid.z + math.sin(angle) * playerSize)
		secondPoint = Vector(mid.x + math.cos(angle - math.pi) * playerSize, 0, mid.z + math.sin(angle - math.pi) * playerSize)
		
		angleForward = angle + math.pi / 2
		firstPoint.x += math.cos(angleForward) * playerForward
		firstPoint.z += math.sin(angleForward) * playerForward
		secondPoint.x += math.cos(angleForward) * playerForward
		secondPoint.z += math.sin(angleForward) * playerForward

		self.lobby.walls["player" + str(self.client_id)] = [{"x": firstPoint.x, "y": firstPoint.z},
								  {"x": secondPoint.x, "y": secondPoint.z}]
		await self.sendToOther("call", {"command": "newPlayer", "args": ["player" + str(self.client_id)]})

	async def move(self, x, y):
		playerBox = self.lobby.walls["player" + str(self.client_id)]

		rotate_x = math.cos(self.angle) * x
		rotate_y = math.sin(self.angle) * y

		for point in playerBox:
			point["x"] += rotate_x
			point["y"] += rotate_y

		self.pos += Vector(rotate_x, 0, rotate_y)

		playerBoxJS = "scene.get('player" + str(self.client_id) + "').player"
		await self.sendToOther("modify", {f"{playerBoxJS}.position.x": self.pos.x,
		  							f"{playerBoxJS}.position.z": self.pos.z})

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