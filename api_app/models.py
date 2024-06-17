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


class Game(models.Model):
	id			= models.CharField(primary_key=True, max_length=5)
	players		= ArrayField(models.CharField(max_length=24), default=list)
	created_at	= models.DateTimeField(auto_now=True, blank=False)
	started_at	= models.DateTimeField(auto_now=False, blank=True)
	ended_at	= models.DateTimeField(auto_now=False, blank=True)
	winner		= models.ForeignKey(User, on_delete=models.SET_NULL, null=True)


class Stats(models.Model):
	id		= models.AutoField(primary_key=True)
	user_id	= models.ForeignKey(User, on_delete=models.CASCADE)
	game_id	= models.ForeignKey(Game, on_delete=models.SET_NULL, null=True)
	scored	= models.IntegerField()
	killed	= models.IntegerField()
	bounces	= models.IntegerField()
	won		= models.BooleanField()
