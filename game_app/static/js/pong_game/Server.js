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

import * as THREE from 'three';

import { initPlayerText, initMap } from "./map.js";
import { Particle } from "./Particle.js";
import { destroyObject } from './main.js';

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

	newPlayer(player_id, player_name)
	{
		let player = this.scene.get(player_id);
		player.player.visible = true;

		initPlayerText(this.scene, player, player_name);
	}

	playerDead(player_id)
	{
		let player = this.scene.get(player_id);

		for (let i = 0; i < 50; i++)
		{
			let position = player.init_position.clone();
			let randomPosition = position.clone().add(new THREE.Vector3(Math.random() * 0.2 - 0.1,Math.random() * 0.2 - 0.1,Math.random() * 0.2 - 0.1));
			let direction = randomPosition.clone().sub(position).multiplyScalar(30);
			let acceleration = direction.clone().multiplyScalar(-1.8);

			let accDec = 0.989

			let radius = Math.random() * 0.02 + 0.005;
			let color = player.player.material.color;
			color = new THREE.Color(color).offsetHSL(0, 0, Math.random() * 0.2 - 0.1);

			let particle = new Particle(this.scene, randomPosition, direction, acceleration, accDec,
				radius, {color: color}, 2, "particleExplosion");
			particle.addUpdate(Particle.updatePhysics);
			particle.addUpdate(Particle.updateFadeOpacity);
			particle.addUpdate(Particle.updateRemoveOnFade);

			this.scene.entities.push(particle);
		}

		if (this.scene.player_num == 2)
			return;

		destroyObject(this.scene);
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

	disconnect()
	{
		this.socket.close();
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


export { Server };
