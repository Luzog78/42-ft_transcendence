/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   Server.js                                          :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: marvin <marvin@student.42.fr>              +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2024/06/14 13:23:25 by marvin            #+#    #+#             */
/*   Updated: 2024/06/14 13:23:25 by marvin           ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */

class Server
{
	constructor(scene)
	{
		this.scene = scene;

		this.lobby_id = 0;
		this.client_id = 0;

		this.socket = new WebSocket('ws://' + window.location.host + '/ws/pong');
		this.socket.addEventListener('message', (event) => this.onMessage(this.scene, event));
		this.socket.addEventListener('open', (event) => this.onOpen(this.scene, event));
	}

	onOpen(scene, event)
	{
		console.log('WebSocket connection established.');
	}

	onMessage(scene, event)
	{
		const message = JSON.parse(event.data);
		console.log('Received message:', message);

		if (message.modify)
			for (const [key, value] of Object.entries(message.modify))
				eval(key + " = " + value + ";");
		else if (message.call)
		{
			let args = message.call.args;
			for (let i = 0; i < args.length; i++)
				if (typeof args[i] === "object")
					args[i] = JSON.stringify(args[i]);
			let functionCall = `${message.call.command}(${args.join(', ')})`;
			eval(functionCall)
		}

	}

	send(message)
	{
		this.sendData("message", message);
	}
	sendData(...args)
	{
		const data = {};
		for (let i = 0; i < args.length; i += 2) {
			const key = args[i];
			const value = args[i + 1];
			data[key] = value;
		}

		data["lobby_id"] = this.lobby_id;
		data["client_id"] = this.client_id;

		this.sendJson(data);
	}
	sendJson(message)
	{
		this.socket.send(JSON.stringify(message));
	}
}

export { Server }