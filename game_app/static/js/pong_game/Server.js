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
		
		this.socket = new WebSocket('ws://' + window.location.host + '/ws/pong');
		this.socket.addEventListener('message', (event) => this.onMessage(this.scene, event));
		this.socket.addEventListener('open', (event) => this.onOpen(this.scene, event));
	}

	onOpen(scene, event)
	{
		console.log('WebSocket connection established.');
		scene.server.send("Hello, server!");
	}

	onMessage(scene, event)
	{
		const message = JSON.parse(event.data);
		console.log('Received message:', message);

		//will be handled differently later
		if (!message.modify)
			return ;
		for (const [key, value] of Object.entries(message.modify))
		{
			let keysplit = key.split(".");
			
			let element = keysplit[0];
			let string_attributes = "";

			for(let attributes of keysplit.slice(1, keysplit.length))
				string_attributes += "." + attributes;
			eval("scene.get('" + element + "')" + string_attributes + " = " + value + ";");
		}
	}

	send(message)
	{
		this.sendData("message", message, "time", Date.now());
	}
	sendData(...args)
	{
		const data = {};
        for (let i = 0; i < args.length; i += 2) {
            const key = args[i];
            const value = args[i + 1];
            data[key] = value;
        }

		this.sendJson(data);
	}
	sendJson(message)
	{
		this.socket.send(JSON.stringify(message));
	}
}

export { Server }