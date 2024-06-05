-- creating table USERS
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
  on column "public"."users"."password" is 'must be hashed with sha256';

CREATE UNIQUE INDEX "mail_ukey" on "public"."users" ("mail" ASC);
CREATE UNIQUE INDEX "username_ukey" on "public"."users" ("username" ASC);


-- creating table game
create table
  "public"."game" (
    "id" serial not null,
    "players" INT[] not null,
    "created_at" timestamp not null default NOW(),
    "started_at" TIMESTAMP null,
    "ended_at" TIMESTAMP null,
    "winner" INT null,
    constraint "game_pkey" primary key ("id")
  );


-- creating table stats

create table
  "public"."stats" (
    "id" serial not null,
    "user_id" INT not null,
    "game_id" INT not null,
    "scored" INT not null,
    "killed" INT not null,
    "bounces" INT not null,
    "won" BOOLEAN not null default false,
    constraint "stat_pkey" primary key ("id")
  );


CREATE UNIQUE INDEX "ug_ukey" on "public"."users" ("user_id" ASC, game_id ASC);



--- setting up relations

-- stat relations

ALTER TABLE
  "public"."stats"
ADD
  CONSTRAINT "stats_usersid" FOREIGN KEY ("user_id") REFERENCES "public"."users" ("id") ON UPDATE CASCADE ON DELETE CASCADE;

ALTER TABLE
  "public"."stats"
ADD
  CONSTRAINT "stats_game" FOREIGN KEY ("game_id") REFERENCES "public"."game" ("id") ON UPDATE CASCADE ON DELETE CASCADE;