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

function closestPointOnSegment(A, B, P)
{
	const AB = { x: B.x - A.x, y: B.y - A.y };
	const AP = { x: P.x - A.x, y: P.z - A.y };
	const AB_squared = AB.x * AB.x + AB.y * AB.y;

	if (AB_squared === 0)
		return A;

	let t = (AP.x * AB.x + AP.y * AB.y) / AB_squared;
	t = Math.max(0, Math.min(1, t));

	return { x: A.x + t * AB.x, y: A.y + t * AB.y };
}

function closestPointOnRectangle(rectangle, point)
{
	let closestPoint = null;
	let minDistance = Infinity;

	for (let i = 0; i < rectangle.length; i++)
	{
		const j = (i + 1) % rectangle.length;
		const segmentClosestPoint = closestPointOnSegment(rectangle[i], rectangle[j], point);
		const distance = Math.hypot(segmentClosestPoint.x - point.x, segmentClosestPoint.y - point.z);

		if (distance < minDistance) {
			minDistance = distance;
			closestPoint = segmentClosestPoint;
		}
	}

	return { closestPoint, minDistance };
}

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
		if (wallname == "player0box" || wallname == "player1box")
		{
			let player = this.scene.get(wallname.replace("box", ""));
			player.bump(normal);
		}


		// let player_up = player.keyboard["w"];
		// let player_down = player.keyboard["s"];

		// if (player_up == "keydown")
		// {
		// 	let newVel = new THREE.Vector3(-1, 0, -0.5)
		// 	newVel.setLength(this.vel.length() + 0.1);

		// 	this.vel = newVel;

		// 	this.acc = new THREE.Vector3(1, 0, -0.5);
		// 	this.acc.setLength(this.vel.length() * 2)
		// }
		// else if (player_down == "keydown")
		// {
		// 	let newVel = new THREE.Vector3(1, 0, -0.5)
		// 	newVel.setLength(this.vel.length() + 0.1);

		// 	this.vel = newVel;

		// 	this.acc = new THREE.Vector3(-1, 0, -0.5);
		// 	this.acc.setLength(this.vel.length() * 2)
		// }
		// if (player_up == "keydown" || player_down == "keydown")
		// {
		// 	this.acc.z *= normal.z < 0 ? 1 : -1;
		// 	this.vel.z *= normal.z < 0 ? 1 : -1;
		// }
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

		for (let i = 0; i < this.trails.length; i++)
			this.trails[i].update(scene)

		this.sphere.position.add(new THREE.Vector3().copy(this.vel).multiplyScalar(this.scene.dt));
		this.vel.add(new THREE.Vector3().copy(this.acc).multiplyScalar(this.scene.dt));
		this.acc.multiplyScalar(Math.pow(0.18729769509073987, this.scene.dt));
	}
}

export { Ball };