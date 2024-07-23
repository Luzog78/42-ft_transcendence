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
from datetime import datetime

from .vector import Vector


class Player:

	def __init__(self, lobby, client, client_id: int):
		from .lobby import Lobby
		from ft_django.pong_socket import PongSocket
		assert isinstance(lobby, Lobby)
		assert isinstance(client, PongSocket)

		self.lobby:		Lobby		= lobby
		self.client:	PongSocket	= client

		self.client_id: int	= client_id

		self.angle:		float	= 0
		self.pos:		Vector	= Vector(0, 0)
		self.init_pos:	Vector	= Vector(0, 0)
		self.speed:		float	= 1.2

		self.kills:				int		= 0 #done
		self.deaths:			int		= 0 #done
		self.best_streak:		int		= 0 # TODO: streak
		self.rebounces:			int		= 0 #done
		self.duration:			float	= -1 #done
		self.ultimate_speed:	float	= 0 #done

		self.start_time: float	= -1
		self.keyboard: dict		= {}

	def die(self):
		self.deaths += 1
		self.duration = datetime.timestamp(datetime.now()) - self.lobby.start_time

	async def initPlayer(self):
		start_time = self.lobby.start_time
		if start_time == 0:
			start_time = datetime.timestamp(datetime.now())
		limit = self.lobby.limit
		if limit is None:
			limit = 0

		self.addSelfWall()
		await self.sendData("modify", {"scene.server.lobby_id": self.lobby.lobby_id,
										"scene.server.client_id": self.client_id})
		await self.sendData("call", {"command": "scene.initPlayer",
									"args": [self.lobby.clients_per_lobby, self.lobby.theme, f"'{self.lobby.game_mode}'",
				  							limit - (datetime.timestamp(datetime.now()) - start_time)]})
		await self.updateSelfToother()

	def addSelfWall(self):
		if self.lobby.clients_per_lobby == 2:
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
		await self.sendToOther("call", {"command": "scene.server.newPlayer",
										"args": [f"'player{self.client_id}'", f"'{self.client.username}'"]})
		await self.sendToOther("call", {"command": 'incrementWaitingPlayerCount', "args": []})

		for i in range(self.client_id + 1):
			player = self.lobby.clients[i]
			await self.sendData("call", {"command": "scene.server.newPlayer",
									"args": [f"'player{i}'", f"'{player.client.username}'" if isinstance(player, Player) else f"'Bot_{i}'"]})
			await self.sendData("call", {"command": 'incrementWaitingPlayerCount', "args": []})

	async def move(self, x: float, y: float):
		player_vertex = self.lobby.walls["player" + str(self.client_id)]
		rotate_pos = Vector(math.cos(self.angle) * x, math.sin(self.angle) * y)

		computed_pos = self.pos + rotate_pos
		if self.lobby.clients_per_lobby != 2:
			distance = computed_pos.distance(self.lobby.middle_vertex_positions[self.client_id])
			if distance > self.lobby.segment_size / 2 - self.lobby.player_size:
				return
		else:
			distance = computed_pos.distance(self.init_pos)
			if distance > self.lobby.segment_size / 2 - self.lobby.player_size:
				return


		for i in range(len(player_vertex)):
			player_vertex[i] += rotate_pos
		self.pos = computed_pos

		playerBoxJS = "scene.get('player" + str(self.client_id) + "').player"
		await self.sendToOther("modify", {f"{playerBoxJS}.position.x": self.pos.x,
									f"{playerBoxJS}.position.z": self.pos.y})

	async def update(self):
		if len(self.lobby.walls) == 0:
			return

		move_speed = self.speed * self.lobby.game_server.dt * (self.lobby.player_size * 2)
		if self.isUp():
			await self.move(-move_speed, -move_speed)
		elif self.isDown():
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
