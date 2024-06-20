import json

from game_engine.GameServer import GameServer
from channels.generic.websocket import AsyncWebsocketConsumer
from asgiref.sync import sync_to_async
from django.db.models import Q
from django.core import serializers

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
				await self.authenticate(data, frontendId)
			else:
				await self.reply('errors.notAuthenticated', False, frontendId)
		elif data['type'] == 'get_previous_messages':
			await self.get_previous_messages(data, frontendId)
		elif data['type'] == 'send_message':
			await self.send_message(data, frontendId)
		elif data['type'] == 'send_game_message':
			pass # todo find game, add message in db and find if targets have socket open with find_user_socket

	async def reply(self, data: any, status: bool, frontendId: any):
		json_data = {}
		json_data['frontendId'] = frontendId
		json_data['type'] = 'response'
		json_data['ok'] = status
		if status:
			json_data['response'] = data
		else:
			json_data['error'] = data
		await self.sendJson(json_data)

	async def sendData(self, *args):
		await self.sendJson(data)

	async def sendJson(self, json_data):
		print("sending", json_data)
		await self.send(text_data=json.dumps(json_data))



	async def authenticate(self, data, frontendId):
		if 'authorization' not in data:
			await self.reply('errors.missingAuthorization', False, frontendId)
		else:
			self.user = verify_token(data['authorization'])
			if self.user is None:
				await self.reply('errors.invalidCredentials', False, frontendId)
			else:
				if not self in connected_sockets:
					connected_sockets.append(self)
				await self.reply(None, True, frontendId)
	
	async def send_message(self, data, frontendId):
		if 'target' not in data or 'content' not in data \
			or not isinstance(data['target'], str) or not isinstance(data['content'], str):
				await self.reply('errors.invalidRequest', False, frontendId)
				return
		if len(data['content']) > 2048:
			await self.reply('errors.MessageTooLong', False, frontendId)
			return
		try:
			author = await sync_to_async(User.objects.get, thread_sensitive=True)(username=self.user)
			target = await sync_to_async(User.objects.get, thread_sensitive=True)(username=data['target'])
		except User.DoesNotExist:
			await self.reply('errors.UserNotFound', False, frontendId)
			return
		message = PrivateChat(author=author, target=target, content=data['content'])
		await sync_to_async(message.save, thread_sensitive=True)()
		targetSockets = find_user_socket(data['target'])
		for targetSocket in targetSockets:
			await targetSocket.sendJson({'type': 'new_private_message', 'from': self.user, 'content': data['content']})
		await self.reply({
				'messageId': message.id
			}, True, frontendId)

	async def get_previous_messages(self, data, frontendId):
		try:
			usr = await sync_to_async(User.objects.get)(username=self.user)
		except:
			await self.reply('errors.UserNotFound', False, frontendId)
			return
		private_messages = await sync_to_async(PrivateChat.objects.filter)(Q(author=usr) | Q(target=usr))
		private_messages = await sync_to_async(serializers.serialize)('json', private_messages)
		private_messages = json.loads(private_messages) #sad way, todo change serializers.serialize to a real toJson fct
		private_messages = [msg['fields'] for msg in private_messages] # so fucking ugly bruh thx to serializers.serialize
		await self.reply({
			'private_messages': private_messages,
			'game_messages': [] # todo get game messages
		}, True, frontendId)
	