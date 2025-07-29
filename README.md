# 🚀 Harmony AI - AI-Powered Professional Networking Platform

![Harmony AI Logo](client/public/Harmony%20Logo%20Final.png)

Harmony AI is a modern, AI-powered professional networking platform that combines the best of LinkedIn-style networking with cutting-edge artificial intelligence features. Connect with professionals, showcase your skills through digital CVs, discover job opportunities, and leverage AI to enhance your professional presence.

## ✨ Features

### 🤖 AI-Powered Features
- **AI Post Suggestions**: Generate engaging professional content using OpenAI GPT-4
- **Digital CV Analysis**: AI-powered video resume analysis with feedback and scoring
- **Smart Job Recommendations**: Personalized job matching based on skills and experience
- **Content Enhancement**: AI-assisted post optimization and hashtag suggestions

### 👥 Professional Networking
- **User Profiles**: Comprehensive professional profiles with skills, experience, and education
- **Connections System**: Send and manage connection requests with other professionals
- **Real-time Messaging**: Chat with your professional network
- **Communities**: Join and create professional communities around interests and industries

### 💼 Job Board & Career Tools
- **Job Posting & Discovery**: Browse and apply for jobs with advanced filtering
- **Applicant Tracking**: Full ATS for recruiters to manage applications
- **Saved Jobs**: Bookmark interesting opportunities
- **Company Profiles**: Detailed company pages and job listings

### 📱 Content & Engagement
- **Posts & Feed**: Share professional updates, insights, and achievements
- **Interactive Engagement**: Like, comment, and repost system with multiple reaction types
- **Digital CV Upload**: Video resume uploads with AI analysis (up to 200MB)
- **Anonymous Posting**: Option to share content anonymously

### 🛡️ Security & Privacy
- **Secure Authentication**: Passport.js-based authentication with session management
- **Privacy Controls**: Granular privacy settings for profile and digital CV visibility
- **Two-Factor Authentication**: Enhanced security options (prepared)
- **Admin Dashboard**: Comprehensive admin panel for platform management

## 🛠️ Tech Stack

### Frontend
- **React 18** with TypeScript
- **Vite** for build tooling and development
- **Tailwind CSS** + **shadcn/ui** for modern, responsive design
- **React Query (TanStack Query)** for state management and caching
- **React Hook Form** + **Zod** for form handling and validation
- **Wouter** for client-side routing

### Backend
- **Node.js** with TypeScript (ESM)
- **Express.js** REST API
- **PostgreSQL** with **Drizzle ORM**
- **Passport.js** for authentication
- **Multer** for file uploads
- **OpenAI API** for AI features

### Infrastructure
- **PostgreSQL** database (Neon serverless)
- **Session-based authentication** with PostgreSQL storage
- **File storage** for profile images and digital CVs
- **Environment-based configuration**

## 🚀 Quick Start

### Prerequisites
- **Node.js 18+**
- **PostgreSQL 14+**
- **OpenAI API Key** (for AI features)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/harmony-ai.git
   cd harmony-ai
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Configuration**
   
   Create a `.env` file in the root directory:
   ```env
   # OpenAI Configuration
   OPENAI_API_KEY=your_openai_api_key_here
   
   # Database Configuration
   DATABASE_URL=your_postgresql_connection_string
   
   # Session Configuration
   SESSION_SECRET=your_secure_session_secret
   
   # Optional: Port Configuration
   PORT=5000
   ```

4. **Database Setup**
   ```bash
   # Push database schema
   npm run db:push
   ```

   If you encounter database connection issues, you can run the database connection checker:
   ```bash
   # Check database connection
   npm run db:check
   ```
   
   This will diagnose common database connection problems and provide suggestions for fixing them.

5. **Start Development Server**
   ```bash
   npm run dev
   ```

   The application will be available at:
   - **Frontend**: http://localhost:5001
   - **Backend API**: http://localhost:5000

## 🔧 Configuration

