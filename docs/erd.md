# ERD Job Tracker Application

## Entity Relationship Diagram untuk Express + Prisma ORM

### **PRISMA SCHEMA**

```prisma
// This is your Prisma schema file
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql" // atau "mysql", "sqlite"
  url      = env("DATABASE_URL")
}

// ========== ENUMS ==========
enum JobLevel {
  ENTRY
  MID
  SENIOR
  LEAD
  MANAGER
  DIRECTOR
}

enum EmploymentType {
  FULL_TIME
  PART_TIME
  CONTRACT
  FREELANCE
  INTERNSHIP
}

enum NoteType {
  INTERVIEW
  FOLLOW_UP
  FEEDBACK
  RESEARCH
  REMINDER
  OTHER
}

enum ApplicationStatus {
  APPLIED
  PHONE_SCREEN
  INTERVIEW
  FINAL_INTERVIEW
  OFFER
  REJECTED
  WITHDRAWN
  ACCEPTED
}

// ========== MODELS ==========

model User {
  id           String   @id @default(cuid())
  email        String   @unique
  passwordHash String   @map("password_hash")
  firstName    String   @map("first_name")
  lastName     String   @map("last_name")
  phone        String?
  profileImage String?  @map("profile_image")
  createdAt    DateTime @default(now()) @map("created_at")
  updatedAt    DateTime @updatedAt @map("updated_at")

  // Relations
  jobApplications JobApplication[]

  @@map("users")
}

model Company {
  id          String   @id @default(cuid())
  name        String   @unique
  industry    String?
  website     String?
  location    String?
  description String?
  logoUrl     String?  @map("logo_url")
  size        String?  // "1-10", "11-50", "51-200", etc
  createdAt   DateTime @default(now()) @map("created_at")
  updatedAt   DateTime @updatedAt @map("updated_at")

  // Relations
  jobApplications JobApplication[]

  @@map("companies")
}

model Status {
  id        String   @id @default(cuid())
  name      String   @unique
  color     String?  // Hex color code
  sortOrder Int      @map("sort_order")
  isActive  Boolean  @default(true) @map("is_active")
  createdAt DateTime @default(now()) @map("created_at")

  // Relations
  jobApplications JobApplication[]

  @@map("statuses")
}

model JobApplication {
  id               String          @id @default(cuid())
  userId           String          @map("user_id")
  companyId        String          @map("company_id")
  statusId         String          @map("status_id")
  jobTitle         String          @map("job_title")
  jobLevel         JobLevel?       @map("job_level")
  employmentType   EmploymentType? @map("employment_type")
  salaryMin        Float?          @map("salary_min")
  salaryMax        Float?          @map("salary_max")
  currency         String          @default("IDR")
  location         String?
  isRemote         Boolean         @default(false) @map("is_remote")
  jobUrl           String?         @map("job_url")
  jobDescription   String?         @map("job_description")
  requirements     String?         // Job requirements
  appliedDate      DateTime        @map("applied_date")
  responseDeadline DateTime?       @map("response_deadline")
  personalNotes    String?         @map("personal_notes")
  priority         Int             @default(3) // 1=High, 2=Medium, 3=Low
  isFavorite       Boolean         @default(false) @map("is_favorite")
  source           String?         // "LinkedIn", "JobStreet", "Company Website", etc
  createdAt        DateTime        @default(now()) @map("created_at")
  updatedAt        DateTime        @updatedAt @map("updated_at")

  // Relations
  user      User                   @relation(fields: [userId], references: [id], onDelete: Cascade)
  company   Company                @relation(fields: [companyId], references: [id])
  status    Status                 @relation(fields: [statusId], references: [id])
  notes     ApplicationNote[]
  documents ApplicationDocument[]
  activities ApplicationActivity[]

  @@index([userId])
  @@index([companyId])
  @@index([statusId])
  @@index([appliedDate])
  @@index([priority])
  @@map("job_applications")
}

model ApplicationNote {
  id               String   @id @default(cuid())
  jobApplicationId String   @map("job_application_id")
  title            String
  content          String
  noteType         NoteType @default(OTHER) @map("note_type")
  noteDate         DateTime @map("note_date")
  isImportant      Boolean  @default(false) @map("is_important")
  createdAt        DateTime @default(now()) @map("created_at")
  updatedAt        DateTime @updatedAt @map("updated_at")

  // Relations
  jobApplication JobApplication @relation(fields: [jobApplicationId], references: [id], onDelete: Cascade)

  @@index([jobApplicationId])
  @@index([noteDate])
  @@map("application_notes")
}

model DocumentType {
  id          String   @id @default(cuid())
  name        String   @unique
  description String?
  isRequired  Boolean  @default(false) @map("is_required")
  sortOrder   Int      @default(1) @map("sort_order")
  createdAt   DateTime @default(now()) @map("created_at")

  // Relations
  documents ApplicationDocument[]

  @@map("document_types")
}

model ApplicationDocument {
  id               String   @id @default(cuid())
  jobApplicationId String   @map("job_application_id")
  documentTypeId   String   @map("document_type_id")
  fileName         String   @map("file_name")
  originalName     String   @map("original_name")
  filePath         String   @map("file_path")
  fileType         String   @map("file_type")
  fileSize         Int      @map("file_size") // in bytes
  version          String   @default("v1")
  isActive         Boolean  @default(true) @map("is_active")
  uploadedAt       DateTime @default(now()) @map("uploaded_at")
  createdAt        DateTime @default(now()) @map("created_at")
  updatedAt        DateTime @updatedAt @map("updated_at")

  // Relations
  jobApplication JobApplication @relation(fields: [jobApplicationId], references: [id], onDelete: Cascade)
  documentType   DocumentType   @relation(fields: [documentTypeId], references: [id])

  @@index([jobApplicationId])
  @@index([documentTypeId])
  @@map("application_documents")
}

model ApplicationActivity {
  id               String   @id @default(cuid())
  jobApplicationId String   @map("job_application_id")
  activity         String   // "Status changed", "Note added", "Document uploaded", etc
  description      String?
  metadata         Json?    // Additional data as JSON
  createdAt        DateTime @default(now()) @map("created_at")

  // Relations
  jobApplication JobApplication @relation(fields: [jobApplicationId], references: [id], onDelete: Cascade)

  @@index([jobApplicationId])
  @@index([createdAt])
  @@map("application_activities")
}
```

