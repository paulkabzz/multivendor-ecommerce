# Multivendor Ecommerce Store

This is a multivendor ecommerce store built with **React.js** and **TypeScript** for the frontend, and Azure with **PostgreSQL** for the backend. The database is containerised using **Docker**, and **Flyway** is used for version control of the database schema.

---

## Running the App


### Prerequisites:

The following programs should be installed on your machine in order to run the app locally:
- Docker 
- Flyway
- Azure Core Tools
- Prisma 
- Node


### 1. Clone the Repo

Run the following command in your terminal to clone the repo:

``` bash
    git clone https://github.com/paulkabzz/multivendor-ecommerce .
```

### 2. Start the Docker Container

In the `docker` directory, create a `.env` file with the following variables:

```
POSTGRES_USER=ecommerce_user
POSTGRES_PASSWORD=
POSTGRES_DB=ecommerce
```

Then run:
```bash
    make docker
```

This command will start the PostgreSQL container using the settings from the `.env` file.

Connect to Docker Postgres
```bash
    psql -h localhost -U ecommerce_user -d ecommerce -p 5433
```

Then run:
```sql
    ALTER ROLE ecommerce_user SET search_path TO ecommerce;
```

This tells Postgres to automatically use the ecommerce schema when ecommerce_user connects, so tools like psql, Prisma, etc., behave as expected without extra schema prefixes.

### Test Connection

Exit postres using the following command:

```bash
    \q
```

Run Flyway migration script:
```bash
    make flyway
```

Generate Prisma schema:

```bash
    make prisma
```

Reconnect as `ecommerce_user`:
```bash
    psql -h localhost -U ecommerce_user -d ecommerce -p 5433
```

Then run:

```bash
    \dt
```

This will show all the tables associated with the ecommerce db.

## Using DBeaver or Prisma Studio
