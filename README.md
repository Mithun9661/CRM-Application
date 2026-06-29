# 🚀 CRM Application

A production-ready Customer Relationship Management (CRM) application built using the MERN stack with authentication, role-based authorization, ticket management, comments, email notifications, Docker support, Redis integration, and REST APIs.

---

## 📌 Features

- 🔐 JWT Authentication & Authorization
- 👥 Role-Based Access Control (Admin, Engineer, Customer)
- 🎫 Ticket Management System
- 💬 Ticket Comments
- 📧 Email Notifications
- 📊 Dashboard Analytics
- 🐳 Docker Support
- ⚡ Redis Integration
- 📑 Swagger API Documentation
- 📮 Postman Collection
- ✅ Error Handling Middleware
- 🔒 Secure Password Hashing

---

## 🛠 Tech Stack

### Backend

- Node.js
- Express.js
- MongoDB
- Mongoose

### Authentication

- JSON Web Token (JWT)
- bcrypt

### Cache

- Redis

### Documentation

- Swagger UI

### Containerization

- Docker
- Docker Compose

---

## 📂 Project Structure

```
CRM
│── Controllers/
│── Models/
│── Routes/
│── middlewares/
│── configs/
│── templates/
│── utils/
│── postman/
│── index.js
│── package.json
│── Dockerfile
│── docker-compose.yml
```

---

## ⚙️ Installation

### Clone Repository

```bash
git clone https://github.com/Mithun9661/CRM-Application.git

cd CRM-Application
```

### Install Dependencies

```bash
npm install
```

### Create Environment Variables

Create a `.env` file in the root directory.

Example:

```env
PORT=5000

MONGO_URI=your_mongodb_connection_string

JWT_SECRET=your_jwt_secret

REDIS_URL=your_redis_url

EMAIL=your_email

EMAIL_PASSWORD=your_email_password
```

---

## ▶️ Run Project

### Development

```bash
npm start
```

or

```bash
node index.js
```

---

## 🐳 Run using Docker

Build containers

```bash
docker-compose build
```

Run

```bash
docker-compose up
```

Stop

```bash
docker-compose down
```

---

## 📚 API Documentation

Swagger documentation:

```
http://localhost:5000/api-docs
```

---

## 📮 Postman Collection

Import the collection from the **postman/** folder.

---

## 🔑 User Roles

- Admin
- Engineer
- Customer

---

## 📌 Main APIs

### Authentication

- Register User
- Login
- Forgot Password
- Reset Password

### Users

- Create User
- Get Users
- Update User
- Delete User

### Tickets

- Create Ticket
- Get Ticket
- Update Ticket
- Delete Ticket

### Comments

- Add Comment
- Get Comments

### Dashboard

- Dashboard Statistics

---

## 🔒 Security Features

- JWT Authentication
- Password Encryption
- Role-Based Authorization
- Request Validation
- Error Handling Middleware

---

## 🚀 Future Improvements

- Frontend (React)
- Real-time Notifications (Socket.io)
- File Uploads
- Activity Logs
- Kubernetes Deployment
- CI/CD Pipeline

---

## 👨‍💻 Author

**Mithun Kumar**

- GitHub: https://github.com/Mithun9661
- LinkedIn: https://www.linkedin.com/in/mithunkumar9661/

---

## ⭐ Support

If you found this project useful, please consider giving it a ⭐ on GitHub.
