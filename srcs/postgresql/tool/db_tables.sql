create table
  "public"."users" (
    "id" serial not null,
    "created_at" timestamp not null default NOW(),
    "mail" varchar(255) not null,
    "username" varchar(255) not null,
    "password" CHAR(32) not null,
    "a2f" BOOLEAN not null default false,
    constraint "users_pkey" primary key ("id")
  );

comment
  on column "public"."users"."password" is 'must be hashed with sha256'