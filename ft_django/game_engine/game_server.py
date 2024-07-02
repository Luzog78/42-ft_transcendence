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

import time
import asyncio
import threading

from .lobby import Lobby
from .player import Player


class GameServer:
	def __init__(self):
		self.lobbies: list[Lobby] = []
		self.clients: list[Player] = []

		self.tps = 20
		self.dt = 1 / self.tps

	async def receive(self, data):
		lobby = self.lobbies[data["lobby_id"]]
		await lobby.receive(data)

	def lobbiesAreFull(self):
		return len(self.lobbies) == 0 or len(self.lobbies[-1].clients) == self.lobbies[-1].clients_per_lobby

	def createLobby(self, uid, game_mode, player_num, theme, ball_speed, limit):
		self.lobbies.append(Lobby(self, uid, game_mode, player_num, theme, ball_speed, limit))

	def findLobby(self, uid:str):
		for lobby in self.lobbies:
			if lobby.uid == uid:
				return lobby
		return None

	async def addClient(self, client, uid:str):
		lobby = self.findLobby(uid)
		if (not lobby):
			return None

		print("new client in lobby id: ", lobby.lobby_id)
		if (len(lobby.clients) == lobby.clients_per_lobby):
			pass #spectator
		else:
			player = Player(lobby, client, len(lobby.clients))
			self.clients.append(player)
			await lobby.addClient(player)

	def removeClient(self, client):
		for player in self.clients:
			if (player.client == client):
				player.lobby.removeClient(player)
				self.clients.remove(player)
				break
