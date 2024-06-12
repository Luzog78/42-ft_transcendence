import json
from channels.generic.websocket import AsyncWebsocketConsumer


class PongSocket(AsyncWebsocketConsumer):
	def __init__(self, *args, **kwargs):
		super().__init__(*args, **kwargs)
		self.room_name = None
		self.room_group_name = None

	async def connect(self):
		self.room_name = 'pong'
		self.room_group_name = 'pong_group'

		await self.accept()

	async def disconnect(self, close_code):
		pass

	async def receive(self, text_data):
		data = json.loads(text_data)
		print(json.dumps(data, indent=4))

	async def pong_message(self, event):
		message = event['message']
		await self.send(text_data=json.dumps({
			'message': message
		}))
