<div align="center">

# 🍽️ Smart Canteen
## Pre-Order & Token Management System

### A Smart Digital Solution for Campus Canteen Management

<p>
  <img src="https://img.shields.io/badge/React-17-blue?logo=react" />
  <img src="https://img.shields.io/badge/Node.js-Express-green?logo=node.js" />
  <img src="https://img.shields.io/badge/MongoDB-Database-green?logo=mongodb" />
  <img src="https://img.shields.io/badge/Razorpay-Test%20Mode-blue" />
  <img src="https://img.shields.io/badge/Socket.IO-Real--Time-black?logo=socket.io" />
  <img src="https://img.shields.io/badge/License-Academic-orange" />
</p>

<p>
A full-stack MERN application that enables students to pre-order food,
make online payments, receive digital tokens, and track orders in real time.
</p>

</div>

---

## 📌 About the Project

**Smart Canteen Pre-Order & Token Management System** is a full-stack web application developed to modernize the traditional campus canteen experience.

The system allows students to:

- Browse the digital food menu
- Search and filter food items
- Add items to a shopping cart
- Place pre-orders
- Make online payments
- Receive an automatic token number
- Track order progress
- Monitor their queue position
- Receive real-time and email notifications

The system also provides dedicated interfaces for **Staff** and **Admin** to manage orders, tokens, food items, and staff accounts.

### 🎯 Main Goal

> **Order Smart • Skip the Queue • Save Time**

---

## ✨ Core Features

### 🎓 Student Portal

| Feature | Description |
|---|---|
| 🔐 Authentication | Secure login and registration |
| 📧 Email OTP | OTP verification during registration |
| 🍔 Digital Menu | Browse available food items |
| 🔎 Search & Filter | Quickly find food items |
| 🛒 Shopping Cart | Add, remove and update items |
| 💳 Online Payment | Razorpay payment integration |
| 🎟️ Token Generation | Automatic token after successful payment |
| 📋 My Orders | View complete order history |
| 📍 Order Tracking | Track current order status |
| ⏱️ Queue Tracking | View queue position and estimated waiting time |
| 🚫 Order Cancellation | Cancel eligible pending orders |
| 🔔 Live Notifications | Receive real-time status updates |
| 📧 Email Notifications | Receive order and status emails |

---

### 👨‍🍳 Staff Portal

Staff members can manage the daily canteen order workflow.

- 🔐 Staff Login
- 📋 View All Orders
- 🔎 Search Orders
- 🏷️ Filter Orders by Status
- 🔄 Update Order Status
- 🎟️ Manage Token Queue
- 📺 Live Token Display
- 🟡 View Pending Orders
- 🔵 View Preparing Orders
- 🟢 View Ready Orders
- 📊 Monitor Active Orders

### Order Lifecycle

```text
Pending
   ↓
Preparing
   ↓
Ready
   ↓
Completed
```

---

### 👨‍💼 Admin Portal

The Admin has complete control over the canteen management system.

#### Food Management

- ➕ Add Food Items
- ✏️ Edit Food Items
- 🗑️ Delete Food Items
- 🖼️ Upload Food Images
- 🟢 Enable/Disable Availability
- 💰 Manage Food Prices
- 🏷️ Manage Food Categories

#### Order Management

- 📋 View All Orders
- 🔎 Search Orders
- 🔄 Update Order Status
- 📊 Monitor Order Statistics
- 💰 View Sales Information

#### Staff Management

- 👨‍🍳 Create Staff Accounts
- 👥 View Staff Members
- 🏫 Manage Staff Department Information

---

# 💳 Online Payment System

The application integrates **Razorpay Test Mode** for online payments.

### Payment Workflow

```text
Student
   ↓
Add Food to Cart
   ↓
Checkout
   ↓
Razorpay Payment
   ↓
Backend Payment Verification
   ↓
Order Creation
   ↓
Token Generation
   ↓
Order Confirmation
```

The backend verifies the payment signature before creating the final order.

> **Note:** Razorpay is currently configured for Test Mode during development.

---

# 🎟️ Smart Token Management

After successful payment, the system automatically generates a token number.

The token system helps reduce physical queues and allows students to monitor their order progress.

### Token Information

