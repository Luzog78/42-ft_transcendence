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

		this.line = new Lines(scene, points, colors, divisionCount, name);
		this.scene.entities.push(this.line)
	}

	destroy()
	{
		console.log("destroy line")
		this.scene.remove(this.line);
	}

	update(scene)
	{
		// if (this.line.mesh.material.opactiy <= 0)
		// 	return;

		this.line.mesh.material.opacity = (-0.2 - -1) / (0.0005 * 1000) * (this.line.mesh.position.y - -1) + -0.2;

		let points = this.line.points
		for (let i = 0; i < points.length; i++)
		{
			if (this.line.mesh.position.y < -0.2)
				this.line.mesh.position.y += 0.0005;
			else
				this.line.mesh.position.y = -1;
		}
		this.line.update(scene);
	}

}

export { WallLines }