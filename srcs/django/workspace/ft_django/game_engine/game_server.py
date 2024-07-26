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
from .bot import Bot
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
			player_num=2,
			theme=0,
			ball_speed=1,
			limit=None
		)

	async def addClient(self, client, uid: str) -> bool:
		lobby = self.findLobby(uid)
		if not lobby:
			return False

		game = Game.objects.get(uid=uid)

		username = [p.client.username if isinstance(p, Player) else p.username for p in lobby.clients]
		if lobby.status == "WAITING" and client.username in username:
			await client.sendData("error", "errors.alreadyConnectedLobby")
			return False

		if game.restricted:
			goto_specs = client.username not in game.players
		else:
			goto_specs = len(lobby.clients) >= lobby.clients_per_lobby

		if goto_specs:
			spectator = Spectator(lobby, client, len(lobby.spectators) + len(lobby.clients))
			self.clients.append(spectator)
			await lobby.addSpectator(spectator)
		else:
			id = 0
			while id in [c.client_id for c in lobby.clients]:
				id += 1

			player = Player(lobby, client, id)
			self.clients.insert(id, player)
			await lobby.addClient(player)
		return True

	async def removeClient(self, client) -> bool:
		for player in self.clients:
			if player.client == client:
				lobby = player.lobby

				if lobby.status == "START":
					return False

				lobby.removeClient(player)
				self.clients.remove(player)

				for p in lobby.clients:
					if isinstance(p, Bot):
						continue
					await p.sendData("call", {"command": "scene.server.disconnectPlayer",
										"args": [f"'player{player.client_id}'"]})
					await p.sendData("call", {"command": 'setWaitingPlayerCount', "args": [len(lobby.clients)]})

				return True
		return False
