/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   Chat.js                                            :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: psalame <psalame@student.42.fr>            +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2024/07/12 13:19:04 by psalame           #+#    #+#             */
/*   Updated: 2024/07/16 13:46:10 by psalame          ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */

import { persistSuccess, persistError, getLang, redirect } from "../script.js";
import { getJson } from "../utils.js";
import { pushPersistents } from "./Persistents.js";


// main code

var enabled = true; // todo set to false by default
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


function sendMessage(context, target, message) {
	if (context && message != "") {
		context.chat.ChatConnexion.sendMessage(target, message)
		.then(resp => {
			console.log(resp)
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
			var messageBloc = templates["message"].cloneNode(true);
			messageBloc.innerText = message;
			messageBloc.classList.add("right");
			var discussion_content = discussion.querySelector(".discussion-content");
			discussion_content.appendChild(messageBloc);
			discussion_content.scrollTo(0, discussion_content.scrollHeight);
		})
		.catch(err => {
			persistError(context, getLang(context, err));
			pushPersistents(context);
		})
	}
}

function ReceiveMessage(context, data) {
	var chat = document.getElementById("chat");
	var discussion = chat && chat.querySelector(".discussion") || null
	if (chat && chat.style.display != "none" && discussion.dataset.username == data.from)
	{
		if (!cache[data.from])
			cache[data.from] = {};
		if (!cache[data.from].discussion)
			cache[data.from].discussion = [];
		if (!cache[data.from].discussion.find(e => e.id == data.messageId))
		{
			cache[data.from].discussion.push({author: data.from, content: data.content, id: data.messageId});

			var messageBloc = templates["message"].cloneNode(true);
			messageBloc.innerText = data.content;
			messageBloc.classList.add("left");
			var discussion_content = discussion.querySelector(".discussion-content");
			discussion_content.appendChild(messageBloc);
		}
	}
}

function openDiscussion(context, username, discussion = null) {
	if (!discussion)
		discussion = document.getElementById("chat").querySelector(".discussion");
	openedDiscussion = username;
	if (discussion && username) {
		if (!cache[username])
			cache[username] = {};
		discussion.dataset.username = username;
		
		discussion.querySelector(".discussion-header span").innerText = cache[username].full_name || username;
		var profilePicture = discussion.querySelector(".discussion-header img");
		profilePicture.onclick = () => {
			redirect(`/profile/${username}`);
		}

		if (cache[username].picture)
			profilePicture.src = cache[username].picture;
		
		
		var discussion_content = discussion.querySelector(".discussion-content");
		while (discussion_content.firstChild)
			discussion_content.removeChild(discussion_content.firstChild);
		
		function refreshMessages() {
			if (discussion.dataset.username === username)
			{
				while (discussion_content.firstChild) // twice if message sent or received during fetch
					discussion_content.removeChild(discussion_content.firstChild);
				cache[username].discussion.forEach(data => {
					let msg = templates["message"].cloneNode(true);
					msg.classList.add(data.author === username ? 'left' : 'right');
					msg.innerText = data['content'];
					discussion_content.appendChild(msg);
				})
				discussion_content.scrollTo(0, discussion_content.scrollHeight);
			}
		}
		if (!cache[username].discussion)
		{
			cache[username].discussion = [];
			context.chat.ChatConnexion.getAllMessages(username)
			.then(messages => {
				cache[username].discussion = cache[username].discussion
					.concat(messages)
					.filter((value, index, arr) => {
						return index === arr.findIndex(e => e.id === value.id);
					})
					.sort((a, b) => a.id - b.id);
					refreshMessages();
			})
			.catch(err => {
				persistError(context, getLang(context, err));
				pushPersistents(context);
			})
		}
		else
			refreshMessages();
		var input = discussion.querySelector("#discussion-input");
		input.onkeydown = (event) => {
			if (event.keyCode === 13 && !event.shiftKey) {
				event.preventDefault();
				sendMessage(context, username, input.value);
				input.value = "";
				input.oninput();
			}
		}


		discussion.querySelector(".discussion-header").style.display = "block";
		discussion_content.style.display = "block";
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
					
					// todo check if current discussion is this one
				})
			}
		});
	}
}

function Chat(context) {
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
				<div id="chat-friendList"></div>
			</div>
			<div class="discussion">
				<div class="discussion-header">
					<img class="notSelectable" src="/static/img/user.svg" alt="Menu" id="menu-trigger" onerror="profilePictureNotFound(this)">
					<span></span>
				</div>
				<div class="discussion-content">
				</div>
				<div class="discussion-footer">
					<textarea id="discussion-input" rows=1></textarea>
				</div>
			</div>
		</div>
	`;
	var navBar = div.querySelector(".chat-navbar");
	var addFriendButton = templates["friendBox"].cloneNode(true);
	addFriendButton.id = "addFriendButton";
	addFriendButton.querySelector("span").innerText = "Add Friend";
	addFriendButton.onclick = () => {
		if (context.chat.ChatConnexion.authenticated)
		{
			context.chat.ChatConnexion.triggerCallback({type: 'add_friend', target: searchInput})
			.then(success => {
				persistSuccess(context, getLang(context, success));
				pushPersistents(context);
			})
			.catch(error => {
				persistError(context, getLang(context, error));
				pushPersistents(context);
			})
			RefreshFriendList(context, div);
		}
		else
		{
			persistError(context, getLang(context, "errors.chatNotConnected"));
			pushPersistents(context);
		}
	}
	navBar.insertBefore(addFriendButton, div.querySelector("#chat-friendList"));
	
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


	
	RefreshFriendList(context, div);
	if (!context.user.isAuthenticated)
		ToggleChat(false, div);
	if (openedDiscussion && enabled)
		openDiscussion(context, openedDiscussion, div.querySelector(".discussion"));
	return div;
}

function ToggleChat(toggle = undefined, chat = null) {
	if (toggle === undefined)
		toggle = !enabled;
	if (enabled == toggle)
		return ;
	enabled = toggle;
	if (chat == null)
		chat = document.getElementById("chat");
	if (chat) {
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


export {
	Chat,
	ToggleChat,
	RefreshFriendList,
	ReceiveMessage,
	SetPlayerStatus,
}




// templates

const templates = {
	"friendBox": document.createElement("div"),
	"message": document.createElement("p"),
}

templates["friendBox"].classList.add("friendBox");
templates["friendBox"].innerHTML = /*html*/`
	<div class="playerStatusImage">
		<img class="notSelectable" src="/static/img/user.svg" alt="Menu" onerror="profilePictureNotFound(this)">
		<div class="online"></div>
	</div>
	<span></span>
`;

templates["message"].classList.add("message");


window.profilePictureNotFound = (img) => {
	console.log("fixing image error")
	if (img.dataset.default == undefined)
		img.dataset.default = "/static/img/user.svg";
	if (img.src != img.dataset.default)
		img.src = img.dataset.default;
}
