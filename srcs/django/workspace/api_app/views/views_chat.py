import json
import asyncio
from django.db.models import Q
from django.http import JsonResponse, HttpRequest
from django.views.decorators.csrf import csrf_exempt

from api_app import auth
from api_app.models import User, FriendList, BlockList, PrivateChat
from ft_django.chat_socket import find_user_socket


@csrf_exempt
def view_add_friend(request: HttpRequest):
	if not (response := auth.is_authenticated(request)):
		return JsonResponse({'ok': False, 'error': 'errors.notLoggedIn'})
	if request.method != 'POST':
		return JsonResponse({'ok': False, 'error': 'errors.invalidMethod'})
	data = json.loads(request.body.decode(request.encoding or 'utf-8'))
	if 'target' not in data or not isinstance(data['target'], str):
		return JsonResponse({'ok': False, 'error': 'errors.invalidRequest'})
	if data['target'] == response.user:
		return JsonResponse({'ok': False, 'error': 'errors.FriendRequestYourself'})
	if not (user := User.get(response.user)) or not (target := User.get(data['target'])):
		return JsonResponse({'ok': False, 'error': 'errors.userNotFound'})

	block_relation = BlockList.objects.filter(Q(author=user, target=target))
	if block_relation:
		block_relation.delete()
	block_relation = BlockList.objects.filter(Q(author=target, target=user))
	if block_relation:
		return JsonResponse({'ok': False, 'error': 'errors.userNotFound'})

	try:
		friend_relation = FriendList.objects.get(Q(author=user, target=target) | Q(author=target, target=user))
		if friend_relation.pending == False:
			return JsonResponse({'ok': False, 'error': 'errors.AlreadyFriend'})
		elif friend_relation.author == user:
			return JsonResponse({'ok': False, 'error': 'errors.FriendRequestSent'})
		else:
			# accepting friend request
			friend_relation.pending = False
			friend_relation.save()
			targetSockets = find_user_socket(data['target'])
			fromSockets = find_user_socket(response.user)
			for socket in targetSockets:
				asyncio.run(socket.sendJson({'type': 'new_friend', 'friend': response.user, 'myRequest': True}))
				if len(fromSockets) > 0:
					asyncio.run(socket.sendJson({'type': 'status_change', 'username': response.user, 'status': True}))
			for socket in fromSockets:
				asyncio.run(socket.sendJson({'type': 'new_friend', 'friend': data['target'], 'myRequest': False}))
				if len(targetSockets) > 0:
					asyncio.run(socket.sendJson({'type': 'status_change', 'username': data['target'], 'status': True}))
			return JsonResponse({'ok': True, 'success': 'successes.acceptedFriendRequest'})

	except FriendList.DoesNotExist:
		# send friend request
		friend_request = FriendList(author=user, target=target)
		friend_request.save()
		for targetSocket in find_user_socket(data['target']):
			asyncio.run(targetSocket.sendJson({'type': 'new_friend_request', 'friend': response.user, 'myRequest': False}))
		return JsonResponse({'ok': True, 'success': 'successes.FriendRequestSent'})


@csrf_exempt
def view_remove_friend(request: HttpRequest):
	if not (response := auth.is_authenticated(request)):
		return JsonResponse({'ok': False, 'error': 'errors.notLoggedIn'})
	if request.method != 'POST':
		return JsonResponse({'ok': False, 'error': 'errors.invalidMethod'})
	data = json.loads(request.body.decode(request.encoding or 'utf-8'))
	if 'target' not in data or not isinstance(data['target'], str):
		return JsonResponse({'ok': False, 'error': 'errors.invalidRequest'})
	if not (user := User.get(response.user)) or not (target := User.get(data['target'])):
		return JsonResponse({'ok': False, 'error': 'errors.userNotFound'})

	try:
		friend_relation = FriendList.objects.get(Q(author=user, target=target) | Q(target=user, author=target))
		pending = friend_relation.pending
		friend_relation.delete()

		for socket in find_user_socket(data['target']):
			asyncio.run(socket.sendJson({'type': 'remove_friend', 'friend': response.user}))
		for socket in find_user_socket(response.user):
			asyncio.run(socket.sendJson({'type': 'remove_friend', 'friend': data['target']}))
		return JsonResponse({'ok': True, 'success': 'successes.cancelFriendRequest'})

	except FriendList.DoesNotExist:
		return JsonResponse({'ok': False, 'error': 'errors.RelationDoesNotExist'})


