/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   Chat.js                                            :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: psalame <psalame@student.42angouleme.fr    +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2024/07/12 13:19:04 by psalame           #+#    #+#             */
/*   Updated: 2024/07/14 18:52:33 by psalame          ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */

import { persistSuccess, persistError, getLang } from "../script.js";
import { pushPersistents } from "./Persistents.js";


// main code

var enabled = true; // todo set to false by default
var searchInput = "";

function openDiscussion(event) {
	var discussion = document.getElementById("chat").querySelector(".discussion");
	var username = event.currentTarget.dataset.username;
	if (discussion && username) {
		discussion.dataset.username = username;
		discussion.querySelector(".discussion-header span").innerText = username;

		discussion.querySelector(".discussion-header").style.display = "block";
		discussion.querySelector(".discussion-content").style.display = "block";
		discussion.querySelector(".discussion-input").style.display = "block";
	}
}

function closeDiscussion() {
	var discussion = document.getElementById("chat").querySelector(".discussion");
	discussion.dataset.username = undefined;
	if (discussion) {
		discussion.querySelector(".discussion-header").style.display = "none";
		discussion.querySelector(".discussion-content").style.display = "none";
		discussion.querySelector(".discussion-input").style.display = "none";
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
			friendButton.querySelector('span').innerText = friend.username;
			friendButton.onclick = openDiscussion;
			friendList.appendChild(friendButton);
		});
	}
}

function Chat(context) {
	let div = document.createElement("div");
	div.id = "chat"
	div.style.display = enabled ? "block" : "none";
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
				<div class="discussion-input">
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
			persistError(context, getLang(context, "errors.ChatNotConnected")); // todo lang
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
	RefreshFriendList(context, div);
	
	if (!context.user.isAuthenticated)
		ToggleChat(false, div);
	return div;
}

function ToggleChat(toggle, chat = null) {
	if (enabled == toggle)
		return ;
	enabled = toggle;
	if (chat == null)
		chat = document.getElementById("chat");
	if (chat)
		chat.style.display = toggle ? "block" : "none";
}

export {
	Chat,
	ToggleChat,
	RefreshFriendList,
}




// templates

const templates = {
	"friendBox": document.createElement("div"),
}

templates["friendBox"].classList.add("friendBox");
templates["friendBox"].innerHTML = `
	<img class="notSelectable" src="/static/img/user.svg" alt="Menu" id="menu-trigger" onerror="profilePictureNotFound(this)">
	<span></span>
`;
window.profilePictureNotFound = (img) => {
	console.log("fixing image error")
	if (img.dataset.default == undefined)
		img.dataset.default = "/static/img/user.svg";
	if (img.src != img.dataset.default)
		img.src = img.dataset.default;
}
