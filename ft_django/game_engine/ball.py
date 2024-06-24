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

import time
import math

from .vector import Vector


class Ball:
	def __init__(self, lobby, radius):
		self.lobby = lobby
		self.radius = radius

		self.terminal_velocity = 8
		self.current_vel_length = 0

		self.time = 0

		self.pos = Vector(0, 0)
		self.vel = Vector(0, 0)
		self.acc = Vector(0, 0)

	@staticmethod
	def closestPointOnSegment(A, B, P):
		AB = B - A
		AP = P - A

		AB_squared = AB.dot(AB)
		if (AB_squared == 0):
			return A

		t = (AP.dot(AB)) / AB_squared
		t = max(0, min(1, t))

		return A + AB * t

	async def updateBall(self):
		await self.lobby.sendData("modify", {"scene.ball.sphere.position.x": self.pos.x,
									   		"scene.ball.sphere.position.z": self.pos.y})
		await self.lobby.sendData("modify", {"scene.ball.vel.x": self.vel.x,
									   		"scene.ball.vel.z": self.vel.y})
		await self.lobby.sendData("modify", {"scene.ball.acc.x": self.acc.x,
									   		"scene.ball.acc.z": self.acc.y})

	def resolutionCollision(self, collision_normal, minDistance):
		penetration_depth = self.radius - minDistance
		new_circle_pos = self.pos + collision_normal * penetration_depth

		self.pos = new_circle_pos

		self.vel = self.vel.reflect(collision_normal)
		self.vel.setLength(self.vel.length() + 0.1)

		self.current_vel_length = self.vel.length()

	def ballEffect(self, wallname, collision_normal):
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
			

	async def checkCollision(self):
		for wall_name in self.lobby.walls:
			wall = self.lobby.walls[wall_name]
			

			predicted_ball_pos = self.pos + self.vel * self.lobby.gameServer.dt
			closest_point = Ball.closestPointOnSegment(wall[0], wall[1], predicted_ball_pos)
			distance = closest_point.distance(predicted_ball_pos)

			if (distance <= self.radius):
				if ("score" in wall_name):
					player_name = wall_name.replace("score", "player")
					await self.lobby.playerDied(player_name)
					
					break
					

				collision_normal = (predicted_ball_pos - closest_point).normalize()

				self.resolutionCollision(collision_normal, distance)
				self.ballEffect(wall_name, collision_normal)

				await self.updateBall()
				await self.lobby.sendData("call", {"command": 'scene.ball.effectCollision',
									   				"args": ["'" + wall_name + "'", closest_point.json(), collision_normal.json()]})

	async def update(self):
		if (self.time == 0):
			self.time = time.time()
			return

		dt = time.time() - self.time
		self.time = time.time()

		self.pos += self.vel * dt
		self.vel += self.acc * dt

		self.acc *= 0.18729769509073987 ** dt

		await self.checkCollision()

		if (self.vel.length() > self.terminal_velocity):
			self.vel.setLength(self.terminal_velocity)
