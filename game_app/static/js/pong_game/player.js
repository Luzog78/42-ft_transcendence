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
		this.options = options;

		this.name = name;
		this.player = this.scene.addBox(1, 0.5, 0.15, this.options, name);

		this.vel = new THREE.Vector3(0, 0, 0);
		this.acc = new THREE.Vector3(0, 0, 0);

		this.keyboard = {};

		this.init();
	}

	init()
	{
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