#!/bin/bash
service postgresql start

su postgres << EOF

echo $DB_NAME
echo $DB_USER
echo $DB_PASSWD

createdb $DB_NAME
if [ $? = 0 ]; then
	echo "Created db '$DB_NAME'"
	createuser $DB_USER
	psql << EOP
	\password $DB_USER
	$DB_PASSWD
	$DB_PASSWD
	EOP
fi

EOF

$@