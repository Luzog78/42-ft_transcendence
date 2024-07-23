# **************************************************************************** #
#                                                                              #
#                                                         :::      ::::::::    #
#    bot.py                                             :+:      :+:    :+:    #
#                                                     +:+ +:+         +:+      #
#    By: ysabik <ysabik@student.42.fr>              +#+  +:+       +#+         #
#                                                 +#+#+#+#+#+   +#+            #
#    Created: 2024/07/18 12:37:57 by ycontre           #+#    #+#              #
#    Updated: 2024/07/23 12:52:05 by ysabik           ###   ########.fr        #
#                                                                              #
# **************************************************************************** #

import math
import datetime
from .vector import Vector
from .raytrace import RayTrace


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

		self.start_time: float	= -1

		self.tps = 50
		self.time_to_think = 0

		self.last_prediction: dict | None = None

	def die(self):
		self.deaths += 1
		self.duration = datetime.datetime.timestamp(datetime.datetime.now()) - self.lobby.start_time

	async def initBot(self):
		start_time = self.lobby.start_time
		if start_time == 0:
			start_time = datetime.datetime.timestamp(datetime.datetime.now())
		limit = self.lobby.limit
		if limit is None:
			limit = 0

		self.time_to_think = 0
		self.last_prediction = None

		self.addSelfWall()
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
		self.init_pos = mid

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

	async def thinkMove(self):
		ball = self.lobby.balls[0]

		ray = RayTrace(ball.pos, ball.vel.normalize())
		closest_wall = None

		bot_predictions = 2
		for i in range(bot_predictions):
			intersections = ray.intersects(self.lobby.walls)
			if len(intersections) == 0:
				return

			closest_wall = list(intersections.keys())[0]
			wall = self.lobby.walls[closest_wall]

			closest_point = intersections[closest_wall]
			wall_normal = Vector(-(wall[1].y - wall[0].y), wall[1].x - wall[0].x).normalize()

			ray.direction = ray.direction.reflect(wall_normal)
			ray.pos = closest_point + ray.direction * 0.1

			if i == 0 and (closest_wall == f"player{self.client_id}" or closest_wall == f"score{self.client_id}"):
				break

		self.last_prediction = {'pos': ray.pos, 'wall': closest_wall}

		self.lobby.balls[1].pos = ray.pos
		await self.lobby.balls[1].updateBall()

	def calculDirection(self) -> float | None:
		if self.last_prediction is None:
			return

		pos_to_center = Vector(0,0) - self.pos
		pos_to_prediction = self.last_prediction["pos"] - self.pos

		if "wall" in self.last_prediction["wall"] or str(self.client_id) not in self.last_prediction["wall"]:
			pos_to_prediction = self.init_pos - self.pos

		if pos_to_prediction.length() < 0.1:
			return 0

		cross = pos_to_center.x * pos_to_prediction.y - pos_to_center.y * pos_to_prediction.x
		if self.lobby.clients_per_lobby == 2 and self.client_id == 1:
			cross *= -1

		return cross


	async def update(self):
		if len(self.lobby.walls) == 0:
			return

		self.time_to_think += 1
		if self.time_to_think > self.tps:
			self.time_to_think = 0
			await self.thinkMove()

		if self.last_prediction is None:
			return

		direction = self.calculDirection()
		if direction is None:
			return

		move_speed = self.speed * self.lobby.game_server.dt * (self.lobby.player_size * 2)
		if direction > 0:
			await self.move(move_speed, move_speed)
		elif(direction < 0):
			await self.move(-move_speed, -move_speed)

	async def sendToOther(self, *args):
		await self.lobby.sendToOther(self, *args)
