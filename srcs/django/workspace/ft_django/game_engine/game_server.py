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

from api_app.models import Game, GameMode
from .lobby import Lobby
from .player import Player
from .spectator import Spectator


class GameServer:
	def __init__(self):
		self.lobbies: list[Lobby] = []
		self.clients: list[Player | Spectator] = []

		self.tps: int = 60
		self.dt: float = 1 / self.tps

	async def receive(self, data, socket):
		if not socket.registered:
			if "uid" in data and isinstance(data["uid"], str) \
				and "username" in data and isinstance(data["username"], str):
				print('>>> Creating new socket <<<')
				print('>>> lobbys:', *[l.uid for l in self.lobbies], '<<<')
				socket.username = data["username"]
				await self.addClient(socket, data["uid"])
				socket.registered = True
		else:
			lobby: Lobby = self.lobbies[data["lobby_id"]]
			await lobby.receive(data)

	def createLobby(self, uid: str, game_mode: str, player_num: int, theme: int, ball_speed: float, limit):
		lobby = Lobby(self, uid, game_mode, player_num, theme, ball_speed, limit)
		self.lobbies.append(lobby)
		return lobby

	def findLobby(self, uid: str) -> Lobby | None:
		for lobby in self.lobbies:
			if lobby.uid == uid:
				return lobby
		game = Game.objects.get(uid=uid)
		if not game:
			return None
		return self.createLobby(
			uid=uid,
			game_mode=GameMode.BATTLE_ROYALE,
			player_num=len(game.players),
			theme=0,
			ball_speed=1,
			limit=None
		)

	async def addClient(self, client, uid: str) -> bool:
		lobby = self.findLobby(uid)
		if not lobby:
			return False

		print("new client in lobby id: ", lobby.lobby_id)

		game = Game.objects.get(uid=uid)
		if game.restricted:
			goto_specs = client.username not in game.players
		else:
			goto_specs = len(lobby.clients) >= lobby.clients_per_lobby

		if goto_specs: # spectator
			print("new spec")
			spectator = Spectator(lobby, client, len(lobby.spectators) + len(lobby.clients))
			self.clients.append(spectator)
			await lobby.addSpectator(spectator)
		else:
			print("new player")
			player = Player(lobby, client, len(lobby.clients))
			self.clients.append(player)
			await lobby.addClient(player)
		return True

	def removeClient(self, client) -> bool:
		for player in self.clients:
			if player.client == client:
				player.lobby.removeClient(player)
				self.clients.remove(player)
				return True
		return False

	def kill(self, lobby):
		pass

