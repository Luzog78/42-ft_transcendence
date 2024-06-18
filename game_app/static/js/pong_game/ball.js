/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   ball.js                                            :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: marvin <marvin@student.42.fr>              +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2024/06/08 15:00:07 by marvin            #+#    #+#             */
/*   Updated: 2024/06/08 15:00:07 by marvin           ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */

import * as THREE from 'three';
import { RingBlob } from "./ringBlob.js"
import { Trail } from "./trail.js"
import { Particle } from "./particle.js"

class Ball
{
	constructor(scene, radius, options, name)
	{
		this.scene = scene;
		this.name = this.scene.getName(name);

		this.vel = new THREE.Vector3(0, 0, 0);
		this.acc = new THREE.Vector3(0, 0, 0);
		this.currentVelLength = this.vel.length();

		this.trails = []
		this.trailsLength = 50;

		this.groundTrailLength = 20;

		this.radius = radius;
		this.sphere = this.scene.addSphere(this.radius, options, this.name);
	}

	effectCollision(wallname, position, normal)
	{
		let shake = Math.exp(this.vel.length() / 100) - 1;
		this.scene.shake.shake(this.scene.camera, new THREE.Vector3(shake, 0), 400);

		position = new THREE.Vector3(position.x, 0.25, position.y);
		normal = new THREE.Vector3(normal.x, 0, normal.y);
		normal.setLength(0.2);

		if (wallname.includes("wall"))
			this.scene.entities.push(new RingBlob(this.scene, 0.2, 100, {color: 0xffffff}, position));
		if (wallname.includes("player"))
		{
			let player = this.scene.get(wallname.replace("box", ""));
			player.bump(normal);
		}

		for (let i = 0; i < 10; i++)
		{
			let randomPosition = position.clone().add(new THREE.Vector3(Math.random() * 0.2 - 0.1,Math.random() * 0.2 - 0.1,Math.random() * 0.2 - 0.1));
			let direction = randomPosition.clone().sub(position).multiplyScalar(13);
			let acceleration = direction.clone().multiplyScalar(-1.8);

			let accDec = 0.989

			let radius = Math.random() * 0.02 + 0.005;
			let color = this.sphere.material.color;
			color = new THREE.Color(color).offsetHSL(0, 0, Math.random() * 0.2 - 0.1);

			let particle = new Particle(this.scene, randomPosition, direction, acceleration, accDec,
				radius, {color: color}, 2, "particle");
			particle.addUpdate(Particle.updatePhysics);
			particle.addUpdate(Particle.updateFadeOpacity);
			particle.addUpdate(Particle.updateRemoveOnFade);

			this.scene.entities.push(particle);
		}

	}

	update(scene)
	{
		let color = 270 - this.sphere.position.z * 20;
		this.sphere.material.color = new THREE.Color(`hsl(${color}, 100%, 80%)`);
		this.sphere.material.emissive = new THREE.Color(`hsl(${color}, 100%, 80%)`);

		if (this.trails.length < this.trailsLength)
		{
			let trail = new Trail(scene, this, 0.15, {
				color: this.sphere.material.color,
				emissive: this.sphere.material.color,
				emissiveIntensity: 3,
				transparent: true,
				opacity: 1,
				alphaTest: 0.01
			}, "trail");

			trail.mesh.position.set(this.sphere.position.x, this.sphere.position.y, this.sphere.position.z);
			this.trails.push(trail);
		}

		if (this.groundTrailLength > 0 && Date.now() % 20 == 0)
		{
			this.groundTrailLength--;

			let randomPosition = this.sphere.position.clone();
			let positionOffset = new THREE.Vector3(Math.random() * 0.2 - 0.1, 0, Math.random() * 0.2 - 0.1);
			randomPosition.add(positionOffset);

			let direction = new THREE.Vector3(0, 0, 0);
			let acceleration = new THREE.Vector3(0, 0, 0);

			let accDec = 0.99

			let radius = Math.random() * 0.01 + 0.005;
			let color = new THREE.Color(0xffffff);
			color.offsetHSL(0, 0, Math.random() * 0.2 - 0.1);

			let particle = new Particle(this.scene, randomPosition, direction, acceleration, accDec,
				radius, {color: color}, 2, "particle");
			particle.addUpdate(Particle.updatePhysics);
			particle.addUpdate(Particle.updateFadeOpacity);
			particle.addUpdate(Particle.updateResetPositionOnFade, [this.sphere])

			particle.positionOffset = positionOffset;

			this.scene.entities.push(particle);
		}

		for (let i = 0; i < this.trails.length; i++)
			this.trails[i].update(scene)

		this.sphere.position.add(new THREE.Vector3().copy(this.vel).multiplyScalar(this.scene.dt));
		this.vel.add(new THREE.Vector3().copy(this.acc).multiplyScalar(this.scene.dt));

		let accelerationFactor = Math.pow(10, Math.log10(0.99) / 0.006); // 
		this.acc.multiplyScalar(Math.pow(accelerationFactor, this.scene.dt));
	}
}

export { Ball };