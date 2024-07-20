/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   Chat.js                                            :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: psalame <psalame@student.42.fr>            +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2024/07/12 13:19:04 by psalame           #+#    #+#             */
/*   Updated: 2024/07/20 13:38:29 by psalame          ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */

import { persistSuccess, persistError, getLang, redirect } from "../script.js";
import { getJson, postJson } from "../utils.js";
import { OnNotification } from "./NavBar.js";
import { pushPersistents } from "./Persistents.js";

// main code

var enabled = false;
var searchInput = "";
var openedDiscussion = null;

// dict of "username": {
//				full_name: "",
//				profilePicture: "",
//				discussion: [],
//				unreadMessage: 0,
//				online: none,
//			}
var cache = {}
var systemNotifications = {
	unread: 0,
	messages: []
}


function GetNotificationsNumber() {
	var res = systemNotifications.unread;
	for (var username in cache)
		res += (cache[username].unreadMessage || 0)
	return res;
}

function refreshNotificationNumber(friendButton, username) {
	if (!friendButton)
		return;

	let notifContainer = friendButton.querySelector(".notificationNumber");
	if (cache[username] && (cache[username].unreadMessage || 0) !== 0) {
		notifContainer.style.display = "block";
		var nbNotif = cache[username].unreadMessage;
		if (nbNotif > 9)
			nbNotif = "9+";
		notifContainer.innerText = nbNotif;
	} else
		notifContainer.style.display = "none";
}

function buildMessage(content, side) {
	var type = "message";
	var jsonData;
	if (content[0] === "`" && content[content.length - 1] === "`")
		try {
			jsonData = JSON.parse(content.slice(1, -1));
			type = jsonData.type;
		} catch (e) {
		}
	var messageBloc;

	switch (type) {
		case "gameInvite":
			messageBloc = document.createElement("div");
			messageBloc.classList.add("gameInvite");
			messageBloc.innerHTML = /*html*/`
				<!-- todo langs -->
				<p class="gameInvite-title">Game Invite</p>
				<p>Do you want to play?</p>
				<button>Join</button>
			`;
			messageBloc.querySelector("button").onclick = () => {
				redirect(`/play/${jsonData.gameId}`);
			}

			break;
		case "tournamentMatchStart":
			messageBloc = document.createElement("div");
			messageBloc.classList.add("tournamentMatchStart")
			messageBloc.innerHTML = /*html*/`
				<!-- todo langs -->
				<p>Your tournament match has started</p>
				<button>Join</button>
			`;
			messageBloc.querySelector("button").onclick = () => {
				redirect(`/play/${jsonData.gameUid}`);
			}
			break;
		default:
			messageBloc = document.createElement("p");
			messageBloc.innerText = content;
			break;
	}

	messageBloc.classList.add("message");
	messageBloc.classList.add(side);
	return messageBloc;
}

function sendMessage(context, target, message) {
	if (context && message != "") {
		postJson(context, '/api/message/send', {
			target: target,
			content: message,
		})
		.then(resp => {
			if (resp.ok) {
				if (!cache[target])
					cache[target] = {};
				if (!cache[target].discussion)
					cache[target].discussion = [];
				cache[target].discussion.push({author: context.user.username, content: message, id: resp.messageId});
				
				var chat = document.getElementById("chat");
				if (!chat)
					return;
				var discussion = chat.querySelector(".discussion");
				if (discussion.dataset.username !== target)
					return;
				var discussion_content = discussion.querySelector(".discussion-content");
				discussion_content.appendChild(buildMessage(message, "right"));
				discussion_content.scrollTo(0, discussion_content.scrollHeight);
			} else {
				persistError(context, getLang(context, resp.error));
				pushPersistents(context);
			}
		})
	}
}

function ReceiveMessage(context, data) {
	var chat = document.getElementById("chat");
	var discussion = chat && chat.querySelector(".discussion") || null
	if (!cache[data.from])
		cache[data.from] = {};
	if (chat && chat.style.display != "none" && discussion.dataset.username == data.from)
	{
		if (!cache[data.from].discussion)
			cache[data.from].discussion = [];
		if (!cache[data.from].discussion.find(e => e.id == data.messageId))
		{
			cache[data.from].discussion.push({author: data.from, content: data.content, id: data.messageId});

			var discussion_content = discussion.querySelector(".discussion-content");
			discussion_content.appendChild(buildMessage(data.content, "left"));
		}
	}
	else if (chat) {
		if (!cache[data.from].unreadMessage)
			cache[data.from].unreadMessage = 0;
		cache[data.from].unreadMessage++;
		OnNotification();
		refreshNotificationNumber(chat.querySelector(`.friendBox[data-username="${data.from}"]`), data.from);
	}
}

