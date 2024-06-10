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
		this.name = name;
		this.options = options;

		
		this.vel = new THREE.Vector3(0, 0, 0);
		this.acc = new THREE.Vector3(0, 0, 0);
		
		this.keyboard = {};

		this.init();
	}

	init()
	{
		this.player = this.scene.addBox(1, 0.5, 0.15, this.options, this.name + "box");
		this.scene.elements[this.name] = this;

		document.addEventListener("keydown", (e) => {this.keyboard[e.key] = "keydown";});
		document.addEventListener("keyup", (e) => {this.keyboard[e.key] = "keyup";});
	}

	keyPressed()
	{
		if (this.keyboard["ArrowUp"] == "keydown" || this.keyboard["w"] == "keydown")
			this.player.position.x -= 0.01;
		if (this.keyboard["ArrowDown"] == "keydown" || this.keyboard["s"] == "keydown")
			this.player.position.x += 0.01;	
	}

	bump(normal)
	{
		for (let i = 0; i < 10; i++)
		{
			setTimeout(() => {
				this.player.material.emissive.add(new THREE.Color(0.01,0.01,0.01))
			}, 2 * i);
			setTimeout(() => {
				console.log(this.player.position.z, normal.z)
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
		if (this.name == "player")
			this.keyPressed();

		this.player.position.add(this.vel);
		this.vel.add(this.acc);
		this.acc.multiplyScalar(0.99);
	}
}

export { Player };