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
		self.init_pos = Vector(0, 0)
		self.speed = 1.2

		self.keyboard = {}

	async def initConnection(self):
		self.addSelfWall()

		await self.sendData("modify", {"scene.server.lobby_id": self.lobby.lobby_id,
										"scene.server.client_id": self.client_id})
		await self.sendData("call", {"command": "scene.initConnection", "args": [self.lobby.clients_per_lobby]})
		await self.updateSelfToother()

	def addSelfWall(self):
		if (self.lobby.clients_per_lobby == 2):
			vertex = self.lobby.walls["player" + str(self.client_id)]
			middle = (vertex[0] + vertex[1]) / 2
			self.pos = middle
			self.init_pos = middle
			self.angle = 0

			return

		mid = self.lobby.middle_vertex_positions[self.client_id]
		angle = self.lobby.angleVertex[self.client_id]

		self.angle = angle
		self.pos = mid

		firstPoint = Vector(mid.x + math.cos(angle) * self.lobby.player_size, mid.y + math.sin(angle) * self.lobby.player_size)
		secondPoint = Vector(mid.x + math.cos(angle - math.pi) * self.lobby.player_size, mid.y + math.sin(angle - math.pi) * self.lobby.player_size)

		self.lobby.walls["player" + str(self.client_id)] = [firstPoint, secondPoint]



	async def updateSelfToother(self):
		my_player_name = f"'name{self.client_id}'" #get name from DB
		await self.sendToOther("call", {"command": "scene.server.newPlayer",
								  		"args": ["'player" + str(self.client_id) + "'", my_player_name]})

		for i in range(self.client_id):
			player = self.lobby.clients[i]
			player_name = "'" + "name" + str(i) + "'" #get name from DB
			await self.sendData("call", {"command": "scene.server.newPlayer",
									"args": ["'player" + str(i) + "'", player_name]})

	async def move(self, x, y):
		player_vertex = self.lobby.walls["player" + str(self.client_id)]
		rotate_pos = Vector(math.cos(self.angle) * x, math.sin(self.angle) * y)

		computed_pos = self.pos + rotate_pos
		if (self.lobby.clients_per_lobby != 2):
			distance = computed_pos.distance(self.lobby.middle_vertex_positions[self.client_id])
			if (distance > self.lobby.segment_size / 2 - self.lobby.player_size):
				return
		else:
			distance = computed_pos.distance(self.init_pos)
			if (distance > self.lobby.segment_size / 2 - self.lobby.player_size):
				print("distance too big", distance, self.lobby.segment_size / 2 - self.lobby.player_size)
				return


		for i in range(len(player_vertex)):
			player_vertex[i] += rotate_pos
		self.pos = computed_pos

		playerBoxJS = "scene.get('player" + str(self.client_id) + "').player"
		await self.sendToOther("modify", {f"{playerBoxJS}.position.x": self.pos.x,
		  							f"{playerBoxJS}.position.z": self.pos.y})

	async def update(self):
		if (len(self.lobby.walls) == 0):
			return

		move_speed = self.speed * self.lobby.gameServer.dt * (self.lobby.player_size * 2)
		if (self.isUp()):
			await self.move(-move_speed, -move_speed)
		elif (self.isDown()):
			await self.move(move_speed, move_speed)

	def isUp(self):
		keys = ["w", "ArrowLeft"]
		for key in keys:
			if key in self.keyboard and self.keyboard[key] == True:
				return True
		return False

	def isDown(self):
		keys = ["s", "ArrowRight"]
		for key in keys:
			if key in self.keyboard and self.keyboard[key] == True:
				return True
		return False

	async def sendData(self, *args):
		await self.client.sendData(*args)

	async def sendToOther(self, *args):
		await self.lobby.sendToOther(self, *args)
