#!/bin/bash

while ! bash -c "PGPASSWORD='$DB_PASSWD' psql -h $DB_HOST -p $DB_PORT -U $DB_USER $DB_NAME <<< '\q'" > /dev/null 2> /dev/null; do
	echo "Waiting for PostgreSQL...";
	sleep 1;
done;


nohup bash -c "python3 manage.py makemigrations \
				&& python3 manage.py migrate --run-syncdb \
				&& python3 manage.py runserver_plus --cert-file ./certs/localhost.pem --key-file ./certs/localhost.pem 0.0.0.0:8000" &


sleep inf

$@
