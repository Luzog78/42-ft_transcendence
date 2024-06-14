import json
import time
import math
import asyncio
import threading
from channels.generic.websocket import AsyncWebsocketConsumer


class PongSocket(AsyncWebsocketConsumer):
	def __init__(self, *args, **kwargs):
		super().__init__(*args, **kwargs)
		self.room_name = None
		self.room_group_name = None

		self.tps = 60
		self.dt = 1 / self.tps

		self.updateThread = threading.Thread(target=asyncio.run, args=(self.update(),))
		self.updateThread.start()


	async def update(self):
		while True:
			await self.sendData("modify", {"ball.position.y": math.sin(time.time() * 5) * 0.5 + 0.5})
			time.sleep(self.dt)

	async def connect(self):
		self.room_name = 'pong'
		self.room_group_name = 'pong_group'

		await self.accept()

	async def disconnect(self, close_code):
		pass

	async def receive(self, text_data):
		print("received ", text_data)
		data = json.loads(text_data)
		print(json.dumps(data, indent=4))

	async def sendData(self, *args):

		data = {}
		for i in range(0, len(args), 2):
			key = args[i]
			value = args[i + 1]
			data[key] = value
		await self.sendJson(data)

	async def sendJson(self, json_data):
		await self.send(text_data=json.dumps(json_data))