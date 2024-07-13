# **************************************************************************** #
#                                                                              #
#                                                         :::      ::::::::    #
#    spectator.py                                       :+:      :+:    :+:    #
#                                                     +:+ +:+         +:+      #
#    By: ycontre <ycontre@student.42.fr>            +#+  +:+       +#+         #
#                                                 +#+#+#+#+#+   +#+            #
#    Created: 2024/07/09 15:11:13 by ycontre           #+#    #+#              #
#    Updated: 2024/07/13 19:16:17 by ycontre          ###   ########.fr        #
#                                                                              #
# **************************************************************************** #

import datetime

class Spectator:
	def __init__(self, lobby, client, client_id: int) -> None:
		from .lobby import Lobby
		from ft_django.pong_socket import PongSocket

		self.lobby:		Lobby 		=	lobby
		self.client:	PongSocket	=	client
		self.client_id:	int			=	client_id

		self.keyboard: dict = {}

	async def initSpectator(self):
		start_time = self.lobby.start_time
		if (start_time == 0):
			start_time = datetime.datetime.timestamp(datetime.datetime.now())

		await self.sendData("modify", {"scene.server.lobby_id": self.lobby.lobby_id,
										"scene.server.client_id": self.client_id})
		await self.sendData("call", {"command": "scene.initSpectator",
									"args": [self.lobby.clients_per_lobby, f"'{self.lobby.game_mode}'",
				  							self.lobby.limit - (datetime.datetime.timestamp(datetime.datetime.now()) - start_time)]}) # TODO: theme

		for i in range(self.lobby.clients_per_lobby):
			player = self.lobby.clients[i]
			await self.sendData("call", {"command": "scene.server.newPlayer",
									"args": [f"'player{i}'", f"'{player.client.username}'"]})

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

	async def update(self):
		if (self.isUp()):
			pass
		if (self.isDown()):
			pass
	async def sendData(self, *args):
		await self.client.sendData(*args)
