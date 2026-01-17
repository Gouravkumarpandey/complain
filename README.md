
# QuickFix - AI-Powered Complaint Management System

## Overview

<img width="1900" height="907" alt="image" src="https://github.com/user-attachments/assets/62fd604a-4657-41f4-9e40-086f2d2fac22" />

QuickFix is an enterprise-grade complaint management system that leverages artificial intelligence to enhance customer support operations. The platform provides real-time complaint tracking, intelligent ticket assignment, automated responses, sentiment analysis, and multi-channel communication. It is designed for scalability, security, and operational efficiency.

## Key Features

### User Functionality
- Submit complaints through a user-friendly interface
- Track complaint status in real time
- Access live chat support via integrated chatbot
- Receive notifications on complaint progress
- Provide feedback on resolutions
- Access a personal dashboard for complaint history

### Agent Functionality
- Manage and resolve assigned complaints
- Access AI-generated reply suggestions
- Monitor performance metrics
- Communicate with users in real time
- Receive automatic ticket assignments based on availability
- Access analytics dashboards

### Administrator Functionality
- Manage users, agents, and roles
- Monitor system analytics and performance
- Configure system settings
- Generate detailed reports
- Manage subscription and billing

### Artificial Intelligence Capabilities
- Automated complaint classification
- Sentiment analysis for urgency detection
- AI-powered response suggestions
- Text summarization
- Semantic search and similarity matching
- Integration with Dialogflow and Rasa chatbots

## Technology Stack

### Frontend
| Technology | Purpose | Version |
|------------|---------|---------|
| React | UI Framework | 18.3.1 |
| TypeScript | Type Safety | Latest |
| Vite | Build Tool | Latest |
| Material-UI | Component Library | 7.3.4 |
| React Router | Navigation | 7.9.1 |
| Socket.IO Client | Real-time Communication | 4.8.1 |
| Axios | HTTP Client | 1.12.2 |
| Recharts | Data Visualization | 3.4.1 |
| Tailwind CSS | Utility-First CSS | Latest |
| Lucide React | Icons | 0.344.0 |

### Backend
| Technology | Purpose | Version |
|------------|---------|---------|
| Node.js | Runtime Environment | 18+ |
| Express.js | Web Framework | 4.18.2 |
| MongoDB | Database | Latest |
| Mongoose | ODM | 7.5.0 |
| Socket.IO | WebSocket Server | 4.8.1 |
| Redis | Caching Layer | 5.10.0 |
| JWT | Authentication | 9.0.2 |
| Passport.js | OAuth Integration | 0.7.0 |
| Stripe | Payment Processing | 17.5.0 |
| Nodemailer | Email Service | 7.0.12 |
| AWS SDK | SNS/SQS Integration | 3.971.0 |

### AI Service
| Technology | Purpose | Version |
|------------|---------|---------|
| FastAPI | Python Web Framework | 0.68.0+ |
| Transformers | NLP Models | 4.30.0+ |
| Sentence Transformers | Text Embeddings | 2.2.2+ |
| PyTorch | Deep Learning | 2.0.0+ |
| Uvicorn | ASGI Server | 0.15.0+ |
| Pydantic | Data Validation | 1.10.0+ |

### Additional Services
- Google Generative AI (Gemini) for advanced text generation
- DeepSeek for alternative LLM responses
- Docker and Docker Compose for containerization
- AWS SNS/SQS for event-driven processing
- Vercel for frontend deployment

## System Architecture

QuickFix is built using a microservices architecture with event-driven design principles. The system is composed of the following major components:

- **Frontend**: React/TypeScript SPA for users, agents, and administrators
- **Backend API**: Node.js/Express REST API with Socket.IO for real-time communication
- **AI Service**: Python FastAPI microservice for NLP and ML tasks
- **Database**: MongoDB for persistent storage
- **Cache**: Redis for session and data caching
- **Event Processing**: AWS SNS/SQS for asynchronous ticket assignment and notifications
- **Worker**: Background worker for processing SQS messages
- **Notification Services**: Email (Nodemailer), WhatsApp, and in-app notifications

### High-Level Architecture Diagram

