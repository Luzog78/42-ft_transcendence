import random
from django.contrib.postgres.fields import ArrayField
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager
from django.db import models


class UserManager(BaseUserManager):
	def create_user(self, username, email, password, first_name, last_name, **extra_fields):
		if not username:
			raise ValueError('Users must have a username')
		if not email:
			raise ValueError('Users must have an email address')

		user = self.model(
			username=username,
			email=self.normalize_email(email),
			first_name=first_name,
			last_name=last_name,
			**extra_fields
		)

		user.set_password(password)
		user.save(using=self._db)
		return user

	def create_superuser(self, username, email, password, first_name, last_name, **extra_fields):
		user = self.create_user(
			username=username,
			email=email,
			password=password,
			first_name=first_name,
			last_name=last_name,
			**extra_fields
		)
		user.is_admin = True
		user.save(using=self._db)
		return user


class User(AbstractBaseUser):
	username	= models.CharField(primary_key=True, max_length=24)
	created_at	= models.DateTimeField(auto_now=True, blank=False)
	email		= models.CharField(max_length=255, unique=True)
	password	= models.CharField(max_length=255)
	first_name	= models.CharField(max_length=24)
	last_name	= models.CharField(max_length=24)
	lang		= models.CharField(max_length=2, default='en')
	a2f			= models.BooleanField(default=False)
	is_admin	= models.BooleanField(default=False)

	objects = UserManager()

	USERNAME_FIELD = 'username'
	REQUIRED_FIELDS = ['email', 'first_name', 'last_name']

	def __str__(self):
		return self.username
	
	def has_perm(self, perm, obj=None):
		return self.is_admin
	
	def has_module_perms(self, app_label):
		return self.is_admin
	
	def json(self, show_email=False):
		return {
			'username': self.username,
			'createdAt': self.created_at,
			'email': self.email if show_email else None,
			'firstName': self.first_name,
			'lastName': self.last_name,
			'lang': self.lang,
			'a2f': self.a2f,
			'isAdmin': self.is_admin,
			'lastLogin': self.last_login,
		}


class Game(models.Model):
	uid			= models.CharField(primary_key=True, max_length=5, blank=False, null=False)
	players		= ArrayField(models.CharField(max_length=24), default=list)
	created_at	= models.DateTimeField(auto_now=True, blank=False)
	started_at	= models.DateTimeField(auto_now=False, blank=True, null=True, default=None)
	ended_at	= models.DateTimeField(auto_now=False, blank=True, null=True, default=None)
	winner		= models.ForeignKey(User, on_delete=models.SET_NULL, null=True, default=None)

	@staticmethod
	def new_uid():
		charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ01234567890123456789'
		max_tries = len(set(charset)) ** 5
		while max_tries:
			uid = ''.join(random.choices(charset, k=5))
			if not Game.objects.filter(uid=uid).exists():
				return uid
			max_tries -= 1
		return None

	def json(self):
		return {
			'uid': self.uid,
			'players': self.players,
			'createdAt': self.created_at,
			'startedAt': self.started_at,
			'endedAt': self.ended_at,
			'winner': self.winner,
		}


class Stats(models.Model):
	id			= models.AutoField(primary_key=True)
	username	= models.ForeignKey(User, on_delete=models.CASCADE)
	game_uid	= models.ForeignKey(Game, on_delete=models.SET_NULL, null=True)
	scored		= models.IntegerField()
	killed		= models.IntegerField()
	bounces		= models.IntegerField()
	won			= models.BooleanField()

	def json(self):
		return {
			'id': self.id,
			'username': self.username,
			'gameUid': self.game_uid,
			'scored': self.scored,
			'killed': self.killed,
			'bounces': self.bounces,
			'won': self.won,
		}
