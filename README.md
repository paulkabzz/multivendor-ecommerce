# Multivendor Ecommerce Store

This is a multivendor ecommerce store built with **React.js** and **TypeScript** for the frontend, and **Azure** with **PostgreSQL** for the backend. The database is containerised using **Docker**, and **Flyway** is used for version control of the database schema.

---

## Running the App

### Prerequisites:

The following programs should be installed on your machine in order to run the app locally:
- Docker Desktop
- Flyway
- Azure Core Tools
- Prisma 
- Node

### 1. Clone the Repo

Run the following command in your terminal to clone the repo:

```bash
git clone https://github.com/paulkabzz/multivendor-ecommerce .
```

### 2. Start the Docker Container

In the `docker` directory, create a `.env` file with the following variables:

```
POSTGRES_USER=ecommerce_user
POSTGRES_PASSWORD=<password>
POSTGRES_DB=ecommerce
```

Then run:
```bash
make docker
```

This command will start the PostgreSQL container using the settings from the `.env` file.

### 3. Connect to Docker Postgres

Instead of using a local `psql` installation, we'll use the PostgreSQL client inside the Docker container:

```bash
docker exec -it <container_name> psql -U ecommerce_user -d ecommerce
```

**Note:** Replace `<container_name>` with your actual PostgreSQL container name. You can find it by running:
```bash
docker ps
```

Once connected, run:
```sql
ALTER ROLE ecommerce_user SET search_path TO ecommerce;
```

This tells Postgres to automatically use the ecommerce schema when ecommerce_user connects, so tools like psql, Prisma, etc., behave as expected without extra schema prefixes.

### 4. Test Connection

Exit postgres using the following command:
```bash
\q
```

Create a file called `priv` in the database folder and add the following line into it:
```
export FLYWAY_PASSWORD=<password>
```
The password is the password in your `docker/.env` file.

Run Flyway migration script:
```bash
make flyway
```

Generate Prisma schema:
```bash
make prisma
```

### 5. Verify Database Setup

Reconnect to the database using Docker:
```bash
docker exec -it <container_name> psql -U ecommerce_user -d ecommerce
```

Then run:
```bash
\dt
```

This will show all the tables associated with the ecommerce database.

Exit when done:
```bash
\q
```

## Alternative: Using DBeaver or Prisma Studio

If you prefer a GUI interface, you can use:

- **DBeaver**: Connect using host `localhost`, port `5433`, database `ecommerce`, username `ecommerce_user`
- **Prisma Studio**: Run `npx prisma studio` after generating the Prisma schema in the `/api` directory.

## Docker Container Management

To stop the container:
```bash
docker stop <container_name>
```

To start an existing container:
```bash
docker start <container_name>
```

To remove the container (this will delete all data):
```bash
docker rm <container_name>
```