```
Client (Web UI)
        |
        | HTTPS / WebSocket
        v
API Gateway (Express.js)
        |--- MongoDB (Database)
        |--- Redis (Cache)
        |--- AI Service (FastAPI)
        |--- AWS SNS/SQS (Events)
        |--- Notification Services (Email, WhatsApp)
        |--- SQS Worker (Background Processing)
```

### Event-Driven Workflow

1. User submits a complaint via the frontend.
2. Backend API saves the complaint and publishes an event to AWS SNS.
3. SQS worker processes the event, assigns the ticket to an available agent, and updates agent status.
4. Notifications are sent to the agent and user in real time.
5. Upon resolution, the process is repeated for ticket closure and feedback collection.

## Project Structure

...existing code...

## 📖 About QuickFix

QuickFix is a comprehensive complaint management system that leverages artificial intelligence to revolutionize customer support operations. Built with modern web technologies and AI capabilities, it provides real-time complaint tracking, intelligent ticket assignment, automated responses, sentiment analysis, and multi-channel communication support.

### 🎯 Key Highlights

- **AI-Powered Intelligence**: Automated complaint classification, sentiment analysis, and smart reply generation
- **Real-Time Communication**: WebSocket-based live updates and instant notifications
- **Event-Driven Architecture**: Scalable AWS SNS/SQS integration for asynchronous processing
- **Multi-Channel Support**: WhatsApp integration, email notifications, and web-based chatbot
- **Agent Dashboard**: Comprehensive tools for support agents with AI assistance
- **Analytics & Reporting**: Detailed insights and performance metrics
- **Subscription Management**: Stripe integration for tiered pricing plans
- **Role-Based Access**: Separate dashboards for users, agents, and administrators

---

## ✨ Features

### For Users
- 📝 **Submit Complaints**: Easy-to-use complaint submission form
- 🔍 **Track Status**: Real-time complaint status tracking
- 💬 **Live Chat**: Chatbot assistance for quick queries
- 🔔 **Notifications**: Instant updates on complaint progress
- ⭐ **Feedback System**: Rate and review complaint resolution
- 📊 **Personal Dashboard**: View all complaints and their status

### For Agents
- 📋 **Ticket Management**: View and manage assigned complaints
- 🤖 **AI Assistance**: Get AI-generated reply suggestions
- 📈 **Performance Metrics**: Track resolution times and ratings
- 💬 **Real-Time Chat**: Communicate with users instantly
- 🎯 **Smart Assignment**: Automatic ticket assignment based on availability
- 📊 **Analytics Dashboard**: Comprehensive performance insights

### For Administrators
- 👥 **User Management**: Manage users, agents, and roles
- 📊 **System Analytics**: Monitor system performance and metrics
- 🔧 **Configuration**: System settings and customization
- 📈 **Reports**: Generate detailed performance reports
- 💰 **Subscription Management**: Handle billing and plans

### AI Capabilities
- 🧠 **Intelligent Classification**: Auto-categorize complaints by type
- 😊 **Sentiment Analysis**: Detect customer emotion and urgency
- 💬 **Smart Reply Generation**: AI-powered response suggestions
- 📝 **Text Summarization**: Generate complaint summaries
- 🔤 **Embeddings**: Semantic search and similarity matching
- 🤖 **Chatbot Integration**: Dialogflow and Rasa support

---

## 🛠 Technology Stack

### Frontend
| Technology | Purpose | Version |
|------------|---------|---------|
| **React** | UI Framework | 18.3.1 |
| **TypeScript** | Type Safety | Latest |
| **Vite** | Build Tool | Latest |
| **Material-UI** | Component Library | 7.3.4 |
| **React Router** | Navigation | 7.9.1 |
| **Socket.IO Client** | Real-time Communication | 4.8.1 |
| **Axios** | HTTP Client | 1.12.2 |
| **Recharts** | Data Visualization | 3.4.1 |
| **Tailwind CSS** | Utility-First CSS | Latest |
| **Lucide React** | Icons | 0.344.0 |

### Backend
| Technology | Purpose | Version |
|------------|---------|---------|
| **Node.js** | Runtime Environment | 18+ |
| **Express.js** | Web Framework | 4.18.2 |
| **MongoDB** | Database | Latest |
| **Mongoose** | ODM | 7.5.0 |
| **Socket.IO** | WebSocket Server | 4.8.1 |
| **Redis** | Caching Layer | 5.10.0 |
| **JWT** | Authentication | 9.0.2 |
| **Passport.js** | OAuth Integration | 0.7.0 |
| **Stripe** | Payment Processing | 17.5.0 |
| **Nodemailer** | Email Service | 7.0.12 |
| **AWS SDK** | SNS/SQS Integration | 3.971.0 |

