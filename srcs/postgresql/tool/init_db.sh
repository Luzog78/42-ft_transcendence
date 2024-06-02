#!/bin/bash
service postgresql start

su postgres << EOF

createdb $DB_NAME
if [ $? = 0 ]; then
	echo "Created db '$DB_NAME'"
	createuser $DB_USER
	psql -c "ALTER USER $DB_USER WITH PASSWORD '$DB_PASSWD';"
fi

EOF

$@