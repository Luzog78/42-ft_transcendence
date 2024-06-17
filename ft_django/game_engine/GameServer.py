# **************************************************************************** #
#                                                                              #
#                                                         :::      ::::::::    #
#    GameServer.py                                      :+:      :+:    :+:    #
#                                                     +:+ +:+         +:+      #
#    By: marvin <marvin@student.42.fr>              +#+  +:+       +#+         #
#                                                 +#+#+#+#+#+   +#+            #
#    Created: 2024/06/15 14:42:04 by marvin            #+#    #+#              #
#    Updated: 2024/06/15 14:42:04 by marvin           ###   ########.fr        #
#                                                                              #
# **************************************************************************** #

import json
import time
import asyncio
import threading

from game_engine.Lobby import Lobby
from game_engine.Player import Player

class GameServer():
	def __init__(self):
		self.lobbys = []
		self.clients = []

		self.tps = 20
		self.dt = 1 / self.tps

		self.running = True
		self.gameServerThread = threading.Thread(target=asyncio.run, args=(self.update(),))
		self.gameServerThread.start()

	async def update(self):
		while self.running:
			time.sleep(self.dt)

			for lobby in self.lobbys:
				await lobby.update()

	def receive(self, data):
		lobby = self.lobbys[data["lobby_id"]]
		lobby.receive(data)

		# print("received ", json.dumps(data, indent=4))

	def lobbysAreFull(self):
		return len(self.lobbys) == 0 or len(self.lobbys[-1].clients) == self.lobbys[-1].clientsPerLobby

	async def addClient(self, client):

		if (self.lobbysAreFull()):
			self.lobbys.append(Lobby(self))
		lobby = self.lobbys[-1]
		player = Player(lobby, client, len(lobby.clients))

		self.clients.append(player)
		await lobby.addClient(player)

	def removeClient(self, client):
		self.clients.remove(client)