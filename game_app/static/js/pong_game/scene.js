/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   scene.js                                           :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: marvin <marvin@student.42.fr>              +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2024/06/07 17:17:28 by ycontre           #+#    #+#             */
/*   Updated: 2024/06/10 12:00:41 by marvin           ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */

import * as THREE from 'three';
import * as OrbitControls from 'orbitcontrols';
import * as RenderPass from 'renderpass';
import * as EffectComposer from 'effectcomposer';
import * as UnrealBloomPass from 'unrealbloompass';
import * as FontLoader from 'fontloader';

import { Ball } from "./ball.js"
import { Player } from "./player.js"
import { ScreenShake } from "./screenShake.js"

class Scene
{
	constructor(FOV)
	{
		this.scene = new THREE.Scene();
		this.camera = new THREE.PerspectiveCamera(FOV, window.innerWidth / window.innerHeight, 0.1, 1000);
		this.renderer = new THREE.WebGLRenderer({antialias: true});
		this.controls = new OrbitControls.OrbitControls(this.camera, this.renderer.domElement);
		this.shake = ScreenShake();
		
		this.elements = {};
		this.entities = []
		
		this.init();
	
		this.renderScene = new RenderPass.RenderPass(this.scene, this.camera);
		this.composer = new EffectComposer.EffectComposer(this.renderer);
		this.composer.addPass(this.renderScene);

		var bloomPass = new UnrealBloomPass.UnrealBloomPass(
			new THREE.Vector2(window.innerWidth, window.innerHeight), 
			0.4, 1.0, 0.5);
		this.composer.addPass(bloomPass);
	}
	
	init()
	{
		this.entities.push(new Player(this, {color: 0x1f56b5, emissive:0x1f56b5, emissiveIntensity:9}, "player"));
		this.entities.push(new Player(this, {color: 0xff4f4f, emissive:0xff4f4f, emissiveIntensity:3}, "ennemy"));

		this.get("player").player.position.set(0,0,3.92);
		this.get("ennemy").player.position.set(0,0,-3.92);
		
		this.entities.push(new Ball(this, 0.15, {color: 0xeeeeee, emissive:0xeeeeee, emissiveIntensity:3}, "ball1"))
		this.get("ball1").position.set(0,0.25,0);
		
		this.renderer.shadowMap.enabled = true;
		this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
		this.renderer.setSize(window.innerWidth, window.innerHeight);
		document.body.appendChild(this.renderer.domElement);
	}
	
	update()
	{
		for (let el in this.entities)
			if (this.entities[el].update != undefined)
				this.entities[el].update(this);

		this.shake.update(this.camera);
		
		this.controls.update();
		this.composer.render();
	}

	getName(name)
	{
		if (name.length == 0)
			name = Object.keys(this.elements).length;
		if (this.elements[name] != undefined)
			name = "_" + name;
		return name;
	}

	add(elements, name="")
	{
		this.elements[name] = elements;
		this.scene.add(elements);
		
		return elements;
	}
	
	get(name)
	{
		return this.elements[name];
	}

	addText(text, param, size, position, name="")
	{
		if (name.length == 0)
			name = "Text " + text;
		let loader = new FontLoader.FontLoader();
		// loader.load('js/pong_game/Braciola MS_Regular.json', (font) => {
		loader.load("static/js/pong_game/Braciola MS_Regular.json", (font) => {
			const shapes = font.generateShapes( text, size );
			const geometry = new THREE.ShapeGeometry( shapes );
			geometry.computeBoundingBox();
			const xMid = -0.5 * ( geometry.boundingBox.max.x - geometry.boundingBox.min.x );
			geometry.translate( xMid, 0, 0 );
			
			geometry.rotateX(-Math.PI / 2);
			geometry.rotateY(Math.PI / 2);
			
			geometry.translate(position);
			
			const matLite = new THREE.MeshBasicMaterial({
				side: THREE.DoubleSide,
				color: param.color
			});
			const textMesh = new THREE.Mesh( geometry, matLite );
			this.add(textMesh, name);
			
		});
	
	}

	addSphere(radius, param, name="")
	{
		if (name.length == 0)
			name = "Sphere";
		name = this.getName(name);

		// var geometry = new THREE.BoxGeometry(0.25, 0.25, 0.25);
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

		var geometry = new THREE.BoxGeometry(width, height, depth);
		geometry.computeBoundingBox();
		
		var material = new THREE.MeshPhysicalMaterial(param);
		material.roughness = 0.6;
		material.metalness = 0.1;

		var cube = new THREE.Mesh(geometry, material);
		cube.castShadow = true;
		cube.receiveShadow = true;

		return this.add(cube, name);
	}

	remove(element)
	{
		if (!this.entities.includes(element))
			return ;

		this.entities.splice(this.entities.indexOf(element), 1);
		delete this.elements[element.name]
		
		if (element.destroy != undefined)
			{element.destroy(); return ;}

		element.mesh.geometry.dispose();
		element.mesh.material.dispose();
		this.scene.remove(element.mesh);
	}
}

export {Scene};