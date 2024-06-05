FROM debian:bookworm

RUN apt update -y && apt install -y postgresql

EXPOSE 3306

COPY conf/postgresql.conf /etc/postgresql/15/main/postgresql.conf
RUN echo "host pong pong_user 0.0.0.0/0 scram-sha-256" >> /etc/postgresql/15/main/pg_hba.conf

COPY tool/init_db.sh /bin/init_db.sh
COPY tool/db_tables.sql /db_tables.sql

RUN chmod +x /usr/bin/init_db.sh
RUN chmod 644 /db_tables.sql

ENTRYPOINT ["/usr/bin/init_db.sh"]

CMD ["sleep", "inf"]