### AI Service
| Technology | Purpose | Version |
|------------|---------|---------|
| **FastAPI** | Python Web Framework | 0.68.0+ |
| **Transformers** | NLP Models | 4.30.0+ |
| **Sentence Transformers** | Text Embeddings | 2.2.2+ |
| **PyTorch** | Deep Learning | 2.0.0+ |
| **Uvicorn** | ASGI Server | 0.15.0+ |
| **Pydantic** | Data Validation | 1.10.0+ |

### AI/ML Models & Services
- **Google Generative AI (Gemini)**: Advanced text generation and analysis
- **DeepSeek**: Alternative LLM for response generation
- **Sentence Transformers**: Text embeddings and semantic similarity
- **Transformers**: NLP tasks (classification, sentiment analysis)

### DevOps & Infrastructure
- **Docker**: Containerization
- **Docker Compose**: Multi-container orchestration
- **AWS SNS**: Event publishing
- **AWS SQS**: Message queue processing
- **Vercel**: Frontend deployment
- **GitHub**: Version control

### Security & Middleware
- **Helmet.js**: Security headers
- **CORS**: Cross-origin resource sharing
- **Express Rate Limit**: API rate limiting
- **Bcrypt**: Password hashing
- **Morgan**: HTTP request logging
- **Compression**: Response compression

---

## 🏗 Architecture

<img width="1931" height="1436" alt="diagram-export-18-01-2026-00_22_20" src="https://github.com/user-attachments/assets/64150bd2-875e-43ec-8f4b-c64f2e04a183" />

QuickFix follows a **microservices architecture** with an **event-driven design** for scalability and reliability.

### System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENT LAYER                             │
├─────────────────────────────────────────────────────────────────┤
│  React Frontend (Vite + TypeScript + Material-UI)               │
│  - User Dashboard  - Agent Dashboard  - Admin Dashboard         │
│  - Real-time notifications via Socket.IO                        │
└──────────────────────┬──────────────────────────────────────────┘
                       │
                       │ HTTPS / WebSocket
                       ▼
┌─────────────────────────────────────────────────────────────────┐
│                      API GATEWAY LAYER                           │
├─────────────────────────────────────────────────────────────────┤
│  Express.js Server (Node.js)                                     │
│  - REST API Endpoints                                            │
│  - Socket.IO Server (Real-time bidirectional communication)      │
│  - Authentication & Authorization (JWT)                          │
│  - Rate Limiting & Security (Helmet, CORS)                       │
└──────┬─────────────┬─────────────┬────────────┬─────────────────┘
       │             │             │            │
       ▼             ▼             ▼            ▼
┌─────────┐   ┌──────────┐  ┌──────────┐  ┌─────────────┐
│ MongoDB │   │  Redis   │  │ AI Service│  │ AWS SNS/SQS │
│   DB    │   │  Cache   │  │  FastAPI  │  │   Events    │
└─────────┘   └──────────┘  └──────────┘  └─────────────┘
                                   │              │
                                   │              │
                      ┌────────────┴──────┐       │
                      │ AI Models         │       │
                      │ - Classifier      │       │
                      │ - Sentiment       │       │
                      │ - Reply Generator │       │
                      │ - Embedder        │       │
                      │ - Summarizer      │       │
                      └───────────────────┘       │
                                                  │
                      ┌───────────────────────────┘
                      │
                      ▼
              ┌───────────────┐
              │  SQS Worker   │
              │  Background   │
              │  Processing   │
              └───────────────┘
                      │
        ┌─────────────┼─────────────┐
        ▼             ▼             ▼
  ┌─────────┐  ┌──────────┐  ┌──────────┐
  │ Email   │  │ WhatsApp │  │  Ticket  │
  │ Service │  │ Service  │  │Assignment│
  └─────────┘  └──────────┘  └──────────┘
```

### Event-Driven Architecture Flow

#### 1️⃣ Ticket Creation Flow
```
User creates complaint
        ↓
