# Multivendor Ecommerce Store

A full-stack multivendor ecommerce platform built with modern technologies for scalability and performance.

## Tech Stack

**Frontend:**
- React.js with TypeScript
- Vite for development and build tooling

**Backend:**
- Azure Functions
- Node.js with TypeScript
- Prisma ORM

**Database:**
- PostgreSQL
- Docker containerization
- Flyway for database migrations

## Prerequisites

Before running the application, ensure you have these installed:

- [Docker Desktop](https://www.docker.com/products/docker-desktop/)
- [Node.js](https://nodejs.org/en/download) (v16 or higher recommended)
- Git

## Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/paulkabzz/multivendor-ecommerce.git .
```

### 2. Database Setup

#### Create Environment File

Create `.env` in the `docker/` with the following content:
```env
POSTGRES_USER=ecommerce_user
POSTGRES_PASSWORD=your_secure_password_here
POSTGRES_DB=ecommerce
```

**⚠️ Important:** Replace `your_secure_password_here` with a strong password of your choice.

#### Start PostgreSQL Container
```bash
make docker
```

This command starts the PostgreSQL container with your specified configuration.

#### Verify Container is Running
```bash
docker ps
```
Look for your PostgreSQL container in the output and note the container name.

### 3. Database Configuration

#### Connect to PostgreSQL
```bash
docker exec -it <container_name> psql -U ecommerce_user -d ecommerce
```

**Note:** Replace `<container_name>` with the actual container name from the previous step.

#### Set Default Schema
Once connected to PostgreSQL, run:
```sql
ALTER ROLE ecommerce_user SET search_path TO ecommerce;
```

Exit PostgreSQL:
```sql
\q
```

### 4. Database Migration Setup

#### Create Flyway Password File
In the `database` directory, create a file named `priv`:

```bash
cd database
echo "export FLYWAY_PASSWORD=your_secure_password_here" > priv
```

**Note:** Use the same password from your Docker `.env` file.

#### Run Database Migrations

**⚠️ Note:** When using `make` commands, make sure you are in the same directory as the `Makefile`
```bash
make flyway
```

#### Generate Prisma Schema
```bash
make prisma
```

### 5. Verify Database Setup

Connect to the database again:
```bash
docker exec -it <container_name> psql -U ecommerce_user -d ecommerce
```

List all tables to verify setup:
```sql
\dt
```

You should see the ecommerce tables listed. Exit when done:
```sql
\q
```

## API Setup

### 1. Navigate to API Directory
```bash
cd api
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Configure Environment Variables
Create a `.env` file in the `api` directory:

```env
DATABASE_URL="postgresql://ecommerce_user:your_secure_password_here@localhost:5433/ecommerce?schema=ecommerce"
JWT_SECRET=your_jwt_secret_here
GMAIL_USER=your_gmail@gmail.com
GMAIL_APP_PASSWORD=your_gmail_app_password
```

#### Generate JWT Secret
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Copy the generated string and use it as your `JWT_SECRET`.

#### Gmail Setup (for email notifications)
- Enable 2-factor authentication on your Gmail account
- Generate an App Password in your Google Account settings
- Use your Gmail address for `GMAIL_USER`
- Use the generated App Password for `GMAIL_APP_PASSWORD`

### 4. Start the Azure App.
```bash
npm run start
```

## Frontend Setup

### 1. Open New Terminal
Keep the API server running and open a new terminal window.

### 2. Navigate to Client Directory
```bash
cd client
```

### 3. Install Dependencies
```bash
npm install
```

### 4. Start Development Server
```bash
npm run dev
```

You should see output similar to:
```
➜  client git:(develop) npm run dev

> client@0.0.0 dev
> vite


  VITE v6.3.5  ready in 214 ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
  ➜  press h + enter to show help
```

### 5. Access the Application
Open your browser and navigate to `http://localhost:5173/`

## Database Management Tools

### Command Line (psql)
```bash
docker exec -it <container_name> psql -U ecommerce_user -d ecommerce
```

### GUI Options

#### DBeaver
Click the **Create New Database Connection** button, choose **PostgreSQL** and connect using the following:
- **Host:** localhost
- **Port:** 5433
- **Database:** ecommerce
- **Username:** ecommerce_user
- **Password:** [your password from `.env`]

#### Prisma Studio
From the `/api` directory:
```bash
npx prisma studio
```

## Docker Container Management

### View Running Containers
```bash
docker ps
```

### Stop Container
```bash
docker stop <container_name>
```

### Start Existing Container
```bash
docker start <container_name>
```

### Remove Container (⚠️ This deletes all data)
```bash
docker rm <container_name>
```

### View Container Logs
```bash
docker logs <container_name>
```

## 🔍 Troubleshooting

### Common Issues

#### Port Already in Use
If port 5433 is already in use:
```bash
# Find process using the port
lsof -i :5433

# Kill the process
kill -9 <PID>
```

#### Container Won't Start
```bash
# Check Docker logs
docker logs <container_name>

# Remove and recreate container
docker rm <container_name>
make docker
```

#### Database Connection Issues
1. Verify container is running: `docker ps`
2. Check environment variables in both `.env` files
3. Ensure passwords match between Docker and API configurations

#### Prisma Issues
```bash
# Reset Prisma client
cd api
npx prisma generate

# Reset database (⚠️ destroys data)
npx prisma db push --force-reset
```

## Development Notes

- The database runs on port `5433` to avoid conflicts with local PostgreSQL installations
- Both frontend and backend support hot reloading during development
- Database schema changes should be managed through Flyway migrations
- Always use the `ecommerce` schema for database operations


## Support

If you encounter any issues or need help getting the application running, please:

1. Check the troubleshooting section above
2. Search existing issues in the repository
3. Create a new issue with detailed information about the problem
4. Contact the me via email

---

**Happy coding! 😶🔫**