- 🎟️ Your Token Number
- 👥 People Ahead
- 📍 Queue Position
- ⏱️ Estimated Waiting Time
- 🔴 Currently Serving Token
- 🟢 Ready Tokens
- 📺 Live Token Display

---

# 📺 Live Token Display

The Staff Token Display provides a real-time view of the canteen queue.

### Display Includes

**NOW SERVING**

Current preparing token

**READY FOR PICKUP**

Orders that are ready

**NEXT TOKENS**

Upcoming pending tokens

The display automatically refreshes to reflect the latest order status.

---

# 🔔 Real-Time Notification System

The project uses **Socket.IO** to provide real-time communication between the Staff and Student interfaces.

When staff updates an order status, the student receives an instant notification without manually refreshing the page.

### Real-Time Events

```text
Staff Updates Order
        ↓
Socket.IO Server
        ↓
Student-Specific Socket Room
        ↓
Instant Student Notification
```

Supported statuses:

- Pending
- Preparing
- Ready
- Completed
- Cancelled

---

# 📧 Email Notification System

The application uses **Nodemailer** for automated email communication.

Students receive emails for:

- 📩 Order Confirmation
- 🎟️ Token Number
- 🍔 Ordered Items
- 💰 Total Amount
- 🔄 Order Status Changes

---

# 🔐 Security

The application implements multiple security mechanisms.

- 🔑 JWT Authentication
- 🔒 Password Hashing using bcryptjs
- 👥 Role-Based Access Control
- 🛡️ Protected API Routes
- 👨‍💼 Admin Authorization
- 💳 Razorpay Signature Verification
- 🔐 Environment Variables
- 🚫 Order Ownership Validation
- 📁 Secure File Upload Validation

> ⚠️ **Never upload `.env` files, passwords, API keys, database credentials or payment secrets to GitHub.**

---

# 🏗️ System Architecture

```text
                         ┌───────────────────┐
                         │     Student       │
                         │  React Frontend   │
                         └─────────┬─────────┘
                                   │
                              REST API
                                   │
                                   ▼
                         ┌───────────────────┐
                         │   Node.js +       │
                         │     Express       │
                         └───────┬───────────┘
                                 │
               ┌─────────────────┼─────────────────┐
               │                 │                 │
               ▼                 ▼                 ▼
        ┌────────────┐    ┌────────────┐    ┌────────────┐
        │  MongoDB   │    │ Razorpay   │    │ Socket.IO  │
        │  Database  │    │  Payment   │    │ Real-Time  │
        └────────────┘    └────────────┘    └────────────┘
                                 │
                                 ▼
                         ┌─────────────────┐
                         │    Nodemailer   │
                         │ Email Service   │
                         └─────────────────┘
```

---

# 🛠️ Technology Stack

## Frontend

- **React.js**
- **React Router**
- **Axios**
- **Bootstrap**
- **JavaScript**
- **CSS**

## Backend

- **Node.js**
- **Express.js**
- **JWT**
- **bcryptjs**
- **Multer**
- **Nodemailer**
- **Socket.IO**

## Database

- **MongoDB**
- **Mongoose**

## Payment

- **Razorpay**

---

# 📂 Project Structure

<details>
<summary><b>📁 Click to view project structure</b></summary>

```text
Smart-Canteen-System/
│
├── client/
│   ├── public/
│   ├── src/
│   │   ├── api/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── App.jsx
│   │   ├── index.css
│   │   └── index.js
│   └── package.json
│
├── server/
│   ├── controllers/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   ├── services/
│   ├── uploads/
│   ├── app.js
│   ├── canteendb.js
│   └── package.json
│
├── .gitignore
└── README.md
```

</details>

---

# 🔄 Application Workflow

<details>
<summary><b>🚀 Click to view complete workflow</b></summary>

```text
Student Registration
        ↓
Email OTP Verification
        ↓
Student Login
        ↓
Browse Food Menu
        ↓
Add Food to Cart
        ↓
Checkout
        ↓
Razorpay Payment
        ↓
Payment Verification
        ↓
Order Creation
        ↓
Token Generation
        ↓
Staff Receives Order
        ↓
Preparing
        ↓
Ready
        ↓
Student Pickup
        ↓
Completed
```

</details>

---

# 🧩 Main System Modules

