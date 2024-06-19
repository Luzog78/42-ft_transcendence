/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   player.js                                          :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: marvin <marvin@student.42.fr>              +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2024/06/08 18:13:00 by marvin            #+#    #+#             */
/*   Updated: 2024/06/08 18:13:00 by marvin           ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */

import * as THREE from 'three';

class Player
{
	constructor(scene, options, name)
	{
		this.scene = scene;
		this.name = this.scene.getName(name);
		this.options = options;

		this.angle = 0;

		this.keyboard = {};
		this.player = null;

		this.keydown_event_func = this.keydown_event.bind(this)
		this.keyup_event_func = this.keyup_event.bind(this)

		this.init();
	}

	async keydown_event(e)
	{
		if (this.keyboard[e.key] == true)
			return;
		this.keyboard[e.key] = true;
		await this.scene.server.sendData("player_keyboard", this.keyboard);
	}
	async keyup_event(e)
	{
		if (this.keyboard[e.key] == false)
			return;
		this.keyboard[e.key] = false;
		await this.scene.server.sendData("player_keyboard", this.keyboard);
	}

	init()
	{
		this.player = this.scene.addBox(1, 0.25, 0.15, this.options, this.name + "box");
		this.scene.elements[this.name] = this;
	}

	keyPressed()
	{
		if (this.keyboard["w"] == true)
		{
			this.player.position.x -= Math.cos(this.angle) * 1.2 * this.scene.dt;
			this.player.position.z -= Math.sin(this.angle) * 1.2 * this.scene.dt;
		}
		if (this.keyboard["s"] == true)
		{
			this.player.position.x += Math.cos(this.angle) * 1.2 * this.scene.dt;
			this.player.position.z += Math.sin(this.angle) * 1.2 * this.scene.dt;
		}
	}

	bump(normal)
	{
		for (let i = 0; i < 10; i++)
		{
			setTimeout(() => {
				this.player.material.emissive.add(new THREE.Color(0.01,0.01,0.01))
			}, 2 * i);
			setTimeout(() => {
				this.player.position.z += normal.z * -0.05;
			}, 2 * i);
			this.player.material.emissiveIntensity += 0.5;
		}

		for (let i = 10; i < 20; i++)
		{
			setTimeout(() => {
				this.player.material.emissive.sub(new THREE.Color(0.01,0.01,0.01))
			}, 7 * i);
			setTimeout(() => {
				this.player.position.z += normal.z * 0.05;
			}, 8 * i);
			setTimeout(() => {
				this.player.material.emissiveIntensity -= 0.5;
			}, 3 * i);
		}

	}

	update()
	{
		if (this.name == "player" + this.scene.server.client_id)
			this.keyPressed();
	}
}

export { Player };