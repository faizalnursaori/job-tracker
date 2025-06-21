# Job Tracker Application

A comprehensive job application tracking system built with modern web technologies.

## 🚀 Features

- **User Authentication** - Secure JWT-based authentication system
- **Job Application Management** - Complete CRUD operations for job applications
- **Company Database** - Centralized company information management
- **Status Tracking** - Customizable application status workflow
- **Priority System** - High/Medium/Low priority categorization
- **Notes System** - Rich note-taking with different note types
- **Document Management** - File upload and categorization
- **Activity Tracking** - Complete audit trail for all changes
- **Search & Filter** - Advanced filtering and search capabilities
- **Statistics Dashboard** - Analytics and insights for job applications

## 🛠️ Tech Stack

### Backend
- **Framework**: Express.js with TypeScript
- **Database**: SQLite with Prisma ORM
- **Authentication**: JWT with bcrypt password hashing
- **Validation**: Zod schema validation
- **Testing**: Jest with Supertest
- **Documentation**: ERD and API documentation

### Frontend
- *Coming soon...*

## 📁 Project Structure

```
job-tracker/
├── backend/                 # Express.js API server
│   ├── src/
│   │   ├── controllers/     # Route controllers
│   │   ├── middlewares/     # Custom middleware
│   │   ├── routes/          # API route definitions
│   │   ├── validators/      # Zod validation schemas
│   │   └── app.ts          # Express app configuration
│   ├── prisma/             # Database schema and migrations
│   ├── tests/              # Test suites
│   └── package.json
├── frontend/               # Frontend application (coming soon)
├── docs/                   # Documentation
│   ├── erd.md             # Entity Relationship Diagram
│   └── prd.md             # Product Requirements Document
└── README.md
```

## 🏃‍♂️ Quick Start

### Prerequisites
- Node.js (v18+ recommended)
- pnpm (recommended) or npm

### Backend Setup

1. **Navigate to backend directory**
   ```bash
   cd backend
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Set up database**
   ```bash
   pnpm db:push
   pnpm db:seed
   ```

5. **Run development server**
   ```bash
   pnpm dev
   ```

6. **Run tests**
   ```bash
   pnpm test
   ```

The API will be available at `http://localhost:5000`

## 📚 API Documentation

### Authentication Endpoints
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/profile` - Get user profile

### Job Application Endpoints
- `GET /api/job-applications` - List job applications (with filters)
- `POST /api/job-applications` - Create new job application
- `GET /api/job-applications/:id` - Get job application details
- `PUT /api/job-applications/:id` - Update job application
- `DELETE /api/job-applications/:id` - Delete job application
- `GET /api/job-applications/stats` - Get application statistics

### Company Endpoints
- `GET /api/companies` - List companies
- `POST /api/companies` - Create new company
- `GET /api/companies/suggestions` - Get company suggestions
- `GET /api/companies/:id` - Get company details
- `PUT /api/companies/:id` - Update company
- `DELETE /api/companies/:id` - Delete company

### Status Management
- `GET /api/statuses` - List all statuses
- `POST /api/statuses` - Create new status
- `PUT /api/statuses/:id` - Update status
- `DELETE /api/statuses/:id` - Delete status
- `POST /api/statuses/reorder` - Reorder statuses

### Notes Management
- `GET /api/notes` - List notes for job application
- `POST /api/notes` - Create new note
- `PUT /api/notes/:id` - Update note
- `DELETE /api/notes/:id` - Delete note

## 🗄️ Database Schema

The application uses a comprehensive database schema with 8 main entities:

- **Users** - User account management
- **Companies** - Company information database
- **Statuses** - Customizable application statuses
- **JobApplications** - Core job application data
- **ApplicationNotes** - Notes for each application

- **ApplicationActivities** - Audit trail

See [ERD Documentation](docs/erd.md) for detailed schema information.

## 🧪 Testing

The backend includes comprehensive test suites:

```bash
# Run all tests
pnpm test

# Run tests with coverage
pnpm test:coverage

# Run tests in watch mode
pnpm test:watch
```

**Test Results**: 30 tests, 29 passing ✅

## 🚧 Development Status

- ✅ **Backend API** - Complete with full CRUD operations
- ✅ **Authentication System** - JWT-based auth implemented
- ✅ **Database Schema** - Complete with all relationships
- ✅ **Testing Suite** - Comprehensive test coverage
- 🔄 **Frontend** - Coming soon
- 🔄 **Deployment** - Coming soon

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👨‍💻 Author

**Kabizal** - Full Stack Developer

---

Made with ❤️ for job seekers everywhere 