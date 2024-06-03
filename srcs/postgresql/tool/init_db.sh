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

# create table
#   "public"."users" (
#     "id" serial not null,
#     "created_at" timestamp not null default NOW(),
#     "mail" varchar(255) not null,
#     "username" varchar(255) not null,
#     "password" varchar(32) not null,
#     "a2f" BOOLEAN not null default 0,
#     constraint "users_pkey" primary key ("id")
#   );

# comment
#   on column "public"."users"."password" is 'must be hashed with sha256'

$@