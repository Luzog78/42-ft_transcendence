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
	constructor(scene, options, size, position, name)
	{
		this.scene = scene;
		this.name = this.scene.getName(name);
		this.options = options;

		this.init_position = position
		this.size = size;
		this.angle = 0;
		this.speed = 1.2;

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
		this.player = this.scene.addBox(this.size, 0.1, 0.1, this.options, this.name + "box");
		// this.scene.addText(this.name, {color: 0xffffff}, 0.5, this.init_position, this.name + "text")
		
		console.log(this.scene.get(this.name + "text"));

		this.player.position.copy(this.init_position);
		this.scene.elements[this.name] = this;
	}

	keyPressed()
	{
		const speed = this.speed * this.scene.dt * (this.size);

		if (this.keyboard["w"] == true)
		{
			let computed_position = new THREE.Vector3().copy(this.player.position);
			computed_position.x -= Math.cos(this.angle) * speed;
			computed_position.z -= Math.sin(this.angle) * speed;
			
			if (computed_position.distanceTo(this.init_position) > this.scene.segment_size / 2 - this.size / 2)
				return;
			this.player.position.copy(computed_position);
		}
		if (this.keyboard["s"] == true)
		{
			let computed_position = new THREE.Vector3().copy(this.player.position);
			computed_position.x += Math.cos(this.angle) * speed;
			computed_position.z += Math.sin(this.angle) * speed;
			
			if (computed_position.distanceTo(this.init_position) > this.scene.segment_size / 2 - this.size / 2)
				return;
			this.player.position.copy(computed_position);
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