@csrf_exempt
def view_get_friends(request: HttpRequest):
	if not (response := auth.is_authenticated(request)):
		return JsonResponse({'ok': False, 'error': 'errors.notLoggedIn'})
	if request.method != 'GET':
		return JsonResponse({'ok': False, 'error': 'errors.invalidMethod'})
	if not (user := User.get(response.user)):
		return JsonResponse({'ok': False, 'error': 'errors.userNotFound'})

	friend_list = FriendList.objects.filter(Q(author=user) | Q(target=user))
	friend_list = [friend.json() for friend in friend_list]
	return JsonResponse({'ok': True, "data": friend_list})


@csrf_exempt
def view_block_user(request: HttpRequest):
	if not (response := auth.is_authenticated(request)):
		return JsonResponse({'ok': False, 'error': 'errors.notLoggedIn'})
	if request.method != 'POST':
		return JsonResponse({'ok': False, 'error': 'errors.invalidMethod'})
	data = json.loads(request.body.decode(request.encoding or 'utf-8'))
	if 'target' not in data or not isinstance(data['target'], str):
		return JsonResponse({'ok': False, 'error': 'errors.invalidRequest'})
	if not (user := User.get(response.user)) or not (target := User.get(data['target'])):
		return JsonResponse({'ok': False, 'error': 'errors.userNotFound'})

	try:
		block_relation = BlockList.objects.get(Q(author=user, target=target))
		return JsonResponse({'ok': False, 'error': 'errors.AlreadyBlocked'})
	except BlockList.DoesNotExist:
		block_relation = BlockList(author=user, target=target)
		block_relation.save()
		friend_relation = FriendList.objects.filter(Q(author=user, target=target) | Q(target=user, author=target))
		if friend_relation:
			friend_relation.delete()

		for targetSocket in find_user_socket(data['target']):
			asyncio.run(targetSocket.sendJson({'type': 'remove_friend', 'friend': response.user}))
		return JsonResponse({'ok': True, 'success': 'successes.blocked'})


@csrf_exempt
def view_send_message(request: HttpRequest):
	if not (response := auth.is_authenticated(request)):
		return JsonResponse({'ok': False, 'error': 'errors.notLoggedIn'})
	data = json.loads(request.body.decode(request.encoding or 'utf-8'))
	if request.method != 'POST':
		return JsonResponse({'ok': False, 'error': 'errors.invalidMethod'})
	if 'target' not in data or 'content' not in data \
		or not isinstance(data['target'], str) or not isinstance(data['content'], str):
			return JsonResponse({'ok': False, 'error': 'errors.invalidRequest'})
	if len(data['content']) > 2048:
		return JsonResponse({'ok': False, 'error': 'errors.MessageTooLong'})

	try:
		author = User.objects.get(username=response.user)
		target = User.objects.get(username=data['target'])

		message = PrivateChat(author=author, target=target, content=data['content'])
		message.save()
		targetSockets = find_user_socket(data['target'])
		for targetSocket in targetSockets:
			asyncio.run(targetSocket.sendJson({'type': 'new_private_message', 'from': response.user, 'content': data['content'], 'messageId': message.id}))
		return JsonResponse({'ok': True, 'messageId': message.id})
	except User.DoesNotExist:
		return JsonResponse({'ok': False, 'error': 'errors.UserNotFound'})


@csrf_exempt
def view_get_messages(request: HttpRequest):
	if not (response := auth.is_authenticated(request)):
		return JsonResponse({'ok': False, 'error': 'errors.notLoggedIn'})
	data = json.loads(request.body.decode(request.encoding or 'utf-8'))
	if request.method != 'POST':
		return JsonResponse({'ok': False, 'error': 'errors.invalidMethod'})
	if 'channelType' not in data or (data['channelType'] != 0 and data['channelType'] != 1) \
		or 'target' not in data:
			return JsonResponse({'ok': False, 'error': 'errors.invalidRequest'})

	try:
		usr = User.objects.get(username=response.user)
		if data['channelType'] == 0:
			target = User.objects.get(username=data['target'])
			messages = PrivateChat.objects.filter(Q(author=usr, target=target) | Q(author=target, target=usr))
			messages = [msg.json(json_users=False) for msg in messages]
			return JsonResponse({'ok': True, 'messages': messages})
		else:
			return JsonResponse({'ok': False, 'error': 'errors.NotImplementedYet'})
	except User.DoesNotExist:
		return JsonResponse({'ok': False, 'error': 'errors.UserNotFound'})
