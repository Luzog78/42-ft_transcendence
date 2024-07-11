# **************************************************************************** #
#                                                                              #
#                                                         :::      ::::::::    #
#    spectator.py                                       :+:      :+:    :+:    #
#                                                     +:+ +:+         +:+      #
#    By: ysabik <ysabik@student.42.fr>              +#+  +:+       +#+         #
#                                                 +#+#+#+#+#+   +#+            #
#    Created: 2024/07/09 15:11:13 by ycontre           #+#    #+#              #
#    Updated: 2024/07/11 23:09:43 by ysabik           ###   ########.fr        #
#                                                                              #
# **************************************************************************** #

class Spectator:
	def __init__(self, lobby, client, client_id: int) -> None:
		from .lobby import Lobby
		from ft_django.pong_socket import PongSocket

		self.lobby:		Lobby 		=	lobby
		self.client:	PongSocket	=	client
		self.client_id:	int			=	client_id

		self.keyboard: dict = {}

	async def initSpectator(self):
		await self.sendData("modify", {"scene.server.lobby_id": self.lobby.lobby_id,
										"scene.server.client_id": self.client_id})
		await self.sendData("call", {"command": "scene.initSpectator",
									"args": [self.lobby.clients_per_lobby, f"'{self.lobby.game_mode}'"]}) # TODO: theme

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
