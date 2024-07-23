# **************************************************************************** #
#                                                                              #
#                                                         :::      ::::::::    #
#    raytrace.py                                        :+:      :+:    :+:    #
#                                                     +:+ +:+         +:+      #
#    By: ycontre <ycontre@student.42.fr>            +#+  +:+       +#+         #
#                                                 +#+#+#+#+#+   +#+            #
#    Created: 2024/07/18 16:27:26 by ycontre           #+#    #+#              #
#    Updated: 2024/07/23 19:51:50 by ycontre          ###   ########.fr        #
#                                                                              #
# **************************************************************************** #

from .vector import Vector


class RayTrace():
	def __init__(self, pos: Vector, direction: Vector, size: float = 0.15) -> None:
		self.pos = pos
		self.direction = direction
		self.size = size

	@staticmethod
	def intersect(ray, wall_point_1, wall_point_2) -> Vector | None:
		v1 = ray.pos - wall_point_1
		v2 = wall_point_2 - wall_point_1
		v3 = Vector(-ray.direction.y, ray.direction.x)
		if v2.dot(v3) == 0:
			return None
		t1 = (v2.x * v1.y - v1.x * v2.y) / v2.dot(v3)
		t2 = v1.dot(v3) / v2.dot(v3)
		if t1 >= 0.0 and t2 >= 0.0 and t2 <= 1.0:
			return ray.pos + ray.direction * t1
		return None
	
	def intersect_sized(self, wall_point_1: Vector, wall_point_2: Vector) -> Vector | None:
		up_vector = [0, 1, 0]
		cross_direction = [0, 0, 0]
		
		cross_direction[0] = 0 * up_vector[2] - self.direction.y * up_vector[1]
		cross_direction[1] = self.direction.y * up_vector[0] - self.direction.x * up_vector[2]
		cross_direction[2] = self.direction.x * up_vector[1] - 0 * up_vector[0]

		cross_direction = Vector(cross_direction[0], cross_direction[1])
		right_pos = self.pos + cross_direction * (self.size / 2)
		left_pos = self.pos - cross_direction * (self.size / 2)
		
		right_ray = RayTrace(right_pos, self.direction)
		left_ray = RayTrace(left_pos, self.direction)
		
		intersection_right = RayTrace.intersect(right_ray, wall_point_1, wall_point_2)
		intersection_left = RayTrace.intersect(left_ray, wall_point_1, wall_point_2)

		if (intersection_right != None):
			intersection_right -= cross_direction * (self.size / 2)
		if (intersection_left != None):
			intersection_left += cross_direction * (self.size / 2)
		
		if intersection_right is not None and intersection_left is not None:
			if intersection_right.distance(self.pos) < intersection_left.distance(self.pos):
				return intersection_right
			return intersection_left
		
		if intersection_right is not None:
			return intersection_right
		return intersection_left

		

	def intersects(self, walls) -> dict[str, Vector]:
		intersections: dict[str, Vector] = {}

		for wall_name in walls:
			wall = walls[wall_name]
			intersection = self.intersect_sized(wall[0], wall[1])
			if intersection is not None:
				intersections[wall_name] = intersection

		intersections = dict(sorted(intersections.items(), key=lambda item: (item[1].distance(self.pos))))
		return intersections