API saves to MongoDB
        ↓
Publishes "ticket.created" event to SNS
        ↓
SNS → SQS Queue
        ↓
Worker polls SQS
        ↓
Find available agent → Assign ticket → Mark agent BUSY
        ↓
Send notification to agent
        ↓
Real-time update via Socket.IO
```

#### 2️⃣ Ticket Resolution Flow
```
Agent marks complaint as resolved
        ↓
API updates MongoDB
        ↓
Publish "ticket.resolved" event to SNS
        ↓
SNS → SQS Queue
        ↓
Worker polls SQS
        ↓
Mark agent as FREE
        ↓
Check for unassigned tickets
        ↓
Auto-assign next ticket to same agent (if available)
        ↓
Send notifications + Real-time updates
```

### Component Breakdown

#### Frontend Components
- **Authentication**: Login, signup, OAuth (Google, Facebook), OTP verification
- **Dashboards**: User, Agent, and Admin specific dashboards
- **Complaints**: Form, list, details, filters, AI reply panel
- **Chatbot**: Interactive customer support bot
- **Analytics**: Charts, reports, statistics
- **Notifications**: Real-time notification center
- **Subscriptions**: Pricing plans, payment integration

#### Backend Services
- **Authentication Service**: JWT-based auth, OAuth, password reset
- **Complaint Service**: CRUD operations for complaints
- **Agent Service**: Agent assignment, availability management
- **AI Service Integration**: Proxy to Python AI service
- **Notification Service**: Multi-channel notifications
- **Email Service**: Nodemailer integration
- **WhatsApp Service**: WhatsApp Business API integration
- **Payment Service**: Stripe integration
- **Cache Service**: Redis caching for performance
- **DeepSeek Service**: LLM integration for AI responses

#### AI Service Models
- **Classifier**: Categorize complaints automatically
- **Sentiment Analyzer**: Detect emotional tone and urgency
- **Reply Generator**: Generate context-aware responses
- **Summarizer**: Create concise complaint summaries
- **Embedder**: Generate semantic embeddings for search

---

## 📁 Project Structure

```
QuickFix/
│
├── frontend/                    # React TypeScript Frontend
│   ├── src/
│   │   ├── components/         # React components
│   │   │   ├── auth/          # Authentication components
│   │   │   ├── complaints/    # Complaint management
│   │   │   ├── dashboard/     # Dashboard components
│   │   │   ├── chatbot/       # Chatbot interface
│   │   │   ├── analytics/     # Analytics & charts
│   │   │   ├── notifications/ # Notification components
│   │   │   └── subscription/  # Payment & pricing
│   │   ├── contexts/          # React Context providers
│   │   │   ├── AuthContext.tsx
│   │   │   ├── ComplaintContext.tsx
│   │   │   ├── NotificationContext.tsx
│   │   │   └── SocketContext.tsx
│   │   ├── hooks/             # Custom React hooks
│   │   ├── services/          # API service layer
│   │   ├── types/             # TypeScript type definitions
│   │   └── utils/             # Utility functions
│   ├── public/                # Static assets
│   ├── package.json
│   ├── vite.config.ts         # Vite configuration
│   └── tailwind.config.js     # Tailwind CSS config
│
├── backend/                     # Node.js Express Backend
│   ├── src/
│   │   ├── server.js          # Main server file
│   │   ├── config/            # Configuration files
│   │   │   ├── db.js          # MongoDB connection
│   │   │   ├── redis.js       # Redis connection
│   │   │   └── env.js         # Environment variables
│   │   ├── controllers/       # Request handlers
│   │   │   ├── authController.js
│   │   │   ├── paymentController.js
│   │   │   ├── sessionController.js
│   │   │   └── subscriptionController.js
│   │   ├── middleware/        # Express middleware
│   │   │   ├── auth.js        # JWT authentication
│   │   │   ├── cacheMiddleware.js
│   │   │   ├── cspConfig.js   # Content Security Policy
│   │   │   ├── dbCheck.js     # Database health check
│   │   │   ├── errorHandler.js
│   │   │   └── planAuth.js    # Subscription authorization
│   │   ├── models/            # Mongoose schemas
│   │   │   ├── Complaint.js
│   │   │   ├── User.js
│   │   │   └── Notification.js
│   │   ├── routes/            # API route definitions
│   │   │   ├── auth.js
│   │   │   ├── complaints.js
│   │   │   ├── agents.js
│   │   │   ├── ai.js
│   │   │   ├── analytics.js
│   │   │   ├── payments.js
│   │   │   └── subscriptions.js
│   │   ├── services/          # Business logic
│   │   │   ├── agentService.js
│   │   │   ├── aiService.js
│   │   │   ├── authService.js
│   │   │   ├── cacheService.js
│   │   │   ├── deepseekService.js
│   │   │   ├── emailService.js
│   │   │   ├── notificationService.js
│   │   │   ├── ticketAssignmentService.js
│   │   │   └── whatsappService.js
│   │   ├── socket/            # Socket.IO handlers
│   │   │   ├── socketHandlers.js
│   │   │   └── handlers/
│   │   │       ├── agentHandler.js
│   │   │       ├── chatHandler.js
│   │   │       ├── complaintHandler.js
│   │   │       └── notificationHandler.js
│   │   ├── utils/             # Utility functions
│   │   └── validators/        # Input validation
│   ├── worker/                # Background workers
│   │   └── sqsWorker.js       # SQS message processor
│   ├── utils/
│   │   └── snsPublisher.js    # SNS event publisher
│   ├── scripts/
│   │   └── seedData.js        # Database seeding
│   ├── package.json
│   └── .env.example           # Environment template
│
├── ai-service/                  # Python FastAPI AI Service
│   ├── app/
│   │   ├── main.py            # FastAPI application
│   │   ├── api/
│   │   │   └── routes.py      # API endpoints
│   │   ├── models/            # AI/ML models
│   │   │   ├── classifier.py  # Complaint classification
│   │   │   ├── sentiment.py   # Sentiment analysis
│   │   │   ├── reply_gen.py   # Response generation
│   │   │   ├── summarizer.py  # Text summarization
│   │   │   └── embedder.py    # Text embeddings
│   │   ├── chatbot/           # Chatbot integrations
│   │   │   ├── dialogflow_connector.py
│   │   │   └── rasa_connector.py
│   │   └── utils/
│   │       └── text_processing.py
│   ├── main.py                # Entry point
│   ├── requirements.txt       # Python dependencies
│   ├── Dockerfile            # Docker configuration
│   └── docker-compose.override.yml
│
├── README.md                   # This file
└── .gitignore                 # Git ignore rules
```

---

## 🚀 How It Works

### 1. User Journey

1. **Registration & Login**
   - Users register via email or OAuth (Google/Facebook)
   - Email verification with OTP
   - JWT-based session management

2. **Complaint Submission**
   - User fills out complaint form with details
   - System auto-classifies using AI (product, billing, technical, etc.)
   - Sentiment analysis determines urgency
   - Complaint saved to MongoDB
   - Event published to AWS SNS

3. **Ticket Assignment**
   - SQS worker receives event
   - Finds available agent based on:
     - Agent availability status
     - Current workload
     - Expertise matching (future feature)
   - Assigns ticket and marks agent as BUSY
   - Sends real-time notification via Socket.IO

4. **Agent Interaction**
   - Agent receives notification in dashboard
   - Views complaint details with AI insights:
     - Classification category
     - Sentiment score
     - Urgency level
     - AI-generated reply suggestions
   - Communicates with user via live chat
   - Updates complaint status

5. **Resolution & Feedback**
   - Agent marks complaint as resolved
   - Event triggers agent availability check
   - Auto-assigns next pending ticket if available
   - User receives resolution notification
   - User provides feedback and rating

### 2. Real-Time Communication Flow

```
Client connects → Socket.IO handshake → JWT validation → Room assignment
                                                              ↓
                                                      User-specific room
                                                      Agent-specific room
                                                      Global notification room
                                                              ↓
