# Multivendor Ecommerce Store

This is a multivendor ecommerce store built with **React.js** and **TypeScript** for the frontend, and Azure with **PostgreSQL** for the backend. The database is containerised using **Docker**, and **Flyway** is used for version control of the database schema.
---

## Running the App

---

### Prerequisites:

The following programs should be installed on your machine in order to run the app locally:
- Docker 
- Flyway
- Azure Core Tools
- Prisma 
- Node

---

### 1. Clone the Repo

Run the following command in your terminal to clone the repo:

``` bash
    git clone https://github.com/paulkabzz/multivendor-ecommerce .
```

### 2. Install the Node Modules

Install dependencies by running the following command in each of these directories:
- `/` (project root dir)
- `/database`
- `/api`

``` bash
    npm i
```

### 3. Start the Docker Container

In the `docker` directory, create a `.env` file with the following variables:

```
POSTGRES_USER=
POSTGRES_PASSWORD=
```

Then run:
```bash
    docker-compose up
```

This command will start the PostgreSQL container using the settings from the `.env` file.
