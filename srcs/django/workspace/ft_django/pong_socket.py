import json

from ft_django.game_engine.game_server import GameServer
from channels.generic.websocket import AsyncWebsocketConsumer

game_server = GameServer()

class PongSocket(AsyncWebsocketConsumer):
	def __init__(self, *args, online=True, **kwargs):
		if online:
			super().__init__(*args, **kwargs)

		self.buffer: list[dict] = []

		self.connected = online
		self.registered = False
		self.username = None

	async def connect(self):
		self.room_name = 'pong'
		self.room_group_name = 'pong_group'

		await self.accept()

	async def disconnect(self, close_code):
		if (close_code != 1001): # TODO: to remove
			game_server.removeClient(self)

	async def receive(self, text_data):
		data = json.loads(text_data)
		await game_server.receive(data, self)

	async def sendData(self, *args):
		data = {}
		for i in range(0, len(args), 2):
			key = args[i]
			value = args[i + 1]
			data[key] = value

		await self.sendJson(data)

	async def sendJson(self, json_data):
		if self.connected:
			await self.send(text_data=json.dumps(json_data))
		else:
			self.buffer.append(json_data)