function openDiscussion(context, username, chat = null) {
	if (!chat)
		chat = document.getElementById("chat");
	if (!chat)
		return;
	var discussion = chat.querySelector(".discussion");
	openedDiscussion = username;
	if (discussion && username) {
		discussion.dataset.username = username;
		var profilePicture = discussion.querySelector(".discussion-header img");
		var discussion_content = discussion.querySelector(".discussion-content");
		var input = discussion.querySelector("#discussion-input");

		while (discussion_content.firstChild)
			discussion_content.removeChild(discussion_content.firstChild);
		function refreshMessages(messages) {
			if (discussion.dataset.username === username)
			{
				while (discussion_content.firstChild) // twice if message sent or received during fetch
					discussion_content.removeChild(discussion_content.firstChild);
				messages.forEach(data => {
					discussion_content.appendChild(buildMessage(data.content, data.author === username ? 'left' : 'right'));
				})
				discussion_content.scrollTo(0, discussion_content.scrollHeight);
			}
		}

		if (username !== "-system") {
			if (!cache[username])
				cache[username] = {};
			cache[username].unreadMessage = 0;
			refreshNotificationNumber(chat.querySelector(`.friendBox[data-username="${username}"]`), username);
			discussion.querySelector(".discussion-header span").innerText = cache[username].full_name || username;
			profilePicture.onclick = () => {
				redirect(`/profile/${username}`);
			}
			if (cache[username].picture)
				profilePicture.src = cache[username].picture;
			profilePicture.style.display = "block";

			if (!cache[username].discussion)
			{
				cache[username].discussion = [];
				postJson(context, '/api/message/get', {
					channelType: 0,
					target: username,
				})
				.then(resp => {
					console.log(resp)
					if (resp.ok) {
						cache[username].discussion = cache[username].discussion
							.concat(resp.messages)
							.filter((value, index, arr) => {
								return index === arr.findIndex(e => e.id === value.id);
							})
							.sort((a, b) => a.id - b.id);
						refreshMessages(cache[username].discussion);
					} else {
						persistError(context, getLang(context, resp.error));
						pushPersistents(context);
					}
				})
			}
			else
				refreshMessages(cache[username].discussion);
			input.onkeydown = (event) => {
				if (event.keyCode === 13 && !event.shiftKey) {
					event.preventDefault();
					sendMessage(context, username, input.value);
					input.value = "";
					input.oninput();
				}
			}
			input.disabled = false;
			discussion.querySelector("#chat-friendMenu").style.display = "block";
		} else {
			// todo refreshNotificationNumberSystem
			discussion.querySelector(".discussion-header span").innerText = "System notification"; // todo lang same in div
			profilePicture.style.display = "none";
			refreshMessages(systemNotifications.messages); // todo system messages
			input.disabled = true;
			discussion.querySelector("#chat-friendMenu").style.display = "none";
			systemNotifications.unread = 0;
			chat.querySelector("#systemMessages .notificationNumber").style.display = "none";
		}
		OnNotification();


		discussion.querySelector("#chat-friendMenu").classList.remove("open");
		let discussionMenu = discussion.querySelector(".discussion-menu")
		discussionMenu.style.marginTop = -discussionMenu.offsetHeight + "px";
		discussion.querySelector(".discussion-header").style.display = "flex";
		discussion_content.style.display = "flex";
		discussion.querySelector(".discussion-footer").style.display = "block";
	}
}

function closeDiscussion(discussion = null) {
	openedDiscussion = null;
	if (!discussion)
		discussion = document.getElementById("chat").querySelector(".discussion");
	if (discussion) {
		discussion.dataset.username = undefined;
		discussion.querySelector(".discussion-header").style.display = "none";
		discussion.querySelector(".discussion-content").style.display = "none";
		discussion.querySelector(".discussion-footer").style.display = "none";
		discussion.querySelector("#chat-friendMenu").classList.remove("open");
		let discussionMenu = discussion.querySelector(".discussion-menu")
		discussionMenu.style.marginTop = -discussionMenu.offsetHeight + "px";
	}
}