| Module | Function |
|---|---|
| 🔐 Authentication | Registration, login and JWT authentication |
| 📧 OTP Verification | Email-based registration verification |
| 🍔 Food Management | Food CRUD and availability |
| 🛒 Cart | Manage selected food items |
| 💳 Payment | Razorpay payment processing |
| 📋 Order Management | Create and manage orders |
| 🎟️ Token Management | Automatic token generation |
| 👥 Queue Management | Track active order queue |
| 📺 Token Display | Live canteen token display |
| 🔔 Notifications | Real-time Socket.IO updates |
| 📧 Email Service | Automated email notifications |
| 👨‍🍳 Staff Management | Admin-controlled staff accounts |
| 📊 Admin Dashboard | Centralized administration |

---

# ⚙️ Installation

## 1️⃣ Clone Repository

```bash
git clone https://github.com/MohdAltamashh/Smart-Canteen-System.git
```

```bash
cd Smart-Canteen-System
```

---

## 2️⃣ Install Backend Dependencies

```bash
cd server
npm install
```

---

## 3️⃣ Install Frontend Dependencies

Open another terminal:

```bash
cd client
npm install
```

---

## 4️⃣ Configure Environment Variables

Create:

```text
server/.env
```

Configure the required environment variables for:

- MongoDB
- JWT
- Razorpay
- Email Service
- Admin Authentication

For the React frontend:

```text
client/.env
```

Example:

```env
REACT_APP_API_URL=http://localhost:5000/api
```

> Never put private API keys or secrets inside the React frontend environment.

---

## 5️⃣ Start Backend

```bash
cd server
node app.js
```

Backend runs on:

```text
http://localhost:5000
```

---

## 6️⃣ Start Frontend

Open another terminal:

```bash
cd client
npm start
```

The React application will open in the browser.

---

# 🧪 Testing

The system has been tested for the following workflows:

- ✅ Student Registration
- ✅ Email OTP Verification
- ✅ Student Login
- ✅ Staff Login
- ✅ Admin Login
- ✅ Food Menu
- ✅ Shopping Cart
- ✅ Razorpay Test Payment
- ✅ Order Creation
- ✅ Token Generation
- ✅ Order History
- ✅ Order Cancellation
- ✅ Staff Order Management
- ✅ Order Status Updates
- ✅ Live Token Queue
- ✅ Real-Time Socket Notifications
- ✅ Email Notifications
- ✅ Food Image Upload
- ✅ Staff Management

---

# 🎯 Project Objectives

The major objectives of the Smart Canteen System are:

1. Reduce physical queues at the campus canteen.
2. Allow students to pre-order food.
3. Provide digital payment facilities.
4. Automate token generation.
5. Provide real-time order tracking.
6. Improve staff order management.
7. Reduce manual order processing.
8. Provide centralized admin control.
9. Improve communication through notifications.
10. Create a faster and more organized canteen experience.

---

# 🚀 Future Enhancements

The following features can be added in future versions:

- 📱 Dedicated Android/iOS mobile application
- 💰 Production payment gateway
- 🧾 Digital invoice generation
- ⭐ Food rating and review system
- 📊 Advanced sales analytics
- 📦 Inventory management
- 🤖 AI-based food recommendations
- 📈 Food demand prediction
- 🔔 Push notifications
- 🎫 QR-based order verification
- 🏷️ Coupon and discount system

---

# 👨‍💻 Developer

<div align="center">

## Mohd Altamash

### MCA Student | Full-Stack Developer

**Smart Canteen Pre-Order & Token Management System**

Interested in:

**MERN Stack • Web Development • Backend Development • Database Management**

<br>

<a href="https://github.com/MohdAltamashh">
  <img src="https://img.shields.io/badge/GitHub-MohdAltamashh-black?logo=github" />
</a>

</div>

---

# 🎓 Academic Project

**Project Type:** Minor Project

**Project:** Smart Canteen Pre-Order & Token Management System

**Technology:** MERN Stack

**Purpose:** Academic / Educational Project

---

<div align="center">

## 🍽️ Smart Canteen

### Order Smart • Skip the Queue • Save Time

---

**Developed by Mohd Altamash**

⭐ If you find this project useful, consider starring the repository.

</div>