### OpenAI API Setup
1. Get your API key from [OpenAI Platform](https://platform.openai.com/api-keys)
2. Add it to your `.env` file as `OPENAI_API_KEY`
3. Ensure you have sufficient credits for AI features

### Database Configuration
- The app supports PostgreSQL databases
- For development, you can use local PostgreSQL or cloud providers like Neon
- Schema is managed through Drizzle ORM migrations

### File Upload Configuration
- Digital CVs support: MP4, MOV, AVI formats
- Maximum file size: 200MB
- Files are stored in the `uploads/` directory

## 📁 Project Structure

```
harmony-ai/
├── client/                 # React frontend application
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── pages/         # Page components
│   │   ├── hooks/         # Custom React hooks
│   │   ├── lib/           # Utility functions
│   │   └── styles/        # Global styles
│   └── public/            # Static assets
├── server/                # Express.js backend
│   ├── routes.ts          # API route definitions
│   ├── auth.ts           # Authentication logic
│   ├── storage.ts        # Database operations
│   ├── ai-analysis.ts    # AI-powered analysis
│   └── ai-post-suggestions.ts # AI content generation
├── shared/               # Shared types and schemas
├── migrations/           # Database migrations
└── uploads/             # File upload storage
```

## 🌐 API Documentation

### Authentication Endpoints
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/user` - Get current user

### User Management
- `GET /api/users/:id` - Get user profile
- `PUT /api/users/:id` - Update user profile
- `GET /api/users/:id/communities` - Get user communities
- `GET /api/users/:id/stats` - Get user statistics

### Posts & Content
- `GET /api/posts` - Get all posts
- `POST /api/posts` - Create new post
- `POST /api/posts/ai-suggestions` - Generate AI post suggestions
- `POST /api/posts/:id/like` - Like/unlike post
- `POST /api/posts/:id/comment` - Add comment

### Jobs & Career
- `GET /api/jobs` - Get job listings
- `POST /api/jobs` - Create job posting (recruiters)
- `POST /api/jobs/:id/apply` - Apply for job
- `POST /api/jobs/:id/save` - Save/unsave job

### Communities
- `GET /api/communities` - Get all communities
- `POST /api/communities/:id/join` - Join community
- `DELETE /api/communities/:id/leave` - Leave community

### Digital CV
- `POST /api/digital-cv/upload` - Upload video CV
- `GET /api/digital-cv/analysis` - Get AI analysis

## 🤖 AI Features Usage

### Post Suggestions
```javascript
// Generate AI-powered post suggestions
const suggestions = await fetch('/api/posts/ai-suggestions', {
  method: 'POST',
  body: JSON.stringify({ keyword: 'leadership' })
});
```

### Digital CV Analysis
```javascript
// Upload and analyze video CV
const formData = new FormData();
formData.append('video', videoFile);

const result = await fetch('/api/digital-cv/upload', {
  method: 'POST',
  body: formData
});
```

## 🎨 UI Components

The application uses a modern design system built with:
- **shadcn/ui** components for consistent design
- **Tailwind CSS** for utility-first styling
- **Radix UI** primitives for accessibility
- **Lucide React** for icons
- **Framer Motion** for animations

## 🔐 Security Features

- **Secure Authentication**: Session-based auth with PostgreSQL storage
- **Input Validation**: Zod schemas for all API inputs
- **File Upload Security**: Type and size validation for uploads
- **Privacy Controls**: User-configurable privacy settings
- **Admin Controls**: Administrative oversight and management

## 📊 Admin Dashboard

Administrators have access to:
- User management and analytics
- Job posting moderation
- Community management
- Platform analytics and insights
- Content moderation tools

## 🚀 Deployment

### Production Build
```bash
# Build the application
npm run build

# Start production server
npm start
```

### Environment Variables for Production
```env
NODE_ENV=production
DATABASE_URL=your_production_database_url
OPENAI_API_KEY=your_openai_api_key
SESSION_SECRET=your_secure_session_secret
```

## 🤝 Contributing

1. **Fork the repository**
2. **Create a feature branch**: `git checkout -b feature/amazing-feature`
3. **Commit your changes**: `git commit -m 'Add amazing feature'`
4. **Push to the branch**: `git push origin feature/amazing-feature`
5. **Open a Pull Request**

### Development Guidelines
- Follow TypeScript best practices
- Use Prettier for code formatting
- Write meaningful commit messages
- Add tests for new features
- Update documentation as needed

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **OpenAI** for providing the GPT-4 API
- **shadcn/ui** for the beautiful component library
- **Drizzle Team** for the excellent ORM
- **React Community** for the amazing ecosystem

## 📞 Support

For support, email support@harmony-ai.com or create an issue in this repository.

## 🔮 Roadmap

- [ ] Mobile app development (React Native)
- [ ] Advanced AI features (voice analysis, sentiment analysis)
- [ ] Integration with external job boards
- [ ] Video calling for interviews
- [ ] Advanced analytics dashboard
- [ ] Multi-language support

---

**Built with ❤️ for the professional community**