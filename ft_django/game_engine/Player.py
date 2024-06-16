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

from game_engine.Vector import Vector

class Player():
	def __init__(self, lobby, client, client_id):
		self.lobby = lobby
		self.client = client

		self.client_id = client_id

		self.pos = Vector(0, 0, 0)
		
		self.keyboard = {}

	def calculatePos(self):
		playerBox = self.lobby.walls["player" + str(self.client_id) + "box"]
		playerBoxCenter = Vector(0, 0, 0)

		for point in playerBox:
			playerBoxCenter += Vector(point["x"], 0, point["y"])

		playerBoxCenter /= len(playerBox)
		self.pos = playerBoxCenter

	async def move(self, x, y):
		playerBox = self.lobby.walls["player" + str(self.client_id) + "box"]

		for point in playerBox:
			point["x"] += x
			point["y"] += y
		
		self.pos += Vector(x, 0, y)

		playerBoxJS = "scene.get('player" + str(self.client_id) + "').player"

		await self.lobby.sendToOther(self, "modify", 
									{f"{playerBoxJS}.position.x": self.pos.x,
		  							f"{playerBoxJS}.position.z": self.pos.z})

	async def update(self):
		if (len(self.lobby.walls) == 0):
			return
		
		if (any([key in "ws" for key in self.keyboard.keys() if self.keyboard[key] == True])):
			if ("w" in self.keyboard and self.keyboard["w"] == True):
				await self.move(-1.2 * self.lobby.gameServer.dt, 0)
			elif ("s" in self.keyboard and self.keyboard["s"] == True):
				await self.move(1.2 * self.lobby.gameServer.dt, 0)
	
	async def sendData(self, *args):
		await self.client.sendData(*args)