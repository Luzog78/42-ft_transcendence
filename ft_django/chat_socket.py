import json

from game_engine.GameServer import GameServer
from channels.generic.websocket import AsyncWebsocketConsumer

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
		connected_sockets.remove(self)

	async def receive(self, text_data):
		# todo shorty fct
		# todo maybe force client to send frontendId for each request, not onky send_message (then, client will now which ws request have failed or success)
		 # and each reply will have frontendId in jsonResp
		try:
			data = json.loads(text_data)
		except:
			self.sendJson({'ok': False, 'error': 'errors.invalidRequest'})
			return
		if 'type' not in data:
			self.sendJson({'ok': False, 'error': 'errors.missingRequestType'})
			return

		if self.user is None or data['type'] == 'authenticate':
			if data['type'] == 'authenticate':
				if 'authorization' not in data:
					self.sendJson({'ok': False, 'type': data['type'], 'error': 'errors.missingAuthorization'})
					return

				self.user = verify_token(data['authorization'])
				if self.user is None:
					self.sendJson({'ok': False, 'type': data['type'], 'error': 'errors.invalidCredentials'})
				else:
					if not self in connected_sockets:
						connected_sockets.append(self)
					self.sendJson({'ok': True, 'type': data['type']})

			else:
				self.sendJson({'ok': False, 'type': data['type'], 'error': 'errors.notAuthenticated'})
		elif data['type'] == 'get_previous_messages':
			pass # todo call db to get all previous private message of user
		elif data['type'] == 'send_message':
			if 'target' not in data or 'content' not in data or 'frontendId' not in data \
				or not isinstance(data['target'], str) or not isinstance(data['content'], str):
				self.sendJson({'ok': False, 'error': 'errors.invalidRequest'})
				return
			try:
				author = User.objects.get(username=self.user)
				target = User.objects.get(username=data['target'])
			except User.DoesNotExist:
				self.sendJson({'ok': False, 'type': data['type'], 'frontendId': data['frontendId'], 'error': 'errors.UserNotFound'})
				return
			message = PrivateMessage(author=author, target=target, content=data['content']) # todo check length error
			message.save()
			targetSockets = find_user_socket(data['target'])
			for targetSocket in targetSockets:
				targetSocket.sendJson({'type': 'new_private_message', 'from': self.user, 'content': data['content']})
			self.sendJson({'ok': True, 'type': data['type'], 'frontendId': data['frontendId']})
		
		elif data['type'] == 'send_game_message':
			pass # todo find game, add message in db and find if targets have socket open with find_user_socket

	async def sendData(self, *args):
		await self.sendJson(data)

	async def sendJson(self, json_data):
		await self.send(text_data=json.dumps(json_data))
