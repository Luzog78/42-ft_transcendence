/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   chatConnexion.js                                   :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: psalame <psalame@student.42angouleme.fr    +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2024/06/19 21:26:51 by psalame           #+#    #+#             */
/*   Updated: 2024/06/19 21:26:51 by psalame          ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */

class ChatConnexion
{
	//* intern *\\

	constructor()
	{
		const _this = this;
		this.onOpenCb = null;
		this.connected = false;
		this.authenticated = false;
		this.actualFrontendId = 0;
		this.waitingResponses = []; // list of [frontendId, promiseRes, promiseRej]
		this.socket = new WebSocket('ws://' + window.location.host + '/ws/chat');

		this.socket.onopen = function(e) {
			console.log("Chat socket opened");
			_this.connected = true;
			if (_this.onOpenCb)
				_this.onOpenCb();
		};
		this.socket.onmessage = function(e) {
			var data = JSON.parse(e.data);
			if (data.type == "response")
				_this._on_response(data);
			else if (data.type == "new_private_message")
				_this._on_private_message(data);
			else
			{
				console.log("TODO new notification: " + data.type + " - " + data.message, e);
				// todo
			}
		};
		this.socket.onclose = function(e) {
			console.log("Chat socket closed, code: " + e.code + ", reason: " + e.reason + "."); // have to be reconnected
			_this.connected = false;
		};
		this.socket.onerror = function(e) {
			console.log("Socket error code " + e.code + ": " + e.reason + ".");
		};
	}

	_on_response(data)
	{
		var waitingResponse = this.waitingResponses.find((element) => element[0] == data.frontendId);
		if (waitingResponse)
		{
			if (data.ok)
				waitingResponse[1](data.response);
			else
				waitingResponse[2](data.error);
			this.waitingResponses = this.waitingResponses.filter((element) => element[0] != data.frontendId);
		}
		else
			console.log("Received response for unknown frontendId: " + data.frontendId);
	}

	_on_private_message(data)
	{
		console.log("TODO new message from : "  + data.from + " - " + data.content);
	}


	//* public *\\

	onOpen(callback)
	{
		if (this.connected)
			callback();
		else
			this.onOpenCb = callback;
	}

	// ChatConnexion.triggerCallback usage:
	/// 	ChatConnexion.triggerCallback({content}
	/// 		.then(resp => {})
	/// 		.catch(err => {});
	//// or with await and try catch
	triggerCallback(request)
	{
		const _this = this;
		var currentFrontendId = this.actualFrontendId++; // async pause protection
		request.frontendId = currentFrontendId;
		var promise = new Promise((resolve, reject) => {
			_this.waitingResponses.push([currentFrontendId, resolve, reject]);
		});
		this.socket.send(JSON.stringify({ frontendId: currentFrontendId, ...request }));
		return promise;
	}

	authenticate(JWToken)
	{
		const _this = this;
		return new Promise((resolve, reject) => {
			_this.triggerCallback({ type: "authenticate", 'authorization': JWToken })
				.then(() => {
					_this.authenticated = true;
					resolve();
				})
				.catch(err => {
					reject(err);
				});
		});
	}

	getAllMessages()
	{
		if (!this.authenticated)
			return new Promise((_, rej) => rej({error: 'errors.notAuthenticated'}));
		return this.triggerCallback({ type: "get_previous_messages" });
	}

	sendMessage(target, content)
	{
		if (!this.authenticated)
			return new Promise((_, rej) => rej({error: 'errors.notAuthenticated'}));
		return this.triggerCallback({ type: "send_message", target: target, content: content });
	}

	sendGameMessage(gameId, content)
	{
		if (!this.authenticated)
			return new Promise((_, rej) => rej({error: 'errors.notAuthenticated'}));
		return this.triggerCallback({ type: "send_game_message", gameId: gameId, content: content });
	}
}


export { ChatConnexion };
