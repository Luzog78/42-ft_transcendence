# **************************************************************************** #
#                                                                              #
#                                                         :::      ::::::::    #
#    spectator.py                                       :+:      :+:    :+:    #
#                                                     +:+ +:+         +:+      #
#    By: ycontre <ycontre@student.42.fr>            +#+  +:+       +#+         #
#                                                 +#+#+#+#+#+   +#+            #
#    Created: 2024/07/09 15:11:13 by ycontre           #+#    #+#              #
#    Updated: 2024/07/09 15:28:57 by ycontre          ###   ########.fr        #
#                                                                              #
# **************************************************************************** #

class Spectator:
	def __init__(self, lobby, client, client_id: int) -> None:
		from .lobby import Lobby
		from ft_django.pong_socket import PongSocket
		
		self.lobby:		Lobby 		= lobby
		self.client:	PongSocket	= client
		self.client_id:	int			= client_id
		
	async def sendData(self, *args):
		await self.client.sendData(*args)