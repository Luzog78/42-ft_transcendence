import json

from ft_django.game_engine.game_server import GameServer
from channels.generic.websocket import AsyncWebsocketConsumer

game_server = GameServer()

class PongSocket(AsyncWebsocketConsumer):
	def __init__(self, *args, **kwargs):
		super().__init__(*args, **kwargs)
		self.room_name = None
		self.room_group_name = None

	async def connect(self):
		self.room_name = 'pong'
		self.room_group_name = 'pong_group'

		await self.accept()
		await game_server.addClient(self)

	async def disconnect(self, close_code):
		if (close_code != 1001): # to remove
			game_server.removeClient(self)

	async def receive(self, text_data):
		data = json.loads(text_data)
		await game_server.receive(data)

	async def sendData(self, *args):
		data = {}
		for i in range(0, len(args), 2):
			key = args[i]
			value = args[i + 1]
			data[key] = value

		await self.sendJson(data)

	async def sendJson(self, json_data):
		await self.send(text_data=json.dumps(json_data))