function RefreshFriendList(context, chatBox = null) {
	if (!chatBox)
		chatBox = document.getElementById("chat");
	if (!chatBox)
		return;

	var addFriendButton = chatBox.querySelector("#addFriendButton");
	if (searchInput == "" || searchInput == context.user.username || (context.chat.FriendList != null && context.chat.FriendList.find(f => (f.username == searchInput))))
		addFriendButton.style.display = "none";
	else
		addFriendButton.style.display = "block";

	var friendList = chatBox.querySelector("#chat-friendList");
	while (friendList.firstChild)
		friendList.removeChild(friendList.firstChild);

	if (context.chat.FriendList != null) {
		context.chat.FriendList.sort((a, b) => (a.pending == b.pending) ? a.username.localeCompare(b.username) : a.pending - b.pending);
		context.chat.FriendList.forEach(friend => {
			let friendButton = templates["friendBox"].cloneNode(true);
			friendButton.dataset.username = friend.username;
			let usernameSpan = friendButton.querySelector('span');
			usernameSpan.innerText = (cache[friend.username] && cache[friend.username].full_name) ? cache[friend.username].full_name : friend.username;
			
			let friendImg = friendButton.querySelector('img');
			if (cache[friend.username] && cache[friend.username].picture)
				friendImg.src = cache[friend.username].picture
			friendButton.onclick = (e) => openDiscussion(context, e.currentTarget.dataset.username);
			friendList.appendChild(friendButton);
			let online = cache[friend.username] ? cache[friend.username].online : false;
			friendButton.querySelector('.playerStatusImage .online').style.display = online ? "block" : "none";
			if (!cache[friend.username] || !cache[friend.username].full_name) {
				getJson(context, `/api/user/${friend.username}`).then(res => {
					if (!cache[friend.username])
						cache[friend.username] = {}
					cache[friend.username].full_name = res.firstName + " " + res.lastName;
					cache[friend.username].picture = res.picture;
					usernameSpan.innerText = (cache[friend.username] && cache[friend.username].full_name) ? cache[friend.username].full_name : friend.username;
					friendImg.src = cache[friend.username].picture;

					var discussion = chatBox.querySelector(".discussion");
					
					if (discussion.dataset.username == friend.username)
					{
						discussion.querySelector(".discussion-header span").innerText = cache[username].full_name;
						discussion.querySelector(".discussion-header img").src = cache[username].picture;
					}
				})
			}
			refreshNotificationNumber(friendButton, friend.username);
		});
		if (openedDiscussion) {
			if (!context.chat.FriendList.find(e => e.username === openedDiscussion))
				closeDiscussion(chatBox.querySelector('.discussion'));
			else
				refreshFriendMenuButtons(context, openedDiscussion, chatBox);
		}
		for (var friend in cache)
			if (!context.chat.FriendList.find(e => e.username === friend))
				delete cache[friend];
	}
}

function refreshFriendMenuButtons(context, username, ChatBox = null) {
	if (!ChatBox)
		ChatBox = document.getElementById("chat");
	if (!ChatBox)
		return;

	var inviteBtn = ChatBox.querySelector("#InviteFriend");
	var acceptBtn = ChatBox.querySelector("#AcceptFriend");
	var denyBtn = ChatBox.querySelector("#DenyFriend");
	var removeBtn = ChatBox.querySelector("#RemoveFriend");
	var cancelBtn = ChatBox.querySelector("#CancelFriend");
	var blockBtn = ChatBox.querySelector("#BlockFriend");
	var friend = context.chat.FriendList.find(f => f.username === username);
	console.log(username);
	console.log(friend);
	console.log(context.chat.FriendList);
	
	// 0: not friend
	// 1: waiting friend to accept
	// 2: pending friend request
	// 3: friend
	var state = 0;
	if (friend) {
		if (friend.pending)
			state = 2 - friend.myRequest;
		else
			state = 3;
	}

	var removeFriend = () => {
		postJson(context, '/api/friends/remove', {
			target: username
		}).then(res => {
			if (res.ok) {
				persistSuccess(context, getLang(context, res.success));
				pushPersistents(context);

			} else {
				persistError(context, getLang(context, res.error));
				pushPersistents(context);
			}
		})
	}

	if (state == 2) {
		denyBtn.style.display = "block";
		acceptBtn.style.display = "block";
		denyBtn.onclick = removeFriend;
		acceptBtn.onclick = (event) => {
			sendFriendRequest(context, username, ChatBox);
		};
	} else {
		denyBtn.style.display = "none";
		acceptBtn.style.display = "none";
		denyBtn.onclick = undefined;
		acceptBtn.onclick = undefined;
	}

	if (state == 1) {
		cancelBtn.style.display = "block";
		cancelBtn.onclick = removeFriend;
	} else {
		cancelBtn.style.display = "none";
		cancelBtn.onclick = undefined;
	}

	if (state == 3) {
		removeBtn.style.display = "block";
		removeBtn.onclick = removeFriend;
	} else {
		removeBtn.style.display = "none";
		inviteBtn.style.display = "none";
	}

	var playContent = document.getElementById("playid-content");
	if (state == 3 && playContent) {
		inviteBtn.style.display = "block";
		inviteBtn.onclick = () => {
			var message = '`' + JSON.stringify({type: "gameInvite", gameId: playContent.dataset.uid}) + '`';
			sendMessage(context, username, message);
		}

	} else {
		inviteBtn.style.display = "none";
		inviteBtn.onclick = undefined
	}

	blockBtn.style.display = "block";
	blockBtn.onclick = () => {
		postJson(context, '/api/friends/block', {
			target: username
		}).then(res => {
			if (res.ok) {
				persistSuccess(context, getLang(context, res.success));
				pushPersistents(context);
				delete cache[username];
				if (context.chat.FriendList)
					context.chat.FriendList = context.chat.FriendList.filter(e => e.username !== username);
				RefreshFriendList(context, ChatBox);
			} else {
				persistError(context, getLang(context, res.error));
				pushPersistents(context);
			}
		})
	}

	let friendMenuBtn = ChatBox.querySelector("#chat-friendMenu")
	if (!friendMenuBtn.classList.contains("open")) {
		
		let discussionMenu = ChatBox.querySelector(".discussion-menu")
		discussionMenu.style.transition = "unset";
		discussionMenu.style.marginTop = -discussionMenu.offsetHeight + "px";
		discussionMenu.getBoundingClientRect(); // fuck you es6 FUUUCK (weird way to make a html flushing to prevent removeProperty before correctly set marginTop)
		discussionMenu.style.removeProperty("transition");
	}
}