## **RELASI ANTAR TABEL**

### **One-to-Many Relationships:**

1. **User → JobApplication** (1:N)
   - Satu user dapat memiliki banyak job application
   - `User.id = JobApplication.userId`

2. **Company → JobApplication** (1:N)
   - Satu company dapat menerima banyak job application
   - `Company.id = JobApplication.companyId`

3. **Status → JobApplication** (1:N)
   - Satu status dapat digunakan oleh banyak job application
   - `Status.id = JobApplication.statusId`

4. **JobApplication → ApplicationNote** (1:N)
   - Satu job application dapat memiliki banyak notes
   - `JobApplication.id = ApplicationNote.jobApplicationId`

5. **JobApplication → ApplicationDocument** (1:N)
   - Satu job application dapat memiliki banyak documents
   - `JobApplication.id = ApplicationDocument.jobApplicationId`

6. **DocumentType → ApplicationDocument** (1:N)
   - Satu document type dapat digunakan oleh banyak documents
   - `DocumentType.id = ApplicationDocument.documentTypeId`

7. **JobApplication → ApplicationActivity** (1:N)
   - Satu job application dapat memiliki banyak activities (audit trail)
   - `JobApplication.id = ApplicationActivity.jobApplicationId`

## **FITUR YANG DIDUKUNG**

### **Core Features:**
- ✅ **User Management** - Registration, login, profile
- ✅ **Company Database** - Centralized company information
- ✅ **Job Application Tracking** - Complete job application lifecycle
- ✅ **Status Management** - Customizable status workflow
- ✅ **Document Management** - File upload with categorization
- ✅ **Notes System** - Rich note-taking with types
- ✅ **Activity Tracking** - Audit trail for all changes

### **Advanced Features:**
- ✅ **Priority System** - High/Medium/Low priority jobs
- ✅ **Favorites** - Mark important applications
- ✅ **Remote Work Filter** - Track remote opportunities
- ✅ **Salary Tracking** - Min/max salary with currency
- ✅ **Source Tracking** - Where the job was found
- ✅ **Deadline Management** - Response deadline tracking

### **Search & Filter Capabilities:**
- ✅ **By Company** - Filter by specific companies
- ✅ **By Status** - Filter by application status
- ✅ **By Priority** - Filter by priority level
- ✅ **By Date Range** - Filter by applied date
- ✅ **By Job Level** - Filter by seniority level
- ✅ **By Employment Type** - Full-time, contract, etc.
- ✅ **By Location** - On-site or remote
- ✅ **By Salary Range** - Min/max salary filtering

## **SEED DATA EXAMPLES**

```typescript
// Default Statuses
const defaultStatuses = [
  { name: 'Applied', color: '#3B82F6', sortOrder: 1 },
  { name: 'Phone Screen', color: '#F59E0B', sortOrder: 2 },
  { name: 'Technical Interview', color: '#8B5CF6', sortOrder: 3 },
  { name: 'Final Interview', color: '#EC4899', sortOrder: 4 },
  { name: 'Offer', color: '#10B981', sortOrder: 5 },
  { name: 'Rejected', color: '#EF4444', sortOrder: 6 },
  { name: 'Withdrawn', color: '#6B7280', sortOrder: 7 },
  { name: 'Accepted', color: '#059669', sortOrder: 8 }
]

// Default Document Types
const defaultDocumentTypes = [
  { name: 'Resume', description: 'CV or Resume', isRequired: true, sortOrder: 1 },
  { name: 'Cover Letter', description: 'Personalized cover letter', sortOrder: 2 },
  { name: 'Portfolio', description: 'Work samples or portfolio', sortOrder: 3 },
  { name: 'Certificate', description: 'Professional certificates', sortOrder: 4 },
  { name: 'Transcript', description: 'Academic transcript', sortOrder: 5 }
]
```

## **API ENDPOINTS EXAMPLES**

```typescript
// Job Applications
GET    /api/job-applications          // List with filters
POST   /api/job-applications          // Create new
GET    /api/job-applications/:id      // Get by ID
PUT    /api/job-applications/:id      // Update
DELETE /api/job-applications/:id      // Delete

// Companies
GET    /api/companies                 // List companies
POST   /api/companies                 // Create company
GET    /api/companies/:id             // Get company
PUT    /api/companies/:id             // Update company

// Documents
POST   /api/job-applications/:id/documents    // Upload document
GET    /api/job-applications/:id/documents    // List documents
DELETE /api/documents/:id                     // Delete document

// Notes
POST   /api/job-applications/:id/notes        // Add note
GET    /api/job-applications/:id/notes        // List notes
PUT    /api/notes/:id                         // Update note
DELETE /api/notes/:id                         // Delete note

// Analytics
GET    /api/analytics/dashboard               // Dashboard stats
GET    /api/analytics/status-distribution     // Status breakdown
GET    /api/analytics/application-timeline    // Timeline view
```

Schema ini mendukung semua fitur yang disebutkan dalam PRD dan dapat di-scale untuk kebutuhan masa depan dengan Express.js dan Prisma ORM!