Server events: complaint updates, chat messages, notifications
                                                              ↓
Client receives → Updates UI in real-time
```

### 3. AI Processing Pipeline

```
Text Input
    ↓
Text Preprocessing (cleaning, normalization)
    ↓
┌───────────────┬──────────────┬─────────────┬────────────┐
│               │              │             │            │
Classification  Sentiment    Embeddings  Summarization  Reply
    ↓              ↓             ↓           ↓           ↓
Category        Emotion      Vector       Summary     Suggested
(Billing,     (Angry,      Representation (Brief)    Response
Technical)    Neutral)                                (Draft)
    │              │             │           │           │
    └──────────────┴─────────────┴───────────┴───────────┘
                            ↓
                    Combined AI Insights
                            ↓
                    Returned to Backend
                            ↓
                    Stored in MongoDB + Sent to Frontend
```

### 4. Event-Driven Processing

- **Async Processing**: Heavy operations offloaded to SQS workers
- **Scalability**: Multiple workers can process messages in parallel
- **Reliability**: Message persistence ensures no lost events
- **Decoupling**: Services communicate via events, not direct calls

### 5. Caching Strategy

- **Redis Layer**: Frequently accessed data cached
- **Cache Keys**: User sessions, complaint lists, agent availability
- **TTL**: Auto-expiration for stale data
- **Cache Invalidation**: On data updates (create, update, delete)

### 6. Security Measures

- **Authentication**: JWT tokens with expiration
- **Authorization**: Role-based access control (User, Agent, Admin)
- **Password Security**: Bcrypt hashing with salt
- **Rate Limiting**: Prevents API abuse
- **CSP Headers**: Content Security Policy via Helmet
- **Input Validation**: Joi schemas for request validation
- **SQL Injection Prevention**: Mongoose ORM
- **XSS Protection**: React auto-escaping + sanitization

---

## 🔧 Installation

### Prerequisites

- **Node.js** (v18 or higher)
- **Python** (v3.8 or higher)
- **MongoDB** (local or Atlas)
- **Redis** (optional, for caching)
- **AWS Account** (for SNS/SQS)
- **Stripe Account** (for payments)
- **Google Cloud** (for OAuth & Gemini AI)


### Installation Steps

#### 1. Clone the Repository
```bash
git clone https://github.com/Gouravkumarpandey/complain.git
cd complain
```

#### 2. Install Backend Dependencies
```bash
cd backend
npm install
```

#### 3. Install Frontend Dependencies
```bash
cd ../frontend
npm install
```

#### 4. Install AI Service Dependencies
```bash
cd ../ai-service
pip install -r requirements.txt
```

#### 5. Setup Environment Variables
- Copy `.env.example` to `.env` in each service directory
- Fill in your actual credentials and API keys

#### 6. Start MongoDB
```bash
# If using local MongoDB
mongod
```

#### 7. Start Redis (Optional)
```bash
redis-server
```

#### 8. Run Database Seeding (Optional)
```bash
cd backend
node scripts/seedData.js
```

---

## 🎮 Usage

### Development Mode

#### Start Backend Server
```bash
cd backend
npm run dev
# Server runs on http://localhost:5000
```

#### Start Frontend Development Server
```bash
cd frontend
npm run dev
# Frontend runs on http://localhost:5173
```

#### Start AI Service
```bash
cd ai-service
python main.py
# AI Service runs on http://localhost:8001
```

#### Start SQS Worker (Optional for event processing)
```bash
cd backend
node worker/sqsWorker.js
```

### Production Build

#### Build Frontend
```bash
cd frontend
npm run build
# Outputs to dist/
```

#### Start Backend in Production
```bash
cd backend
npm start
```

### Docker Deployment

#### Using Docker Compose (AI Service)
```bash
cd ai-service
docker-compose up -d
```

---

## 🧪 Testing

### Backend Tests
```bash
cd backend
npm test
```

### Test Agent Flow
```bash
cd backend
node testAgentFlow.js
```

### Test Complaint Assignment
```bash
cd backend
node debug_assignment.js
```

### AI Service Tests
```bash
cd ai-service
python test_service.py
```

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

---

## 👨‍💻 Author

**Gourav Kumar Pandey**
- GitHub: [@Gouravkumarpandey](https://github.com/Gouravkumarpandey)

---

## 🙏 Acknowledgments

- Google Generative AI for Gemini models
- OpenAI for transformer models
- MongoDB team for excellent documentation
- Socket.IO community
- React and Node.js communities
- All open-source contributors

---

## 📞 Support

For support, email support@quickfix.com or join our Slack channel.

---

<div align="center">

**Made with ❤️ by QuickFix Team**

[⬆ Back to Top](#-quickfix---ai-powered-complaint-management-system)

</div>

