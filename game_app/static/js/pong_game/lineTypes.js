/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   wallLines.js                                       :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: marvin <marvin@student.42.fr>              +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2024/06/09 17:32:23 by marvin            #+#    #+#             */
/*   Updated: 2024/06/09 17:32:23 by marvin           ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */

import * as THREE from 'three';
import { Lines } from "./Lines.js"

class WallLines
{
	constructor(scene, points, colors, divisionCount, name="WallLine")
	{
		this.scene = scene;
		this.name = this.scene.getName(name);

		this.points = points;
		this.colors = colors;
		this.divisionCount = divisionCount;

		this.line = new Lines(scene, points, colors, divisionCount, 5, name);
		this.scene.entities.push(this.line)
	}

	destroy()
	{
		this.scene.remove(this.line);
	}

	update(scene)
	{

		if (this.line.mesh.position.y < -0.2)
			this.line.mesh.position.y += 0.001;
		else
			this.line.mesh.position.y = -1;
		this.line.update(scene);
	}

}

class FloorLines
{
	constructor(scene, points, colors, divisionCount, name="FloorLine")
	{
		this.scene = scene;
		this.name = this.scene.getName(name);

		this.points = points;
		this.colors = colors;
		this.divisionCount = divisionCount;

		this.line = new Lines(scene, points, colors, divisionCount, 5, name);
		this.scene.entities.push(this.line)
	}

	destroy()
	{
		this.scene.remove(this.line);
	}

	update(scene)
	{
		//random movement along y axis

		let points = this.line.points
		for (let i = 0; i < points.length; i++)
		{
			console.log(points)
			points[i].y += Math.random() * 0.01 - 0.005;
		}
		this.line.update(scene);
	}
}

export { WallLines, FloorLines }