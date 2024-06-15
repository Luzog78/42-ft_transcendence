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

	async def update(self):
		pass
	
	async def sendData(self, *args):
		await self.client.sendData(*args)