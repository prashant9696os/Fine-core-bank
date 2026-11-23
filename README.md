# FinCore – Advanced Digital Banking & Financial Transaction Platform

FinCore is a modern digital banking application designed to manage banking operations and financial transactions securely and efficiently. It provides essential banking functionalities such as user authentication, account management, deposits, withdrawals, fund transfers, and transaction monitoring.

The project is built using FastAPI, React.js, PostgreSQL, and modern monitoring tools to provide a scalable and maintainable banking platform.

## 🚀 Features

- **User Registration & Authentication** – Secure user registration and login system.
- **Email OTP Verification** – Email-based OTP verification for account authentication.
- **JWT Authentication** – Token-based authentication for secure API access.
- **Account Management** – Manage banking accounts and account information.
- **Deposits** – Add funds to bank accounts.
- **Withdrawals** – Withdraw funds from accounts.
- **Fund Transfers** – Transfer money between accounts.
- **Transaction Management** – Track banking transactions and transaction records.
- **REST API** – Backend APIs built using FastAPI.
- **Database Integration** – PostgreSQL database with SQLAlchemy ORM.
- **Database Migrations** – Schema management using Alembic.
- **Monitoring & Metrics** – Application monitoring using Prometheus.
- **Visualization & Dashboards** – Monitor application metrics using Grafana.

## 🛠️ Tech Stack

### Backend
- Python
- FastAPI
- SQLAlchemy
- Pydantic
- PostgreSQL
- Alembic
- JWT Authentication

### Frontend
- React.js
- JavaScript
- HTML5
- CSS3
- Vite

### Monitoring & DevOps
- Prometheus
- Grafana
- Git
- GitHub

## 🏗️ Architecture

```text
React.js Frontend
        |
        | HTTP / REST API
        v
FastAPI Backend
        |
        | SQLAlchemy ORM
        v
PostgreSQL Database

Monitoring:
FastAPI Metrics ---> Prometheus ---> Grafana Dashboards
```

## 📊 Monitoring

FinCore integrates Prometheus and Grafana for application monitoring and metrics visualization.

- Prometheus collects application metrics.
- FastAPI exposes metrics through the `/metrics` endpoint.
- Grafana visualizes the collected metrics through dashboards.
- Monitoring helps track application performance and banking transaction metrics.

### Monitoring Services

| Service | URL |
|---|---|
| FastAPI API | http://localhost:8000 |
| API Documentation | http://localhost:8000/docs |
| Prometheus | http://localhost:9090 |
| Grafana | http://localhost:3000 |
| Metrics Endpoint | http://localhost:8000/metrics |

## ⚙️ Installation & Setup

### 1. Clone the Repository

```bash
git clone https://github.com/prashant9696os/Fine-core-bank.git
```

### 2. Navigate to the Project Directory

```bash
cd Fine-core-bank
```

### 3. Create a Python Virtual Environment

```bash
python -m venv .venv
```

### 4. Activate the Virtual Environment

**Windows:**

```powershell
.venv\Scripts\Activate.ps1
```

### 5. Install Backend Dependencies

```bash
pip install -r requirements.txt
```

### 6. Configure Environment Variables

Create a `.env` file in the backend directory and configure your database, email, and authentication settings.

Example:

```env
DATABASE_URL=postgresql://username:password@localhost:5432/fincore_db

SECRET_KEY=your_secret_key

SMTP_HOST=your_smtp_host
SMTP_PORT=587
SMTP_USERNAME=your_email
SMTP_PASSWORD=your_email_password
```

Use your own configuration values. Never upload your actual secrets or passwords to GitHub.

### 7. Run the Backend

```bash
python -m uvicorn app.main:app --reload --app-dir backend
```

Backend server:

http://localhost:8000

API Documentation:

http://localhost:8000/docs

### 8. Run the Frontend

Navigate to your frontend directory, install dependencies, and start the Vite development server.

```bash
cd frontend
npm install
npm run dev
```

## 📈 Monitoring Setup

### Prometheus

Prometheus collects metrics from the FinCore backend.

Prometheus URL:

http://localhost:9090

Metrics endpoint:

http://localhost:8000/metrics

### Grafana

Grafana is used to visualize application metrics and monitoring dashboards.

Grafana URL:

http://localhost:3000

Prometheus is configured as the Grafana data source for visualizing collected metrics.

## 🔐 Security

- JWT-based authentication
- Password hashing
- Email OTP verification
- Environment-based configuration
- Secure API authentication

> This project is intended for educational and development purposes. It is not a production-ready banking system.

## 📂 Project Structure

```text
Fine-core-bank/
│
├── backend/
│   ├── app/
│   ├── scripts/
│   └── ...
│
├── frontend/
│   ├── src/
│   ├── public/
│   └── ...
│
├── .gitignore
├── .env.example
├── requirements.txt
└── README.md
```

## 👨‍💻 Author

**Prashant Jawale**

Python Full Stack Developer

GitHub: [prashant9696os](https://github.com/prashant9696os)

## 📌 Project Status

FinCore is an ongoing full-stack banking project. Backend, frontend, database integration, authentication, banking operations, and monitoring components are being developed and integrated.

## ⭐ Support

If you find this project interesting, consider giving the repository a star on GitHub.
