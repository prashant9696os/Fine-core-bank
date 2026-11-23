import getpass
import psycopg
from psycopg import sql


def create_database():
    password = getpass.getpass("Enter your PostgreSQL password: ")

    try:
        with psycopg.connect(
            dbname="postgres",
            user="postgres",
            password=password,
            host="localhost",
            port=5432,
            autocommit=True,
        ) as connection:
            with connection.cursor() as cursor:
                cursor.execute(
                    "SELECT 1 FROM pg_database WHERE datname = %s",
                    ("finecore_db",),
                )

                if cursor.fetchone():
                    print("Database 'finecore_db' already exists.")
                else:
                    cursor.execute(
                        sql.SQL("CREATE DATABASE {}").format(
                            sql.Identifier("finecore_db")
                        )
                    )
                    print("Database 'finecore_db' created successfully!")

        with psycopg.connect(
            dbname="finecore_db",
            user="postgres",
            password=password,
            host="localhost",
            port=5432,
        ) as connection:
            with connection.cursor() as cursor:
                cursor.execute(
                    "SELECT current_database(), current_user"
                )
                database, user = cursor.fetchone()
                print(f"Connection successful: database={database}, user={user}")

    except psycopg.Error as error:
        print(f"Database error: {error}")
        print("Check your PostgreSQL password and server status.")


if __name__ == "__main__":
    create_database()
