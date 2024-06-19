import re


def username(s) -> bool:
	return not not re.match(r'^\w{3,24}$', s)


def first_name(s) -> bool:
	return not not re.match(r'^.{1,24}$', s)


def last_name(s) -> bool:
	return not not re.match(r'^.{1,24}$', s)


def email(s) -> bool:
	return not not re.match(r'^([a-zA-Z0-9]+(\w*[a-zA-Z0-9])?([-.]([a-zA-Z0-9]\w*)?[a-zA-Z0-9])*)(@\w+)(\.\w+(\.\w+)?[a-zA-Z])$', s)


def password(s) -> bool:
	return not not re.match(r'^.{4,}$', s)


def uid(s) -> bool:
	return not not re.match(r'^[a-z]{2}[A-Z0-9]{3}$', s)


def id(s) -> bool:
	return not not re.match(r'^\d+$', s)


def locale(s) -> bool:
	return not not re.match(r'^[a-z]{2}(-[A-Z]{2})?$', s)


def token(s) -> bool:
	return not not re.match(r'^[\w-]+(\.[\w-]+(\.[\w-]+)?)?$', s)


def a2f_code(s) -> bool:
	return not not re.match(r'^\d{6}$', s)
