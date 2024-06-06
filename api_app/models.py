from django.contrib.postgres.fields import ArrayField
from django.db import models

# Create your models here.

class users(models.Model):
	id = models.IntegerField(primary_key=True)
	created_at = models.DateTimeField()
	mail = models.CharField(max_length=255)
	username = models.CharField(max_length=255)
	password = models.CharField(max_length=255)
	a2f = models.BooleanField()

class game(models.Model):
	id = models.IntegerField(primary_key=True)
	players = ArrayField(
		models.IntegerField(), #-> users.id
		size=4
	)
	created_at = models.DateTimeField()
	started_at = models.DateTimeField()
	ended_at = models.DateTimeField()
	winner = models.IntegerField() #-> users.id

class stats(models.Model):
	id = models.IntegerField(primary_key=True)
	user_id = models.IntegerField() #-> users.id
	game_id = models.IntegerField() #->game.id
	scored = models.IntegerField()
	killed = models.IntegerField()
	bounces = models.IntegerField()
	won = models.BooleanField()

