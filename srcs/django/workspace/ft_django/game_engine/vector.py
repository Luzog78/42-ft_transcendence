# **************************************************************************** #
#                                                                              #
#                                                         :::      ::::::::    #
#    Vector.py                                          :+:      :+:    :+:    #
#                                                     +:+ +:+         +:+      #
#    By: marvin <marvin@student.42.fr>              +#+  +:+       +#+         #
#                                                 +#+#+#+#+#+   +#+            #
#    Created: 2024/06/15 13:12:35 by marvin            #+#    #+#              #
#    Updated: 2024/06/15 13:12:35 by marvin           ###   ########.fr        #
#                                                                              #
# **************************************************************************** #

import math


class Vector:
	def __init__(self, x, y):
		self.x = x
		self.y = y

	def __add__(self, other):
		return Vector(self.x + other.x, self.y + other.y)

	def __sub__(self, other):
		return Vector(self.x - other.x, self.y - other.y)

	def __mul__(self, other):
		return Vector(self.x * other, self.y * other)

	def __truediv__(self, other):
		return Vector(self.x / other, self.y / other)

	def __str__(self):
		return f"({self.x}, {self.y})"

	def __repr__(self) -> str:
		return f"Vector({self.x}, {self.y})"

	def length(self):
		return (self.x ** 2 + self.y ** 2) ** 0.5

	def setLength(self, length):
		currentLength = self.length()
		self.x *= length / currentLength
		self.y *= length / currentLength

	def normalize(self):
		length = self.length()
		if length == 0:
			return Vector(0, 0)
		return Vector(self.x / length, self.y / length)

	def dot(self, other):
		return self.x * other.x + self.y * other.y

	def angle(self, other):
		if self.length() == 0 or other.length() == 0:
			return 0
		return math.acos(self.dot(other) / (self.length() * other.length()))

	def project(self, other):
		return other.normalize() * self.dot(other.normalize())

	def reflect(self, normal):
		return self - normal * 2 * self.dot(normal)

	def rotate(self, angle):
		cos_theta = math.cos(angle)
		sin_theta = math.sin(angle)
		x_new = self.x * cos_theta - self.y * sin_theta
		y_new = self.x * sin_theta + self.y * cos_theta
		return Vector(x_new, y_new)

	def distance(self, other):
		return (self - other).length()

	def json(self):
		return {"x": self.x, "y": self.y}