function sendFriendRequest(context, target, ChatBox) {
	postJson(context, "/api/friends/add", {
		target: target,
	}).then(data => {
		if (data.ok) {
			persistSuccess(context, getLang(context, data.success));
			pushPersistents(context);
			var friend = context.chat.FriendList.find(e => e.username == target);
			if (!friend) {
				friend = {username: target, pending: false};
				context.chat.FriendList.push(friend);
			}
			else
				friend.pending = false;
			if (data.success == 'successes.FriendRequestSent') {
				friend.myRequest = true;
				friend.pending = true;
			}
			RefreshFriendList(context, ChatBox);
		} else {
			persistError(context, getLang(context, data.error));
			pushPersistents(context);
		}
	})
	RefreshFriendList(context, ChatBox);
}

function Chat(context) {
	// todo disable chat if socket disconnected and send persistent
	let div = document.createElement("div");
	div.id = "chat"
	if (enabled)
		div.classList.remove('hidden')
	else
		div.classList.add('hidden')
	div.innerHTML = /* html */`
		<div class="chat-container">
			<div class="chat-header">
				<span>Chat</span>
			</div>
			<div class="chat-navbar">
				<input type="text" id="chat-searchBox" />
				<div id="systemMessages">
					<span class="notSelectable">System notification</span> <!-- todo lang -->
					<div class="notificationNumber"></div>
				</div>
				<div id="chat-friendList"></div>
			</div>
			<div class="discussion">
				<div class="discussion-header">
					<img class="profilePicture notSelectable" src="/static/img/user.svg" onerror="profilePictureNotFound(this)">
					<span></span>
					<div id="chat-friendMenu">
						<img class="notSelectable" src="/static/img/menu.svg">
					</div>
				</div>
				<div class="discussion-content">
				</div>
				<div class="discussion-footer">
					<textarea id="discussion-input" rows=1></textarea>
				</div>
				<div class="discussion-menu-container">
					<div class="discussion-menu">
						<!-- todo langs -->
						<button id="InviteFriend">Invite friend</button> 
						<button id="AcceptFriend">Accept friend request</button>
						<button id="DenyFriend">Deny friend request</button>
						<button id="CancelFriend">Cancel friend request</button>
						<button id="RemoveFriend">Remove friend</button>
						<button id="BlockFriend">Block user</button>
					</div>
				</div>
			</div>
		</div>
	`;
	var navBar = div.querySelector(".chat-navbar");
	var addFriendButton = templates["friendBox"].cloneNode(true);
	addFriendButton.id = "addFriendButton";
	addFriendButton.querySelector("span").innerText = "Add Friend"; // todo langs
	addFriendButton.onclick = () => {
		sendFriendRequest(context, searchInput, div);
	}
	navBar.insertBefore(addFriendButton, div.querySelector("#systemMessages"));

	var searchBox = div.querySelector("#chat-searchBox");
	searchBox.value = searchInput;
	searchBox.oninput = (event) => {
		searchInput = event.target.value;
		RefreshFriendList(context, div);
	}

	let textInput = div.querySelector("#discussion-input");
	textInput.style.height = textInput.scrollHeight + "px";
	textInput.oninput = () => {
		textInput.style.height = 'auto';
		textInput.style.height = textInput.scrollHeight + "px";
	}
	
	var discussionMenu = div.querySelector(".discussion-menu");
	div.querySelector("#chat-friendMenu").addEventListener("click", (event) => {
		var username = event.target.parentElement.parentElement.parentElement;
		if (username) {
			
			var friendMenu = div.querySelector("#chat-friendMenu");
			refreshFriendMenuButtons(context, username.dataset.username, div);
			if (friendMenu.classList.contains("open")) {
				friendMenu.classList.remove("open");
				discussionMenu.style.marginTop = -discussionMenu.offsetHeight + "px";
			} else {
				friendMenu.classList.add("open");
				discussionMenu.style.marginTop = "0";
			}
		}
	})

	div.querySelector("#systemMessages").addEventListener("click", (event) => {
		openDiscussion(context, '-system', div);
	})
	
	RefreshFriendList(context, div);
	if (!context.user.isAuthenticated)
		ToggleChat(false, div);
	else
		ToggleChat(enabled, div);
	if (openedDiscussion && enabled)
		openDiscussion(context, openedDiscussion, div);

	var sysNotifNbDiv = div.querySelector("#systemMessages .notificationNumber");
	if ((openedDiscussion == '-system' && enabled) || systemNotifications.unread == 0) {
		sysNotifNbDiv.style.display = "none";
	} else {
		sysNotifNbDiv.style.display = "block";
		sysNotifNbDiv.innerText = systemNotifications.unread > 9 ? "9+" : systemNotifications.unread;
	}
	
	return div;
}

