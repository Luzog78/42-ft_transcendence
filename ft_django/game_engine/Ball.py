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

from game_engine.Vector import Vector
import time

class Ball():
	def __init__(self, lobby, radius):
		self.lobby = lobby
		self.radius = radius

		self.terminalVelocity = 8
		self.currentVelLength = 0

		self.time = 0

		self.pos = Vector(0, 0, 0)
		self.vel = Vector(0, 0, 0)
		self.acc = Vector(0, 0, 0)

	@staticmethod
	def closestPointOnSegment(A, B, P):
		AB = { "x": B["x"] - A["x"], "y": B["y"] - A["y"] }
		AP = { "x": P.x - A["x"], "y": P.z - A["y"] }
		AB_squared = AB["x"] * AB["x"] + AB["y"] * AB["y"]

		if (AB_squared == 0):
			return A

		t = (AP["x"] * AB["x"] + AP["y"] * AB["y"]) / AB_squared
		t = max(0, min(1, t))

		return { "x": A["x"] + t * AB["x"], "y": A["y"] + t * AB["y"] }

	async def updateBall(self):
		await self.lobby.sendData("modify", {"scene.ball.sphere.position.x": self.pos.x,
									   		"scene.ball.sphere.position.z": self.pos.z})
		await self.lobby.sendData("modify", {"scene.ball.vel.x": self.vel.x,
									   		"scene.ball.vel.z": self.vel.z})
		await self.lobby.sendData("modify", {"scene.ball.acc.x": self.acc.x,
									   		"scene.ball.acc.z": self.acc.z})

	def resolutionCollision(self, collisionNormal, minDistance):
		penetrationDepth = (self.radius - minDistance)
		newCircleCenter = {
			"x": self.pos.x + penetrationDepth * collisionNormal["x"],
			"y": self.pos.z + penetrationDepth * collisionNormal["y"]
		}
		self.pos.x = newCircleCenter["x"]
		self.pos.z = newCircleCenter["y"]

		self.vel = self.vel.reflect(Vector(collisionNormal["x"], 0, collisionNormal["y"]))
		self.vel.setLength(self.vel.length() + 0.1)

		self.currentVelLength = self.vel.length()

	def ballEffect(self, wallname, normal):
		if (self.acc.length() > 0.5 and "wall" in wallname):
			self.acc = Vector(0, 0, 0)
			self.vel.setLength(self.currentVelLength - 0.25)

		if ("player" not in wallname):
			return

		player = self.lobby.clients[int(wallname.replace("player", "").replace("box", ""))]

		player_up = player.keyboard["w"] if "w" in player.keyboard else False
		player_down = player.keyboard["s"] if "s" in player.keyboard else False

		if (player_up):
			newVel = Vector(-1, 0, -0.5)
			newVel.setLength(self.vel.length() + 0.1)

			self.vel = newVel

			self.acc = Vector(1, 0, -0.5)
			self.acc.setLength(self.vel.length() * 2)

		elif (player_down):
			newVel = Vector(1, 0, -0.5)
			newVel.setLength(self.vel.length() + 0.1)

			self.vel = newVel

			self.acc = Vector(-1, 0, -0.5)
			self.acc.setLength(self.vel.length() * 2)

		if (player_up or player_down):
			self.vel.z *= 1 if normal["y"] < 0 else -1
			self.acc.z *= 1 if normal["y"] < 0 else -1
			

	async def checkCollision(self):
		for wallname in self.lobby.walls:
			wall = self.lobby.walls[wallname]

			segmentClosestPoint = Ball.closestPointOnSegment(wall[0], wall[1], self.pos)
			distance = math.hypot(segmentClosestPoint["x"] - self.pos.x, segmentClosestPoint["y"] - self.pos.z)
			collision = distance <= self.radius

			if (collision):
				collisionNormal = {
					"x": (self.pos.x - segmentClosestPoint["x"]) / distance,
					"y": (self.pos.z - segmentClosestPoint["y"]) / distance
				}

				self.resolutionCollision(collisionNormal, distance)
				self.ballEffect(wallname, collisionNormal)

				await self.updateBall()
				await self.lobby.sendData("call", {"command": 'scene.ball.effectCollision',
									   				"args": ["'" + wallname + "'", segmentClosestPoint, collisionNormal]})

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

		# if (self.vel.length() > self.terminalVelocity):
		# 	self.vel.setLength(self.terminalVelocity)