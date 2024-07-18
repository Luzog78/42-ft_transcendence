# **************************************************************************** #
#                                                                              #
#                                                         :::      ::::::::    #
#    bot.py                                             :+:      :+:    :+:    #
#                                                     +:+ +:+         +:+      #
#    By: ycontre <ycontre@student.42.fr>            +#+  +:+       +#+         #
#                                                 +#+#+#+#+#+   +#+            #
#    Created: 2024/07/18 12:37:57 by ycontre           #+#    #+#              #
#    Updated: 2024/07/18 18:18:02 by ycontre          ###   ########.fr        #
#                                                                              #
# **************************************************************************** #

import math
import datetime
from .vector import Vector

class Bot:
	def __init__(self, lobby, client_id: int):
		from .lobby import Lobby
		assert isinstance(lobby, Lobby)

		self.lobby:		Lobby		= lobby
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

		self.tps = 10
		self.time_to_think = 0
		self.direction = 0

	def die(self):
		self.deaths += 1
		self.duration = datetime.datetime.timestamp(datetime.datetime.now()) - self.lobby.start_time

	async def initBot(self):
		start_time = self.lobby.start_time
		if (start_time == 0):
			start_time = datetime.datetime.timestamp(datetime.datetime.now())
		limit = self.lobby.limit
		if (limit is None):
			limit = 0

		self.addSelfWall()
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
		await self.sendToOther("call", {"command": "scene.server.newPlayer",
										"args": [f"'player{self.client_id}'", f"'Bot_{self.client_id}'"]})
		await self.sendToOther("call", {"command": 'incrementWaitingPlayerCount', "args": []})

	async def move(self, x: float, y: float):
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
				return


		for i in range(len(player_vertex)):
			player_vertex[i] += rotate_pos
		self.pos = computed_pos

		playerBoxJS = "scene.get('player" + str(self.client_id) + "').player"
		await self.sendToOther("modify", {f"{playerBoxJS}.position.x": self.pos.x,
									f"{playerBoxJS}.position.z": self.pos.y})

	async def thinkMove(self):
		my_pos = Vector(0,0) - self.pos
		ball_pos = self.lobby.balls[0].pos - self.pos 
		
		self.direction = 0

	async def update(self):
		if (len(self.lobby.walls) == 0):
			return

		self.time_to_think += 1
		if (self.time_to_think > self.tps):
			self.time_to_think = 0

		await self.thinkMove()

		move_speed = self.speed * self.lobby.game_server.dt * (self.lobby.player_size * 2)
		if (self.direction < 0):
			await self.move(move_speed, move_speed)
		elif(self.direction > 0):
			await self.move(-move_speed, -move_speed)

	async def sendToOther(self, *args):
		await self.lobby.sendToOther(self, *args)
