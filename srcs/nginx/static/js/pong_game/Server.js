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

import { initPlayerText } from "./map.js";
import { Particle } from "./Particle.js";
import { destroyScene, destroyObject, initScene } from './main.js';
import { getLang, global_context, persistError, redirect } from '../script.js';
import { remWaiting } from '../pages/Pong.js';
import { setWaitingTotalPlayerCount, setWaitingPlayerCount } from '../pages/Pong.js'; // used for eval !
import { refresh } from "../script.js";
import { postJson } from '../utils.js';
import { pushPersistents } from '../components/Persistents.js';


class Server
{
	constructor(scene, uid)
	{
		this.scene = scene;
		this.uid = uid

		this.lobby_id = 0;
		this.client_id = 0;

		this.socket = new WebSocket('wss://' + window.location.host + '/ws/pong');
		this.socket.addEventListener('message', (event) => this.onMessage(this.scene, event));
		this.socket.addEventListener('open', (event) => this.onOpen(this.scene, event));
	}

	newPlayer(player_id, player_name, position=null)
	{
		console.log("CONNECT PLAYER " + player_id);
		let player = this.scene.get(player_id);
		if (player == null)
			return;
		if (Number(player_id.replace("player", "")) >= this.scene.player_num - 1)
			remWaiting();

		initPlayerText(this.scene, player, player_name);

		player.mesh.visible = true;
		if (position)
		{
			let computed_position = new THREE.Vector3(
				position[0],
				player.mesh.position.y,
				position[1]
			)
			player.mesh.position.copy(computed_position);
		}
	}

	disconnectPlayer(player_id)
	{
		console.log("DISCONNECT PLAYER " + player_id);
		let player = this.scene.get(player_id);
		if (player == null)
			return;

		let player_text = this.scene.get(player_id + "text");
		let player_text_score = this.scene.get(player_id + "textscore");

		this.scene.remove(player_text_score);
		destroyObject(player_text);
		player.mesh.visible = false;

		console.log("Player disconnected");
	}

	BRDied(player_id)
	{
		const my_id = "player" + this.client_id;
		if (player_id == my_id)
		{
			setTimeout(() => {
				destroyScene();
				refresh();
			}, 3000);
		}
	}

	TOFTDied(player_id)
	{
		const player = this.scene.get(player_id);
		const camera_old_position = this.scene.camera.camera_old_position;

		setTimeout(() => {
			this.scene.camera.setPosition(camera_old_position.x, camera_old_position.y, camera_old_position.z, 0, 0, 0, true);
			player.mesh.material.emissiveIntensity = 3;
		}, 1000);
	}

	playerDead(player_id)
	{
		const player = this.scene.get(player_id);
		const position = player.init_position.clone();

		player.mesh.material.emissiveIntensity = 0;

		let camera_look_at = position.clone().add(new THREE.Vector3(0, 0.5, 0));
		let camera_position = position.clone()
		let direction_to_center = new THREE.Vector3(0, 0, 0).sub(camera_position).normalize();
		camera_position.add(direction_to_center.multiplyScalar(5));
		camera_position.y = 2;

		this.scene.camera.setPosition(camera_position.x, camera_position.y, camera_position.z,
			camera_look_at.x, camera_look_at.y, camera_look_at.z, true);

		for (let i = 0; i < 100; i++)
		{
			let randomPosition = position.clone().add(new THREE.Vector3(Math.random() * 0.2 - 0.1,Math.random() * 0.2 - 0.1,Math.random() * 0.2 - 0.1));
			let direction = randomPosition.clone().sub(position).multiplyScalar(13*4);
			let acceleration = direction.clone().multiplyScalar(-1.8*4);

			let accDec = 0.95

			let radius = Math.random() * 0.02 + 0.005;
			let color = player.mesh.material.color;
			color = new THREE.Color(color).offsetHSL(0, 0, Math.random() * 0.2 - 0.1);

			let particle = new Particle(this.scene, randomPosition, direction, acceleration, accDec,
				radius, {color: color}, 2, "particleExplosion");
			particle.addUpdate(Particle.updatePhysics);
			particle.addUpdate(Particle.updateFadeOpacity);
			particle.addUpdate(Particle.updateRemoveOnFade);

			this.scene.entities.push(particle);
		}

		if (this.scene.game_mode == "BR")
			this.BRDied(player_id);
		else if (this.scene.game_mode == "TO" || this.scene.game_mode == "FT")
			this.TOFTDied(player_id);
	}

	onOpen(scene, event)
	{
		console.log('WebSocket connection established.');
		this.sendData("uid", this.uid, "username", global_context.user.username);
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
		if (message.game_status)
			scene.updateGameStatus(message.game_status);
		if (message.error)
		{
			persistError(window.context, getLang(window.context, message.error));
			redirect("/play");
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
		if (this.socket !== WebSocket.CLOSED && this.socket !== WebSocket.CLOSING)
			this.socket.send(JSON.stringify(message));
	}
}


export { Server };
