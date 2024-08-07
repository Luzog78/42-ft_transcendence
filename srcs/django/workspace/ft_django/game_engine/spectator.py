# **************************************************************************** #
#                                                                              #
#                                                         :::      ::::::::    #
#    spectator.py                                       :+:      :+:    :+:    #
#                                                     +:+ +:+         +:+      #
#    By: ysabik <ysabik@student.42.fr>              +#+  +:+       +#+         #
#                                                 +#+#+#+#+#+   +#+            #
#    Created: 2024/07/09 15:11:13 by ycontre           #+#    #+#              #
#    Updated: 2024/07/26 09:07:31 by ysabik           ###   ########.fr        #
#                                                                              #
# **************************************************************************** #

from datetime import datetime

from .player import Player


class Spectator:
	def __init__(self, lobby, client, client_id: int) -> None:
		from .lobby import Lobby
		from ft_django.pong_socket import PongSocket

		self.lobby:		Lobby 		=	lobby
		self.client:	PongSocket	=	client
		self.client_id:	int			=	client_id

		self.start_time: float	= -1

	async def initSpectator(self):
		start_time = self.lobby.start_time
		if start_time == 0:
			start_time = datetime.timestamp(datetime.now())
		limit = self.lobby.limit
		if limit is None:
			limit = 0

		await self.sendData("modify", {"scene.server.lobby_id": self.lobby.lobby_id,
										"scene.server.client_id": self.client_id})
		await self.sendData("call", {"command": "scene.initSpectator",
									"args": [self.lobby.clients_per_lobby, self.lobby.theme, f"'{self.lobby.game_mode}'",
											limit - (datetime.timestamp(datetime.now()) - start_time)]})

		for i in range(len(self.lobby.clients)):
			player = self.lobby.clients[i]
			username = ""
			if isinstance(player, Player):
				username = player.client.username
			else:
				username = player.username
			await self.sendData("call", {"command": "scene.server.newPlayer",
									"args": [f"'player{i}'", f"'{username}'", [player.pos.x, player.pos.y]]})

		await self.sendData("game_status", "START")

	async def sendData(self, *args):
		await self.client.sendData(*args)
