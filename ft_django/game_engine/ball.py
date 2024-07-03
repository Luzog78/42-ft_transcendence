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

class Ball:
	def __init__(self, lobby, radius, id):
		self.lobby: 	Lobby	= lobby
		self.radius: 	int		= radius

		self.terminal_velocity: float = 8
		self.current_vel_length: float = 0

		self.pos: Vector = Vector(0, 0)
		self.vel: Vector = Vector(0, 0)
		self.acc: Vector = Vector(0, 0)

		self.last_player: Player = None

		self.id: int = id

	@staticmethod
	def closestPointOnSegment(A:Vector, B:Vector, P:Vector) -> Vector:
		AB = B - A
		AP = P - A

		AB_squared = AB.dot(AB)
		if (AB_squared == 0):
			return A

		t = (AP.dot(AB)) / AB_squared
		t = max(0, min(1, t))

		return A + AB * t

	@staticmethod
	def getBallSpeed(player_number:int) -> Vector:
		if (player_number == 2):
			direction = Vector(0.5,0.5)
		else:
			direction = Vector(random.uniform(0,1) - 0.5, random.uniform(0,1) - 0.5)
		direction.setLength(math.sqrt(player_number) * 0.8 * 2)

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
		if (self.acc.length() > 0.5 and "wall" in wallname):
			self.acc = Vector(0, 0)
			self.vel.setLength(self.current_vel_length - 0.25)

		if ("player" not in wallname):
			return

		player = self.lobby.clients[int(wallname.replace("player", ""))]
		player_space = player.keyboard[" "] if " " in player.keyboard else False

		angle = 0
		if (player.isUp() and player_space):
			angle = -67.5
		elif (player.isDown() and player_space):
			angle = 67.5
		else:
			return
		if (self.lobby.clients_per_lobby == 2):
			angle = 67.5

		rotated_vel = math.radians(angle)
		direction = collision_normal.rotate(rotated_vel)
		self.vel = direction
		self.vel.setLength(self.current_vel_length + 0.1)

		rotated_acc = math.radians(-angle)
		direction = collision_normal.rotate(rotated_acc)
		self.acc = direction
		self.acc.setLength(self.vel.length() * 2)


	async def applyCollision(self, wall_name:str, predicted_ball_pos:Vector, closest_point:Vector, distance:float):
		collision_normal = (predicted_ball_pos - closest_point).normalize()

		self.resolutionCollision(collision_normal, distance)
		self.ballEffect(wall_name, collision_normal)

		await self.updateBall()
		await self.lobby.sendData("call", {"command": f'scene.balls[{self.id}].effectCollision',
											"args": ["'" + wall_name + "'", closest_point.json(), collision_normal.json()]})

	async def checkCollision(self):
		walls_copy = self.lobby.walls.copy()
		for wall_name in walls_copy:
			wall = walls_copy[wall_name]

			predicted_ball_pos = self.pos + self.vel * self.lobby.game_server.dt
			closest_point = Ball.closestPointOnSegment(wall[0], wall[1], predicted_ball_pos)
			distance = closest_point.distance(predicted_ball_pos)

			if (distance <= self.radius):
				if ("score" in wall_name):
					player_name = wall_name.replace("score", "player")
					await self.lobby.playerDied(self, player_name)
					break
				if ("player" in wall_name):
					player = self.lobby.clients[int(wall_name.replace("player", ""))]
					player.rebounces += 1
					player.ultimate_speed = self.vel.length()
					self.last_player = player

				await self.applyCollision(wall_name, predicted_ball_pos, closest_point, distance)

	async def update(self):
		self.pos += self.vel * self.lobby.game_server.dt
		self.vel += self.acc * self.lobby.game_server.dt

		self.acc *= 0.18729769509073987 ** self.lobby.game_server.dt

		await self.checkCollision()

		if (self.vel.length() > self.terminal_velocity):
			self.vel.setLength(self.terminal_velocity)
