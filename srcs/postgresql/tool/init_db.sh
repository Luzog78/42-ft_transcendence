#!/bin/bash
service postgresql start

su postgres << EOF

createdb $DB_NAME
if [ $? = 0 ]; then
	echo "Created db '$DB_NAME'"
	createuser $DB_USER
	psql -c "ALTER USER $DB_USER WITH PASSWORD '$DB_PASSWD';"
	psql -c "ALTER DATABASE $DB_NAME OWNER TO $DB_USER;"
fi

EOF



while [ 1 = 1 ]; do
	service postgresql status | grep down
	if [ $? = 0 ]; then
		service postgresql start
	fi
	sleep 1
done;

sleep inf

$@
