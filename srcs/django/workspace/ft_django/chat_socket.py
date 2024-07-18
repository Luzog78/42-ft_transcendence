import json
from typing import Any

from channels.generic.websocket import AsyncWebsocketConsumer
from asgiref.sync import sync_to_async
from django.db.models import Q
from django.core import serializers

from api_app.jwt import verify_token
from api_app.models import User, FriendList

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

			selfSockets = find_user_socket(self.user)
			if len(selfSockets) == 0:
				friend_list = await sync_to_async(FriendList.objects.filter)(Q(author=self.user) | Q(target=self.user), pending=False)
				for friend in friend_list:
					username = str(friend.target) if str(friend.author) == self.user else str(friend.author)
					for socket in find_user_socket(username):
						await socket.sendJson({'type': 'status_change', 'username': self.user, 'status': False})

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
		elif data['type'] == 'send_game_message':
			pass # TODO: find game, add message in db and find if targets have socket open with find_user_socket
		else:
			await self.reply('errors.invalidRequestMooved', False, frontendId)


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
		try:
			await self.send(text_data=json.dumps(json_data))
		except:
			print("socket disconnected")


	async def authenticate(self, data, frontendId):
		if 'authorization' not in data:
			await self.reply('errors.missingAuthorization', False, frontendId)
		else:
			self.user = verify_token(data['authorization'])
			if self.user is None:
				await self.reply('errors.invalidCredentials', False, frontendId)
			else:
				try:
					userObject = await sync_to_async(User.objects.get)(username=self.user)
					
					if not self in connected_sockets:
						connected_sockets.append(self)
					await self.reply(None, True, frontendId)

					selfSockets = find_user_socket(self.user)
					if len(selfSockets) == 1:
						friend_list = await sync_to_async(FriendList.objects.filter)(Q(author=userObject) | Q(target=userObject), pending=False)
						for friend in friend_list:
							username = str(friend.target) if str(friend.author) == self.user else str(friend.author)
							sockets = find_user_socket(username)
							for socket in sockets:
								await socket.sendJson({'type': 'status_change', 'username': self.user, 'status': True})
							if len(sockets) > 0:
								await self.sendJson({'type': 'status_change', 'username': username, 'status': True})

				except User.DoesNotExist:
					await self.reply('errors.invalidCredentials', False, frontendId)