function ToggleChat(toggle = undefined, chat = null) {
	if (toggle === undefined)
		toggle = !enabled;
	console.log("chat toggle", toggle, enabled)
	enabled = toggle;
	if (chat == null)
		chat = document.getElementById("chat");
	if (chat) {
		chat.style.pointerEvents = toggle ? "unset" : "none";
		if (toggle)
			chat.querySelector('.chat-container').classList.remove("hidden");
		else
			chat.querySelector('.chat-container').classList.add("hidden");
		if (!toggle)
			closeDiscussion(chat.querySelector(".discussion"));
	}
}

function SetPlayerStatus(context, username, status) {
	if (!cache[username])
		cache[username] = {};
	cache[username].online = status;

	var chat = document.getElementById("chat");
	if (chat) {
		var friendListUser = chat.querySelector(`.friendBox[data-username="${username}"]`)
		console.log("set status of ", username, status, friendListUser);
		if (friendListUser)
			friendListUser.querySelector(".playerStatusImage .online").style.display = status ? "block" : "none";
	}
}

function OnTournamentMathStart(gameUid) {
	var message = '`' + JSON.stringify({
		'type': 'tournamentMatchStart',
		'gameUid': gameUid
	}) + '`';
	systemNotifications.messages.push({
		content: message,
		author: '-system'
	});
	var chat = document.getElementById("chat");
	var discussion_content = chat ? chat.querySelector(".discussion-content") : undefined;
	if (openedDiscussion !== "-system" || !discussion_content) {
		systemNotifications.unread++;
		OnNotification();
		var notifNbDiv = chat.querySelector("#systemMessages .notificationNumber");
		notifNbDiv.style.display = "block";
		notifNbDiv.innerText = systemNotifications.unread > 9 ? "9+" : systemNotifications.unread;
	} else {
		discussion_content.appendChild(buildMessage(message, "left"));
		discussion_content.scrollTo(0, discussion_content.scrollHeight);
	}
}

export {
	Chat,
	ToggleChat,
	RefreshFriendList,
	ReceiveMessage,
	SetPlayerStatus,
	GetNotificationsNumber,
	OnTournamentMathStart,
}




// templates

const templates = {
	"friendBox": document.createElement("div"),
}

templates["friendBox"].classList.add("friendBox");
templates["friendBox"].innerHTML = /*html*/`
	<div class="playerStatusImage">
		<img class="notSelectable" src="/static/img/user.svg" onerror="profilePictureNotFound(this)">
		<div class="online"></div>
	</div>
	<span></span>
	<div class="notificationNumber"></div>
`;

window.profilePictureNotFound = (img) => {
	console.log("[🔀] Fixing profile picture error")
	if (img.dataset.default == undefined)
		img.dataset.default = "/static/img/user.svg";
	if (img.src != img.dataset.default)
		img.src = img.dataset.default;
}
