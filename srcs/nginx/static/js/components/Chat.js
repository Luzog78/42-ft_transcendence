/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   Chat.js                                            :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: psalame <psalame@student.42.fr>            +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2024/07/12 13:19:04 by psalame           #+#    #+#             */
/*   Updated: 2024/07/13 12:14:30 by psalame          ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */


// main code

var enabled = true; // todo set to false by default
var searchInput = "";

function refreshFriendList(context, chatBox = null) {
	if (!chatBox)
		chatBox = document.getElementById("chat");
	if (!chatBox)
		return;

	var addFriendButton = chatBox.querySelector("#addFriendButton");
	if (searchInput == "" || false) // todo check if already in friend list
		addFriendButton.style.display = "none";
	else
	{
		
		addFriendButton.style.display = "block";
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
				<input type="text" id="chat-searchBox">
				</input>
			</div>
			<div class="discussion">
			</div>
		</div>
	`;
	var navBar = div.querySelector(".chat-navbar");
	var addFriendButton = templates["friendBox"].cloneNode(true);
	addFriendButton.id = "addFriendButton";
	addFriendButton.querySelector("span").innerText = "Add Friend";
	navBar.appendChild(addFriendButton);
	
	var searchBox = div.querySelector("#chat-searchBox");
	searchBox.value = searchInput;
	searchBox.oninput = (event) => {
		searchInput = event.target.value;
		refreshFriendList(div);
	}
	refreshFriendList(div);
	
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
}




// templates

const templates = {
	"friendBox": document.createElement("div"),
}

templates["friendBox"].classList.add("friendBox");
templates["friendBox"].innerHTML = `
	<img class="notSelectable" data-default="/static/img/user.svg" src="/static/img/user.svg" alt="Menu" id="menu-trigger">
	<span></span>
`;
templates["friendBox"].firstChild.onerror = (event) => {
	if (event.target != null) {
		var img = event.target;
		if (img.src != img.dataset.default)
			img.src = img.dataset.default;
	}
}
