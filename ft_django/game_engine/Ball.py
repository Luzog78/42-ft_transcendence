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

class Ball():
	def __init__(self, lobby, radius):
		self.lobby = lobby
		self.radius = radius

		self.terminalVelocity = 8

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

	@staticmethod
	def closestPointOnRectangle(rectangle, point):
		closestPoint = None
		minDistance = math.inf

		for i in range(len(rectangle)):
			j = (i + 1) % len(rectangle)
			segmentClosestPoint = Ball.closestPointOnSegment(rectangle[i], rectangle[j], point)
			distance = math.hypot(segmentClosestPoint["x"] - point.x, segmentClosestPoint["y"] - point.z)

			if (distance < minDistance):
				minDistance = distance
				closestPoint = segmentClosestPoint

		return ( closestPoint, minDistance )

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
		
		# //prevent going to fast curved ball
		# if (this.acc.length() > 0.5 && wallname.includes("wall"))
		# {
		# 	this.acc = new THREE.Vector3(0, 0, 0);
		# 	this.vel.setLength(this.currentVelLength - 0.25);
		# }

		self.vel = self.vel.reflect(Vector(collisionNormal["x"], 0, collisionNormal["y"]))
		self.vel.setLength(self.vel.length() + 0.1)


		# this.effectCollision(scene, wallname, 
		# 	new THREE.Vector3(newCircleCenter.x, 0.25, newCircleCenter.y),
		# 	new THREE.Vector3(collisionNormal.x, 0, collisionNormal.y),);

		# this.currentVelLength = this.vel.length();

	async def checkCollision(self):
		for wall in self.lobby.walls:
			rectangle = self.lobby.walls[wall]
			sphere = self.pos

			closestPoint, minDistance = Ball.closestPointOnRectangle(rectangle, sphere)
			collision = minDistance <= self.radius
			
			if (collision):
				collisionNormal = {
					"x": (self.pos.x - closestPoint["x"]) / minDistance,
					"y": (self.pos.z - closestPoint["y"]) / minDistance
				}

				self.resolutionCollision(collisionNormal, minDistance)

				await self.updateBall()
				await self.lobby.sendData("call", {"command": f'scene.ball.effectCollision',
									   				"args": ['"' + wall + '"', closestPoint, collisionNormal]})

	async def update(self):
		self.pos.x += self.vel.x * self.lobby.gameServer.dt
		self.pos.z += self.vel.z * self.lobby.gameServer.dt

		self.vel.x += self.acc.x * self.lobby.gameServer.dt
		self.vel.z += self.acc.z * self.lobby.gameServer.dt

		await self.checkCollision()

		if (self.vel.length() > self.terminalVelocity):
			self.vel.setLength(self.terminalVelocity)