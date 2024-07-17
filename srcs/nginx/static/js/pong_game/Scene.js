/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   Scene.js                                           :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: ycontre <ycontre@student.42.fr>            +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2024/06/07 17:17:28 by ycontre           #+#    #+#             */
/*   Updated: 2024/07/17 17:17:03 by ycontre          ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */

import * as THREE from 'three';

import * as RenderPass from 'renderpass';
import * as EffectComposer from 'effectcomposer';
import * as UnrealBloomPass from 'unrealbloompass';
import * as FontLoader from 'fontloader';
import * as Timer from 'timer';

import { Server } from "./Server.js";
import { initMap } from "./map.js";
import { Camera } from "./Camera.js";
import { Ball } from "./Ball.js";
import { remWaiting } from '../pages/Pong.js';
import { Spectator } from "./Spectator.js";
import { destroyScene } from "./main.js"
import { refresh } from '../script.js';


class Scene
{
	constructor()
	{
		this.scene = new THREE.Scene();
		this.renderer = new THREE.WebGLRenderer({antialias: true});
		this.camera = new Camera(this, this.renderer);

		this.server = null;
		this.spectator = null;

		this.interval_timer_id = 0
		this.segment_size = 4;
		this.player_num = 0;
		this.game_mode = undefined;

		this.balls = [];

		this.elements = {};
		this.entities = []

		this.timer = new Timer.Timer();
		this.dt = 0;

		this.font = null;
	}

	async init(uid)
	{
		this.font = await new Promise(res => new FontLoader.FontLoader().load('/static/js/pong_game/Braciola MS_Regular.json', res));

		this.renderer.shadowMap.enabled = true;
		this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
		this.renderer.setSize(window.innerWidth, window.innerHeight);
		document.body.appendChild(this.renderer.domElement);

		this.renderScene = new RenderPass.RenderPass(this.scene, this.camera.camera);
		this.composer = new EffectComposer.EffectComposer(this.renderer);
		this.composer.addPass(this.renderScene);

		var bloomPass = new UnrealBloomPass.UnrealBloomPass(
			new THREE.Vector2(window.innerWidth, window.innerHeight),
			0.4, 1.0, 0.5);
		this.composer.addPass(bloomPass);

		this.server = new Server(this, uid);
	}

	updateGameStatus(status)
	{
		if (status == "START")
		{
			if (this.player_num == 2 || this.game_mode == "BR" || this.game_mode == "FT")
				return ;
			const timer_text = this.get("timertext");
			this.interval_timer_id = setInterval(() => {
				const timer_split = timer_text.text.split(":");
				let minutes = parseInt(timer_split[0]);
				let seconds = parseInt(timer_split[1]);
				seconds -= 1;
				if (seconds < 0)
				{
					seconds = 59;
					minutes -= 1;
				}
				if (minutes < 0)
					clearInterval(interval_id);
				timer_text.updateText(minutes.toString().padStart(2, '0') + ":" + seconds.toString().padStart(2, '0'));
			}, 1000);
		}
		else if (status == "END")
		{
			destroyScene();
			refresh();
		}
	}

	initPlayer(player_num, theme, game_mode, time_left)
	{
		this.player_num = player_num;
		this.game_mode = game_mode;
		console.log("I'm player", this.server.client_id)
		console.log("Player num: " + player_num + " Game mode: " + game_mode);

		initMap(this, theme, time_left);

		let my_player = this.get("player" + this.server.client_id); // TODO: to change
		window.addEventListener("keydown", my_player.keydown_event_func);
		window.addEventListener("keyup", my_player.keyup_event_func);

		this.server.sendData("ready", []);
	}

	initSpectator(player_num, theme, game_mode, time_left)
	{
		this.player_num = player_num;
		this.game_mode = game_mode;
		console.log("I'm spectator");
		console.log("Player num: " + player_num + " Game mode: " + game_mode);

		initMap(this, theme, time_left);

		this.spectator = new Spectator(this);
		window.addEventListener("keydown", this.spectator.keydown_event_func);
		window.addEventListener("keyup", this.spectator.keyup_event_func);
	}

	update()
	{
		this.timer.update();
		this.dt = this.timer.getDelta();

		for (let el in this.entities)
			if (this.entities[el].update != undefined)
				this.entities[el].update(this);

		this.camera.update(this.camera.camera);
		this.composer.render();
	}

	getName(name="")
	{
		if (name.length == 0)
			name = Object.keys(this.elements).length;
		if (this.elements[name] != undefined)
			name = "_" + name;
		return name;
	}

	add(elements, name="")
	{
		if (name.length == 0)
			name = getName();
		this.elements[name] = elements;
		this.scene.add(elements);

		return elements;
	}

	get(name)
	{
		return this.elements[name];
	}

	addText(text, param, size, name="")
	{
		if (name.length == 0)
			name = "Text " + text;
		const shapes = this.font.generateShapes( text, size );
		const geometry = new THREE.ShapeGeometry( shapes );
		geometry.computeBoundingBox();
		const xMid = -0.5 * ( geometry.boundingBox.max.x - geometry.boundingBox.min.x );
		geometry.translate( xMid, 0, 0 );

		const matLite = new THREE.MeshBasicMaterial({
			side: THREE.DoubleSide,
			color: param.color
		});
		const textMesh = new THREE.Mesh( geometry, matLite );
		this.add(textMesh, name);

		return textMesh;
	}

	addBall(_)
	{
		let ball = new Ball(this, 0.15, {color: 0xffffff, emissive:0xffffff, emissiveIntensity:3}, "ball");
		this.balls.push(ball);
		this.entities.push(ball);
	}

	addSphere(radius, param, name="")
	{
		if (name.length == 0)
			name = "Sphere";
		name = this.getName(name);

		var geometry = new THREE.SphereGeometry(radius, 32, 32);
		var material = new THREE.MeshLambertMaterial(param);

		var sphere = new THREE.Mesh(geometry, material);
		sphere.castShadow = true;
		sphere.receiveShadow = true;

		return this.add(sphere, name);
	}

	addBox(width, height, depth, param, name="")
	{
		if (name.length == 0)
			name = "Box";
		name = this.getName(name);

		const geometry = new THREE.BoxGeometry(width, height, depth);
		geometry.computeBoundingBox();

		const material = new THREE.MeshPhysicalMaterial(param);
		material.roughness = 0.6;
		material.metalness = 0.1;

		const cube = new THREE.Mesh(geometry, material);
		cube.castShadow = true;
		cube.receiveShadow = true;

		return this.add(cube, name);
	}

	addCapsule(radius, length, param, name="")
	{
		if (name.length == 0)
			name = "Capsule";
		name = this.getName(name);

		const geometry = new THREE.CapsuleGeometry(radius, length, 32);
		geometry.computeBoundingBox();

		const material = new THREE.MeshLambertMaterial(param);
		const capsule = new THREE.Mesh(geometry, material);
		capsule.castShadow = true;
		capsule.receiveShadow = true;

		return this.add(capsule, name);
	}

	remove(element)
	{
		if (this.entities.includes(element))
			this.entities.splice(this.entities.indexOf(element), 1);

		delete this.elements[element.name]

		if (element.destroy != undefined)
			{element.destroy(); return ;}

		this.removeMesh(element.mesh);
	}

	removeMesh(mesh)
	{
		if (mesh == undefined)
			return ;
		mesh.geometry.dispose();
		mesh.material.dispose();
		this.scene.remove(mesh);
	}
}


export {Scene};
