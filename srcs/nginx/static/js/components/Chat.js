/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   Chat.js                                            :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: psalame <psalame@student.42.fr>            +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2024/07/12 13:19:04 by psalame           #+#    #+#             */
/*   Updated: 2024/07/12 16:22:41 by psalame          ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */

var enabled = true; // todo set to false by default
var searchInput = "";

function refreshFriendList(context) {
	
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
	`

	var searchBox = document.getElementById("chat-searchBox");
	console.log(searchBox);
	if (searchBox) {
		searchBox.value = searchInput;
		searchBox.oninput = (event) => {
			searchInput = event.value;
			console.log("new search value: ", searchInput);
			refreshFriendList();
		}
	}
	refreshFriendList();
	
	if (!context.user.isAuthenticated)
		ToggleChat(false);
	return div;
}

function ToggleChat(toggle) {
	if (enabled == toggle)
		return ;
	enabled = toggle;
	let chat = document.getElementById("chat");
	if (chat)
		chat.style.display = toggle ? "block" : "none";
}

export {
	Chat,
	ToggleChat,
}