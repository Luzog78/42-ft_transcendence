# **************************************************************************** #
#                                                                              #
#                                                         :::      ::::::::    #
#    Ball.py                                            :+:      :+:    :+:    #
#                                                     +:+ +:+         +:+      #
#    By: marvin <marvin@student.42.fr>              +#+  +:+       +#+         #
#                                                 +#+#+#+#+#+   +#+            #
#    Created: 2024/06/15 14:40:36 by marvin            #+#    #+#              #
#    Updated: 2024/06/15 14:40:36 by marvin           ###   ########.fr        #
#                                                                              #
# **************************************************************************** #

import math
import random

from .vector import Vector
from .player import Player
from .bot import Bot
from .raytrace import RayTrace


class Ball:
	def __init__(self, lobby, radius, id):
		from .lobby import Lobby
		self.lobby:		Lobby	= lobby
		self.radius:	int		= radius

		self.terminal_velocity:		float = 8
		self.current_vel_length:	float = 0

		self.pos: 		Vector = Vector(0, 0)
		self.vel: 		Vector = Vector(0, 0)
		self.acc: 		Vector = Vector(0, 0)

		self.last_player: Player | Bot | None = None

		self.id: int = id

	@staticmethod
	def getBallSpeed(player_number:int, ball_modifier: float) -> Vector:
		if player_number == 2:
			angle = random.uniform(90 + 45, 90 - 45)
			angle *= random.choice([-1, 1])
			direction = Vector(math.cos(math.radians(angle)), math.sin(math.radians(angle)))
		else:
			direction = Vector(random.uniform(0,1) - 0.5, random.uniform(0,1) - 0.5)
		direction.setLength(math.sqrt(player_number) * 0.8 * (ball_modifier + 1))
		
		return direction

	async def updateBall(self):
		await self.lobby.sendData("modify", {f"scene.balls[{self.id}].sphere.position.x": self.pos.x,
											f"scene.balls[{self.id}].sphere.position.z": self.pos.y})
		await self.lobby.sendData("modify", {f"scene.balls[{self.id}].vel.x": self.vel.x,
											f"scene.balls[{self.id}].vel.z": self.vel.y})
		await self.lobby.sendData("modify", {f"scene.balls[{self.id}].acc.x": self.acc.x,
											f"scene.balls[{self.id}].acc.z": self.acc.y})

	def resolutionCollision(self, collision_normal:Vector, minDistance:float):
		penetration_depth = self.radius - minDistance
		new_circle_pos = self.pos + collision_normal * penetration_depth

		self.pos = new_circle_pos

		self.vel = self.vel.reflect(collision_normal)
		self.vel.setLength(self.vel.length() + 0.1)

		self.current_vel_length = self.vel.length()

	def ballEffect(self, wallname:str, collision_normal:Vector):
		if self.acc.length() > 0.5 and "wall" in wallname:
			self.acc = Vector(0, 0)
			self.vel.setLength(self.current_vel_length - 0.25)

		if "player" not in wallname:
			return

		player = self.lobby.clients[int(wallname.replace("player", ""))]
		if not isinstance(player, Player):
			return

		player_space = player.keyboard[" "] if " " in player.keyboard else False

		angle = 0
		if player.isUp() and player_space:
			angle = -67.5
		elif player.isDown() and player_space:
			angle = 67.5
		else:
			return
		if self.lobby.clients_per_lobby == 2:
			angle = 67.5

		rotated_vel = math.radians(angle)
		direction = collision_normal.rotate(rotated_vel)
		self.vel = direction
		self.vel.setLength(self.current_vel_length + 0.1)

		rotated_acc = math.radians(-angle)
		direction = collision_normal.rotate(rotated_acc)
		self.acc = direction
		self.acc.setLength(self.vel.length() * 2)


	async def applyCollision(self, wall_name:str, closest_point:Vector, distance:float):
		wall = self.lobby.walls[wall_name]
		wall_normal = Vector(-(wall[1].y - wall[0].y), wall[1].x - wall[0].x).normalize()

		self.resolutionCollision(wall_normal, distance)
		self.ballEffect(wall_name, wall_normal)

		await self.updateBall()
		await self.lobby.sendData("call", {"command": f'scene.balls[{self.id}].effectCollision',
											"args": ["'" + wall_name + "'", closest_point.json(), wall_normal.json()]})

	async def checkCollision(self):
		walls_copy = self.lobby.walls.copy()

		trace = RayTrace(self.pos, self.vel.normalize())
		intersection = trace.intersects(walls_copy)

		for wall_name in intersection:
			intersection_point = intersection[wall_name]

			predicted_pos = self.pos + self.vel * self.lobby.game_server.dt * 3

			max_distance = self.pos.distance(predicted_pos)
			current_distance = predicted_pos.distance(intersection_point)

			if current_distance <= max_distance:

				if "score" in wall_name:
					player_name = wall_name.replace("score", "player")
					await self.lobby.playerDied(self, player_name)
					break

				if "player" in wall_name:
					player_id = int(wall_name.replace("player", ""))
					if player_id >= len(self.lobby.clients):
						return

					player = self.lobby.clients[player_id]
					player.rebounces += 1
					if (self.vel.length() > player.ultimate_speed):
						player.ultimate_speed = self.vel.length()
					
					self.last_player = player

				await self.applyCollision(wall_name, intersection_point, current_distance)

	async def checkOutOfBounds(self):
		map_radius = math.sqrt(self.lobby.clients_per_lobby) * 2 + 2
		if self.pos.length() > map_radius:
			self.pos = Vector(0, 0)
			await self.updateBall()

	async def update(self):
		self.pos += self.vel * self.lobby.game_server.dt
		self.vel += self.acc * self.lobby.game_server.dt

		self.acc *= 0.18729769509073987 ** self.lobby.game_server.dt

		await self.checkCollision()
		await self.checkOutOfBounds()		

		# if self.vel.length() > self.terminal_velocity:
			# self.vel.setLength(self.terminal_velocity)
