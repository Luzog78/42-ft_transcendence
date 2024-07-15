import json
from typing import Any

from ft_django.game_engine.game_server import GameServer
from channels.generic.websocket import AsyncWebsocketConsumer
from asgiref.sync import sync_to_async
from django.db.models import Q
from django.core import serializers

from api_app.jwt import verify_token
from api_app.models import User, PrivateChat, GameChat, FriendList

connected_sockets = []

def find_user_socket(user: str):
	res = []
	for socket in connected_sockets:
		if socket.get_user() == user:
			res.append(socket)
	return res

# todo opti bdd: transform user from string to UserObject at authenticate to prevent bdd call at each request
# # pb: maybe (maybe) (django may prevent it) socket need to be closed if user object deleted on another computer to prevent recreation of object if saved
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
			pass # TODO: find game, add message in db and find if targets have socket open with find_user_socket
		elif data['type'] == 'get_friend_list':
			# todo see: maybe move in api
			await self.get_friend_list(data, frontendId)
		elif data['type'] == 'add_friend':
			# todo see: maybe move in api but: how to send notification
			await self.add_friend(data, frontendId)
		elif data['type'] == 'remove_friend':
			# todo see: maybe move in api
			pass # todo


	async def reply(self, data: Any, status: bool, frontendId: Any):
		json_data = {}
		json_data['frontendId'] = frontendId
		json_data['type'] = 'response'
		json_data['ok'] = status
		if status:
			json_data['response'] = data
		else:
			json_data['error'] = data
		await self.sendJson(json_data)

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
			await targetSocket.sendJson({'type': 'new_private_message', 'from': self.user, 'content': data['content'], 'messageId': message.id})
		await self.reply({
				'messageId': message.id
			}, True, frontendId)

	async def get_previous_messages(self, data, frontendId):
		try:
			usr = await sync_to_async(User.objects.get)(username=self.user)
			if 'channelType' not in data or (data['channelType'] != 0 and data['channelType'] != 1) \
				or 'target' not in data:
				await self.reply('errors.invalidRequest', False, frontendId)
				return
			if data['channelType'] == 0:
				target = await sync_to_async(User.objects.get)(username=data['target'])
				messages = await sync_to_async(PrivateChat.objects.filter)(Q(author=usr, target=target) | Q(author=target, target=usr))
				messages = await sync_to_async(serializers.serialize)('json', messages)
				messages = json.loads(messages) #sad way, todo change serializers.serialize to a real toJson fct
				_msgs = []
				# so fucking ugly bruh thx to serializers.serialize
				for msg in messages:
					msg['fields']['id'] = msg['pk']
					_msgs.append(msg['fields'])
				messages = _msgs
			else:
				await self.reply('todo.fetch.game.messages', False, frontendId)
				return

			await self.reply(messages, True, frontendId)
		except User.DoesNotExist:
			await self.reply('errors.UserNotFound', False, frontendId)
			return
	
	async def get_friend_list(self, data, frontendId):
		try:
			usr = await sync_to_async(User.objects.get)(username=self.user)
		except:
			await self.reply('errors.UserNotFound', False, frontendId)
			return
		friend_list = await sync_to_async(FriendList.objects.filter)(Q(author=usr) | Q(target=usr))
		friend_list = await sync_to_async(serializers.serialize)('json', friend_list)
		friend_list = json.loads(friend_list) #sad way, todo change serializers.serialize to a real toJson fct
		friend_list = [friend['fields'] for friend in friend_list] # so fucking ugly bruh thx to serializers.serialize
		await self.reply(friend_list, True, frontendId)

	async def add_friend(self, data, frontendId):
		if 'target' not in data or not isinstance(data['target'], str):
			await self.reply('errors.invalidRequest', False, frontendId)
			return
		try:
			usr = await sync_to_async(User.objects.get)(username=self.user)
			target = await sync_to_async(User.objects.get)(username=data['target'])
			
			if (usr == target):
				await self.reply('errors.FriendRequestYourself', False, frontendId) # todo lang
				return

			friend_relation = await sync_to_async(FriendList.objects.get)(Q(author=usr, target=target) | Q(target=usr, author=target))
			if friend_relation.pending == False:
				await self.reply('errors.AlreadyFriend', False, frontendId) # todo lang
			elif friend_relation.author == usr:
				await self.reply('errors.FriendRequestSent', False, frontendId) # todo lang
			else:
				friend_relation.pending = False
				await sync_to_async(friend_relation.save)()
				targetSockets = find_user_socket(data['target'])
				for targetSocket in targetSockets:
					await targetSocket.sendJson({'type': 'new_friend', 'friend': self.user})
				targetSockets = find_user_socket(self.user)
				for targetSocket in targetSockets:
					await targetSocket.sendJson({'type': 'new_friend', 'friend': data['target']})
				await self.reply('successes.acceptedFriendRequest', False, frontendId) # todo lang
		except User.DoesNotExist:
			await self.reply('errors.UserNotFound', False, frontendId)
			return
		except FriendList.DoesNotExist:
			friend_request = FriendList(author=usr, target=target)
			await sync_to_async(friend_request.save)()
			targetSockets = find_user_socket(data['target'])
			for targetSocket in targetSockets:
				await targetSocket.sendJson({'type': 'new_friend_request', 'friend': self.user})
			await self.reply('successes.FriendRequestSent', True, frontendId) # todo lang


