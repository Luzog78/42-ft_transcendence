import json

from game_engine.GameServer import GameServer
from channels.generic.websocket import AsyncWebsocketConsumer
from asgiref.sync import sync_to_async

from api_app.jwt import verify_token
from api_app.models import User, PrivateChat, GameChat

connected_sockets = []

def find_user_socket(user: str):
	res = []
	for socket in connected_sockets:
		if socket.get_user() == user:
			res.append(socket)
	return res

class ChatSocket(AsyncWebsocketConsumer):
	def __init__(self, *args, **kwargs):
		self.user = None
		super().__init__(*args, **kwargs)

	def get_user(self):
		return self.user

	async def connect(self):
		await self.accept()

	async def disconnect(self, close_code):
		if self in connected_sockets:
			connected_sockets.remove(self)

	async def receive(self, text_data):
		# todo shorty fct
		print("received", text_data)
		try:
			data = json.loads(text_data)
		except:
			await self.sendJson({'ok': False, 'type': 'response', 'error': 'errors.invalidRequest'})
			return
		if 'type' not in data or 'frontendId' not in data:
			await self.sendJson({'ok': False, 'type': 'response', 'error': 'errors.missingRequestInformations'})
			return
		frontendId = data['frontendId']

		if self.user is None or data['type'] == 'authenticate':
			if data['type'] == 'authenticate':
				if 'authorization' not in data:
					await self.reply({'ok': False, 'error': 'errors.missingAuthorization'}, frontendId)
					return

				self.user = verify_token(data['authorization'])
				if self.user is None:
					await self.reply({'ok': False, 'error': 'errors.invalidCredentials'}, frontendId)
				else:
					if not self in connected_sockets:
						connected_sockets.append(self)
					await self.reply({'ok': True}, frontendId)

			else:
				await self.reply({'ok': False, 'error': 'errors.notAuthenticated'}, frontendId)
		elif data['type'] == 'get_previous_messages':
			pass # todo call db to get all previous private message of user
		elif data['type'] == 'send_message':
			if 'target' not in data or 'content' not in data \
			or not isinstance(data['target'], str) or not isinstance(data['content'], str):
				await self.reply({'ok': False, 'error': 'errors.invalidRequest'}, frontendId)
				return
			if len(data['content']) > 2048:
				await self.reply({'ok': False, 'error': 'errors.MessageTooLong'}, frontendId)
				return
			try:
				author = await sync_to_async(User.objects.get, thread_sensitive=True)(username=self.user)
				target = await sync_to_async(User.objects.get, thread_sensitive=True)(username=data['target'])
			except User.DoesNotExist:
				await self.reply({'ok': False, 'error': 'errors.UserNotFound'}, frontendId)
				return
			message = PrivateChat(author=author, target=target, content=data['content'])
			await sync_to_async(message.save, thread_sensitive=True)()
			targetSockets = find_user_socket(data['target'])
			for targetSocket in targetSockets:
				await targetSocket.sendJson({'type': 'new_private_message', 'from': self.user, 'content': data['content']})
			await self.reply({'ok': True}, frontendId)
		
		elif data['type'] == 'send_game_message':
			pass # todo find game, add message in db and find if targets have socket open with find_user_socket

	async def reply(self, json_data: dict, frontendId: any):
		json_data['frontendId'] = frontendId
		json_data['type'] = 'response'
		await self.sendJson(json_data)

	async def sendData(self, *args):
		await self.sendJson(data)

	async def sendJson(self, json_data):
		print("sending", json_data)
		await self.send(text_data=json.dumps(json_data))
