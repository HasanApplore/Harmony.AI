import { messages, users, posts, jobs, communities, communityMembers, connections, jobApplications, likes, comments, reposts, savedJobs, companies, passwordResetRequests, type User, type InsertUser, type Post, type InsertPost, type Job, type InsertJob, type Community, type InsertCommunity, type Connection, type InsertConnection, type Message, type InsertMessage, type JobApplication, type InsertJobApplication, type Like, type Comment, type Repost, type CommunityMember, type SavedJob, type InsertSavedJob, type Company, type InsertCompany, type PasswordResetRequest, type InsertPasswordResetRequest } from "@shared/schema";
import session from "express-session";
import createMemoryStore from "memorystore";
import connectPg from "connect-pg-simple";
import { db, pool } from "./db";
import { eq, and, or, desc, inArray } from "drizzle-orm";

// Fix type issue with SessionStore
declare module "express-session" {
  interface SessionData {
    passport?: {
      user: number;
    };
  }
}

const PostgresSessionStore = connectPg(session);
const MemoryStore = createMemoryStore(session);

export interface IStorage {
  // Company operations
  getAllCompanies(): Promise<Company[]>;
  getCompany(id: number): Promise<Company | undefined>;
  createCompany(company: InsertCompany): Promise<Company>;
  updateCompany(id: number, company: Partial<Company>): Promise<Company | undefined>;
  deleteCompany(id: number): Promise<boolean>;
  getUserCompanies(userId: number): Promise<Company[]>;
  getCompanyPosts(companyId: number): Promise<Post[]>;
  getCompanyJobs(companyId: number): Promise<Job[]>;
  
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByMobileNumber(mobileNumber: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, user: Partial<User>): Promise<User | undefined>;
  getAllUsers(): Promise<User[]>;
  deleteUser(id: number): Promise<boolean>;
  
  // Job operations
  getJob(id: number): Promise<Job | undefined>;
  updateJob(id: number, job: Partial<Job>): Promise<Job | undefined>;
  deleteJob(id: number): Promise<boolean>;
  getAllJobs(): Promise<Job[]>;
  
  // Community operations
  getCommunity(id: number): Promise<Community | undefined>;
  updateCommunity(id: number, community: Partial<Community>): Promise<Community | undefined>;
  deleteCommunity(id: number): Promise<boolean>;
  getAllCommunities(): Promise<Community[]>;
  
  // Post operations
  createPost(post: InsertPost): Promise<Post>;
  getPosts(): Promise<Post[]>;
  getAllPosts(): Promise<Post[]>;
  updatePost(id: number, updates: Partial<Post>): Promise<Post | undefined>;
  deletePost(id: number): Promise<void>;
  getPostsByUserId(userId: number): Promise<Post[]>;
  getPostsByCommunityId(communityId: number): Promise<Post[]>;
  getPostById(id: number): Promise<Post | undefined>;
  
  // Job operations
  createJob(job: InsertJob): Promise<Job>;
  getJobs(): Promise<Job[]>;
  getJobById(id: number): Promise<Job | undefined>;
  getJobsByUserId(userId: number): Promise<Job[]>;
  
  // Community operations
  createCommunity(community: InsertCommunity): Promise<Community>;
  getCommunities(): Promise<Community[]>;
  getCommunityById(id: number): Promise<Community | undefined>;
  getCommunityByName(name: string): Promise<Community | undefined>;
  
  // Community members operations
  addCommunityMember(userId: number, communityId: number): Promise<boolean>;
  removeCommunityMember(userId: number, communityId: number): Promise<boolean>;
  getCommunityMembers(communityId: number): Promise<User[]>;
  getUserCommunities(userId: number): Promise<Community[]>;
  
  // Connection operations
  createConnection(connection: InsertConnection): Promise<Connection>;
  updateConnectionStatus(id: number, status: string): Promise<Connection | undefined>;
  getUserConnections(userId: number): Promise<{connection: Connection, user: User}[]>;
  getPendingConnections(userId: number): Promise<{connection: Connection, user: User}[]>;
  getSentPendingConnections(userId: number): Promise<{connection: Connection, user: User}[]>;
  
  // Message operations
  createMessage(message: InsertMessage): Promise<Message>;
  getMessagesBetweenUsers(user1Id: number, user2Id: number): Promise<Message[]>;
  getUserMessages(userId: number): Promise<{message: Message, sender: User}[]>;
  
  // Job application operations
  createJobApplication(application: InsertJobApplication): Promise<JobApplication>;
  getJobApplicationsByJobId(jobId: number): Promise<{application: JobApplication, applicant: User}[]>;
  getJobApplicationsByUserId(userId: number): Promise<{application: JobApplication, job: Job}[]>;
  updateJobApplicationStatus(id: number, status: string): Promise<JobApplication | undefined>;
  
  // Saved jobs operations
  saveJob(userId: number, jobId: number): Promise<SavedJob>;
  unsaveJob(userId: number, jobId: number): Promise<boolean>;
  getSavedJobsByUserId(userId: number): Promise<Job[]>;
  isJobSavedByUser(userId: number, jobId: number): Promise<boolean>;
  
  // Like operations
  addLike(userId: number, postId: number): Promise<Like>;
  removeLike(userId: number, postId: number): Promise<boolean>;
  getPostLikes(postId: number): Promise<Like[]>;
  
  // Repost operations
  addRepost(userId: number, postId: number): Promise<any>;
  removeRepost(userId: number, postId: number): Promise<boolean>;
  getPostReposts(postId: number): Promise<any[]>;
  getUserRepost(userId: number, postId: number): Promise<Repost | undefined>;
  
  // Comment operations
  addComment(userId: number, postId: number, content: string): Promise<Comment>;
  getPostComments(postId: number): Promise<{comment: Comment, user: User}[]>;

  // Admin operations
  getAllUsers(): Promise<User[]>;
  deleteUser(id: number): Promise<boolean>;
  getAllPostsWithUsers(): Promise<any[]>; // Posts with user info
  deletePost(id: number): Promise<boolean>;
  getAllJobsWithUsers(): Promise<any[]>; // Jobs with user info
  deleteJob(id: number): Promise<boolean>;
  getAllCommunitiesWithCreators(): Promise<any[]>; // Communities with creator info
  deleteCommunity(id: number): Promise<boolean>;

  // Password Reset Request operations
  createPasswordResetRequest(request: InsertPasswordResetRequest): Promise<PasswordResetRequest>;
  getPasswordResetRequests(): Promise<PasswordResetRequest[]>;
  getPendingPasswordResetRequests(): Promise<PasswordResetRequest[]>;
  updatePasswordResetRequest(id: number, updates: Partial<PasswordResetRequest>): Promise<PasswordResetRequest | undefined>;
  deletePasswordResetRequest(id: number): Promise<boolean>;

  // Session store
  sessionStore: any; // Using any here to fix TypeScript issues with session store
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private posts: Map<number, Post>;
  private jobs: Map<number, Job>;
  private communities: Map<number, Community>;
  private communityMembers: Map<number, CommunityMember>;
  private connections: Map<number, Connection>;
  private messages: Map<number, Message>;
  private jobApplications: Map<number, JobApplication>;
  private likes: Map<number, Like>;
  private comments: Map<number, Comment>;
  private savedJobs: Map<number, SavedJob>;
  private companies: Map<number, Company>;
  private passwordResetRequests: Map<number, PasswordResetRequest>;
  sessionStore: any; // Using any here to fix TypeScript issues with session store
  currentId: {
    users: number;
    posts: number;
    jobs: number;
    communities: number;
    communityMembers: number;
    connections: number;
    messages: number;
    jobApplications: number;
    likes: number;
    comments: number;
    savedJobs: number;
    companies: number;
    passwordResetRequests: number;
  };

  constructor() {
    this.users = new Map();
    this.posts = new Map();
    this.jobs = new Map();
    this.communities = new Map();
    this.communityMembers = new Map();
    this.connections = new Map();
    this.messages = new Map();
    this.jobApplications = new Map();
    this.likes = new Map();
    this.comments = new Map();
    this.savedJobs = new Map();
    this.companies = new Map();
    this.passwordResetRequests = new Map();
    this.currentId = {
      users: 1,
      posts: 1,
      jobs: 1,
      communities: 1,
      communityMembers: 1,
      connections: 1,
      messages: 1,
      jobApplications: 1,
      likes: 1,
      comments: 1,
      savedJobs: 1,
      companies: 1,
      passwordResetRequests: 1
    };
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000, // 24 hours
      stale: false, // Don't check for stale sessions immediately
      ttl: 7 * 24 * 60 * 60 * 1000 // 7 days to match auth.ts
    });
    
    // Initialize sample companies
    this.initializeSampleCompanies();
  }

  private initializeSampleCompanies() {
    const sampleCompanies = [
      {
        name: "TechVision Solutions",
        industry: "Technology",
        size: "51-200 employees",
        location: "Bangalore, Karnataka",
        description: "Leading AI and machine learning solutions provider",
        website: "https://techvision.com",
        email: "contact@techvision.com",
        ownerId: 1
      },
      {
        name: "InnovateHub",
        industry: "Software Development",
        size: "201-500 employees", 
        location: "Mumbai, Maharashtra",
        description: "Product development and digital transformation company",
        website: "https://innovatehub.com",
        email: "info@innovatehub.com",
        ownerId: 2
      },
      {
        name: "DataDriven Analytics",
        industry: "Data Science",
        size: "11-50 employees",
        location: "Hyderabad, Telangana",
        description: "Specialized in business intelligence and data analytics",
        website: "https://datadriven.com",
        email: "hello@datadriven.com",
        ownerId: 3
      },
      {
        name: "CloudFirst Technologies",
        industry: "Cloud Computing",
        size: "101-200 employees",
        location: "Pune, Maharashtra",
        description: "Cloud migration and infrastructure solutions",
        website: "https://cloudfirst.com",
        email: "contact@cloudfirst.com",
        ownerId: 4
      },
      {
        name: "FinTech Innovations",
        industry: "Financial Technology",
        size: "51-100 employees",
        location: "Delhi, NCR",
        description: "Digital banking and payment solutions",
        website: "https://fintech-innovations.com",
        email: "info@fintech-innovations.com",
        ownerId: 5
      }
    ];

    sampleCompanies.forEach(companyData => {
      const id = this.currentId.companies++;
      const company = {
        id,
        ...companyData,
        logoUrl: null,
        createdAt: new Date()
      };
      this.companies.set(id, company);
    });
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.email === email,
    );
  }

  async getUserByMobileNumber(mobileNumber: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.mobileNumber === mobileNumber,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentId.users++;
    const user: User = { ...insertUser, id, skills: [], experiences: [], education: [] };
    this.users.set(id, user);
    return user;
  }

  async updateUser(id: number, userData: Partial<User>): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;

    const updatedUser = { ...user, ...userData };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  // Post operations
  async createPost(post: InsertPost): Promise<Post> {
    const id = this.currentId.posts++;
    const newPost: Post = { 
      ...post, 
      id, 
      createdAt: new Date() 
    };
    this.posts.set(id, newPost);
    return newPost;
  }

  async getPosts(): Promise<Post[]> {
    return Array.from(this.posts.values());
  }

  async getPostsByUserId(userId: number): Promise<Post[]> {
    return Array.from(this.posts.values()).filter(
      (post) => post.userId === userId
    );
  }
  
  // For API compatibility with user-routes.ts
  async getUserPosts(userId: number): Promise<Post[]> {
    return this.getPostsByUserId(userId);
  }

  async getPostsByCommunityId(communityId: number): Promise<Post[]> {
    return Array.from(this.posts.values()).filter(
      (post) => post.communityId === communityId
    );
  }

  async getPostById(id: number): Promise<Post | undefined> {
    return this.posts.get(id);
  }

  async updatePost(id: number, updates: Partial<Post>): Promise<Post | undefined> {
    const post = this.posts.get(id);
    if (!post) return undefined;
    
    const updatedPost = { ...post, ...updates };
    this.posts.set(id, updatedPost);
    return updatedPost;
  }

  // Job operations
  async createJob(job: InsertJob): Promise<Job> {
    const id = this.currentId.jobs++;
    const newJob: Job = { 
      ...job, 
      id, 
      createdAt: new Date() 
    };
    this.jobs.set(id, newJob);
    return newJob;
  }

  async getJobs(): Promise<Job[]> {
    return Array.from(this.jobs.values());
  }

  async getJobById(id: number): Promise<Job | undefined> {
    return this.jobs.get(id);
  }

  async getJobsByUserId(userId: number): Promise<Job[]> {
    return Array.from(this.jobs.values()).filter(
      (job) => job.userId === userId
    );
  }
  
  // For API compatibility with user-routes.ts
  async getUserJobs(userId: number): Promise<Job[]> {
    return this.getJobsByUserId(userId);
  }
  
  // Company operations
  async getAllCompanies(): Promise<Company[]> {
    const result = await db.select().from(companies);
    return result;
  }

  async getCompanies(): Promise<Company[]> {
    const result = await db.select().from(companies);
    return result;
  }

  async getCompany(id: number): Promise<Company | undefined> {
    const [company] = await db.select().from(companies).where(eq(companies.id, id));
    return company;
  }

  async createCompany(data: InsertCompany): Promise<Company> {
    const [company] = await db.insert(companies).values(data).returning();
    return company;
  }

  async updateCompany(id: number, data: Partial<Company>): Promise<Company | undefined> {
    const [company] = await db.update(companies)
      .set(data)
      .where(eq(companies.id, id))
      .returning();
    return company;
  }

  async deleteCompany(id: number): Promise<boolean> {
    const result = await db.delete(companies).where(eq(companies.id, id));
    return result.rowCount ? true : false;
  }

  async getUserCompanies(userId: number): Promise<Company[]> {
    const result = await db.select()
      .from(companies)
      .where(eq(companies.ownerId, userId));
    return result;
  }

  async getCompanyPosts(companyId: number): Promise<Post[]> {
    // In the future, when we add a companyId field to posts
    // For now, return empty array as a placeholder
    return [];
  }

  async getCompanyJobs(companyId: number): Promise<Job[]> {
    // In the future, when we add a companyId field to jobs
    // For now, return empty array as a placeholder
    return [];
  }

  // Community operations
  async createCommunity(community: InsertCommunity): Promise<Community> {
    const id = this.currentId.communities++;
    const { initialParticipants, ...communityData } = community;
    const newCommunity: Community = { 
      ...communityData, 
      id, 
      createdAt: new Date(),
      memberCount: 1 + (initialParticipants?.length || 0)
    };
    this.communities.set(id, newCommunity);

    // Add creator as a member
    await this.addCommunityMember(community.createdBy, id);
    
    // Add initial participants if provided
    if (initialParticipants && initialParticipants.length > 0) {
      for (const participantId of initialParticipants) {
        await this.addCommunityMember(participantId, id);
      }
    }
    
    return newCommunity;
  }

  async getCommunities(): Promise<Community[]> {
    return Array.from(this.communities.values());
  }

  async getCommunityById(id: number): Promise<Community | undefined> {
    return this.communities.get(id);
  }

  async getCommunityByName(name: string): Promise<Community | undefined> {
    return Array.from(this.communities.values()).find(
      (community) => community.name === name
    );
  }

  // Community members operations
  async addCommunityMember(userId: number, communityId: number): Promise<boolean> {
    const user = await this.getUser(userId);
    const community = await this.getCommunityById(communityId);
    
    if (!user || !community) return false;
    
    const id = this.currentId.communityMembers++;
    const member: CommunityMember = {
      id,
      userId,
      communityId,
      joinedAt: new Date()
    };
    
    this.communityMembers.set(id, member);
    
    // Increment member count
    community.memberCount += 1;
    this.communities.set(communityId, community);
    
    return true;
  }

  async removeCommunityMember(userId: number, communityId: number): Promise<boolean> {
    const members = Array.from(this.communityMembers.values());
    const memberEntry = members.find(
      (member) => member.userId === userId && member.communityId === communityId
    );
    
    if (!memberEntry) return false;
    
    this.communityMembers.delete(memberEntry.id);
    
    // Decrement member count
    const community = await this.getCommunityById(communityId);
    if (community) {
      community.memberCount = Math.max(0, community.memberCount - 1);
      this.communities.set(communityId, community);
    }
    
    return true;
  }

  async getCommunityMembers(communityId: number): Promise<User[]> {
    const members = Array.from(this.communityMembers.values())
      .filter((member) => member.communityId === communityId);
      
    const users: User[] = [];
    for (const member of members) {
      const user = await this.getUser(member.userId);
      if (user) users.push(user);
    }
    
    return users;
  }

  async getUserCommunities(userId: number): Promise<Community[]> {
    const memberships = Array.from(this.communityMembers.values())
      .filter((member) => member.userId === userId);
      
    const communities: Community[] = [];
    for (const membership of memberships) {
      const community = await this.getCommunityById(membership.communityId);
      if (community) communities.push(community);
    }
    
    return communities;
  }

  // Connection operations
  async createConnection(connection: InsertConnection): Promise<Connection> {
    const id = this.currentId.connections++;
    const newConnection: Connection = { 
      ...connection, 
      id, 
      status: "pending",
      createdAt: new Date() 
    };
    this.connections.set(id, newConnection);
    return newConnection;
  }

  async updateConnectionStatus(id: number, status: string): Promise<Connection | undefined> {
    const connection = this.connections.get(id);
    if (!connection) return undefined;

    const updatedConnection = { ...connection, status };
    this.connections.set(id, updatedConnection);
    return updatedConnection;
  }

  async getUserConnections(userId: number): Promise<{connection: Connection, user: User}[]> {
    const connections = Array.from(this.connections.values())
      .filter((conn) => 
        (conn.requesterId === userId || conn.receiverId === userId) && 
        conn.status === "accepted"
      );
    
    const result = [];
    for (const connection of connections) {
      const otherUserId = connection.requesterId === userId 
        ? connection.receiverId 
        : connection.requesterId;
      
      const user = await this.getUser(otherUserId);
      if (user) {
        result.push({ connection, user });
      }
    }
    
    return result;
  }

  async getPendingConnections(userId: number): Promise<{connection: Connection, user: User}[]> {
    const connections = Array.from(this.connections.values())
      .filter((conn) => 
        conn.receiverId === userId && 
        conn.status === "pending"
      );
    
    const result = [];
    for (const connection of connections) {
      const user = await this.getUser(connection.requesterId);
      if (user) {
        result.push({ connection, user });
      }
    }
    
    return result;
  }

  async getSentPendingConnections(userId: number): Promise<{connection: Connection, user: User}[]> {
    const sentPendingConnections = Array.from(this.connections.values())
      .filter((conn) => 
        conn.requesterId === userId && 
        conn.status === "pending"
      );
    
    const result = [];
    
    for (const connection of sentPendingConnections) {
      const user = await this.getUser(connection.receiverId);
      if (user) {
        result.push({ connection, user });
      }
    }
    
    return result;
  }

  // Message operations
  async createMessage(message: InsertMessage): Promise<Message> {
    const id = this.currentId.messages++;
    const newMessage: Message = { 
      ...message, 
      id, 
      createdAt: new Date(),
      isRead: false 
    };
    this.messages.set(id, newMessage);
    return newMessage;
  }

  async getMessagesBetweenUsers(user1Id: number, user2Id: number): Promise<Message[]> {
    return Array.from(this.messages.values())
      .filter((message) => 
        (message.senderId === user1Id && message.receiverId === user2Id) ||
        (message.senderId === user2Id && message.receiverId === user1Id)
      )
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  }

  async getUserMessages(userId: number): Promise<{message: Message, sender: User}[]> {
    const messages = Array.from(this.messages.values())
      .filter((message) => message.receiverId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    
    const result = [];
    for (const message of messages) {
      const sender = await this.getUser(message.senderId);
      if (sender) {
        result.push({ message, sender });
      }
    }
    
    return result;
  }

  // Job application operations
  async createJobApplication(application: InsertJobApplication): Promise<JobApplication> {
    const id = this.currentId.jobApplications++;
    const newApplication: JobApplication = { 
      ...application, 
      id, 
      status: "applied",
      createdAt: new Date() 
    };
    this.jobApplications.set(id, newApplication);
    return newApplication;
  }

  async getJobApplicationsByJobId(jobId: number): Promise<{application: JobApplication, applicant: User}[]> {
    const applications = Array.from(this.jobApplications.values())
      .filter((app) => app.jobId === jobId);
    
    const result = [];
    for (const application of applications) {
      const applicant = await this.getUser(application.applicantId);
      if (applicant) {
        result.push({ application, applicant });
      }
    }
    
    return result;
  }

  async getJobApplicationsByUserId(userId: number): Promise<{application: JobApplication, job: Job}[]> {
    const applications = Array.from(this.jobApplications.values())
      .filter((app) => app.applicantId === userId);
    
    const result = [];
    for (const application of applications) {
      const job = await this.getJobById(application.jobId);
      if (job) {
        result.push({ application, job });
      }
    }
    
    return result;
  }

  async updateJobApplicationStatus(id: number, status: string): Promise<JobApplication | undefined> {
    const application = this.jobApplications.get(id);
    if (!application) return undefined;

    const updatedApplication = { ...application, status };
    this.jobApplications.set(id, updatedApplication);
    return updatedApplication;
  }

  // Like operations
  async addLike(userId: number, postId: number): Promise<Like> {
    const id = this.currentId.likes++;
    const like: Like = {
      id,
      userId,
      postId,
      createdAt: new Date()
    };
    this.likes.set(id, like);
    return like;
  }

  async removeLike(userId: number, postId: number): Promise<boolean> {
    const likes = Array.from(this.likes.values());
    const likeEntry = likes.find(
      (like) => like.userId === userId && like.postId === postId
    );
    
    if (!likeEntry) return false;
    
    this.likes.delete(likeEntry.id);
    return true;
  }

  async getPostLikes(postId: number): Promise<Like[]> {
    return Array.from(this.likes.values())
      .filter((like) => like.postId === postId);
  }

  // Comment operations
  async addComment(userId: number, postId: number, content: string): Promise<Comment> {
    const id = this.currentId.comments++;
    const comment: Comment = {
      id,
      userId,
      postId,
      content,
      createdAt: new Date()
    };
    this.comments.set(id, comment);
    return comment;
  }

  async getPostComments(postId: number): Promise<{comment: Comment, user: User}[]> {
    const comments = Array.from(this.comments.values())
      .filter((comment) => comment.postId === postId)
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
    
    const result = [];
    for (const comment of comments) {
      const user = await this.getUser(comment.userId);
      if (user) {
        result.push({ comment, user });
      }
    }
    
    return result;
  }

  // Admin operations
  async getAllUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }

  async deleteUser(id: number): Promise<boolean> {
    const user = this.users.get(id);
    if (!user) return false;
    
    // Delete user
    this.users.delete(id);
    
    // Delete related data (posts, jobs, etc.)
    const userPosts = await this.getPostsByUserId(id);
    for (const post of userPosts) {
      await this.deletePost(post.id);
    }
    
    const userJobs = await this.getJobsByUserId(id);
    for (const job of userJobs) {
      await this.deleteJob(job.id);
    }
    
    // Remove from communities
    const userCommunities = await this.getUserCommunities(id);
    for (const community of userCommunities) {
      await this.removeCommunityMember(id, community.id);
    }
    
    return true;
  }

  async getAllPostsWithUsers(): Promise<any[]> {
    const posts = Array.from(this.posts.values());
    const result = [];
    
    for (const post of posts) {
      const user = await this.getUser(post.userId);
      result.push({
        ...post,
        user
      });
    }
    
    return result;
  }

  async deletePost(id: number): Promise<boolean> {
    const post = this.posts.get(id);
    if (!post) return false;
    
    // Delete post
    this.posts.delete(id);
    
    // Delete related likes and comments
    const likes = Array.from(this.likes.values())
      .filter(like => like.postId === id);
    
    for (const like of likes) {
      this.likes.delete(like.id);
    }
    
    const comments = Array.from(this.comments.values())
      .filter(comment => comment.postId === id);
    
    for (const comment of comments) {
      this.comments.delete(comment.id);
    }
    
    return true;
  }

  async getAllJobsWithUsers(): Promise<any[]> {
    const jobs = Array.from(this.jobs.values());
    const result = [];
    
    for (const job of jobs) {
      const user = await this.getUser(job.userId);
      result.push({
        ...job,
        user
      });
    }
    
    return result;
  }

  async deleteJob(id: number): Promise<boolean> {
    const job = this.jobs.get(id);
    if (!job) return false;
    
    // Delete job
    this.jobs.delete(id);
    
    // Delete related applications
    const applications = Array.from(this.jobApplications.values())
      .filter(app => app.jobId === id);
    
    for (const app of applications) {
      this.jobApplications.delete(app.id);
    }
    
    return true;
  }



  async getAllCommunitiesWithCreators(): Promise<any[]> {
    const communities = Array.from(this.communities.values());
    const result = [];
    
    for (const community of communities) {
      const createdBy = await this.getUser(community.createdBy);
      result.push({
        ...community,
        createdBy
      });
    }
    
    return result;
  }

  async deleteCommunity(id: number): Promise<boolean> {
    const community = this.communities.get(id);
    if (!community) return false;
    
    // Delete community
    this.communities.delete(id);
    
    // Delete related members
    const members = Array.from(this.communityMembers.values())
      .filter(member => member.communityId === id);
    
    for (const member of members) {
      this.communityMembers.delete(member.id);
    }
    
    // Delete related posts
    const posts = Array.from(this.posts.values())
      .filter(post => post.communityId === id);
    
    for (const post of posts) {
      await this.deletePost(post.id);
    }
    
    return true;
  }
  
  // Saved jobs operations
  async saveJob(userId: number, jobId: number): Promise<SavedJob> {
    // Check if job is already saved
    const existingSaved = Array.from(this.savedJobs.values())
      .find(saved => saved.userId === userId && saved.jobId === jobId);
    
    if (existingSaved) {
      return existingSaved;
    }
    
    const id = this.currentId.savedJobs++;
    const savedJob: SavedJob = {
      id,
      userId,
      jobId,
      createdAt: new Date()
    };
    
    this.savedJobs.set(id, savedJob);
    return savedJob;
  }
  
  async unsaveJob(userId: number, jobId: number): Promise<boolean> {
    const savedJob = Array.from(this.savedJobs.values())
      .find(saved => saved.userId === userId && saved.jobId === jobId);
    
    if (!savedJob) {
      return false;
    }
    
    return this.savedJobs.delete(savedJob.id);
  }
  
  async getSavedJobsByUserId(userId: number): Promise<Job[]> {
    const savedJobIds = Array.from(this.savedJobs.values())
      .filter(saved => saved.userId === userId)
      .map(saved => saved.jobId);
    
    const jobs = await Promise.all(savedJobIds.map(jobId => this.getJobById(jobId)));
    
    // Filter out any undefined jobs (should not happen in normal operation)
    return jobs.filter(job => job !== undefined) as Job[];
  }
  
  async isJobSavedByUser(userId: number, jobId: number): Promise<boolean> {
    return Array.from(this.savedJobs.values())
      .some(saved => saved.userId === userId && saved.jobId === jobId);
  }

  // Password Reset Request operations
  async createPasswordResetRequest(request: InsertPasswordResetRequest): Promise<PasswordResetRequest> {
    const id = this.currentId.passwordResetRequests++;
    const newRequest: PasswordResetRequest = {
      id,
      ...request,
      status: 'pending',
      createdAt: new Date(),
      processedAt: null,
      processedBy: null,
      adminNotes: null,
      temporaryPassword: null
    };
    this.passwordResetRequests.set(id, newRequest);
    return newRequest;
  }

  async getPasswordResetRequests(): Promise<PasswordResetRequest[]> {
    return Array.from(this.passwordResetRequests.values());
  }

  async getPendingPasswordResetRequests(): Promise<PasswordResetRequest[]> {
    return Array.from(this.passwordResetRequests.values())
      .filter(request => request.status === 'pending');
  }

  async updatePasswordResetRequest(id: number, updates: Partial<PasswordResetRequest>): Promise<PasswordResetRequest | undefined> {
    const request = this.passwordResetRequests.get(id);
    if (!request) return undefined;
    
    const updatedRequest = { ...request, ...updates };
    this.passwordResetRequests.set(id, updatedRequest);
    return updatedRequest;
  }

  async deletePasswordResetRequest(id: number): Promise<boolean> {
    return this.passwordResetRequests.delete(id);
  }
}

export class DatabaseStorage implements IStorage {
  sessionStore: any; // Using any here to fix TypeScript issues with session store

  constructor() {
    // Use MemoryStore for more reliable session management in development
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000, // 24 hours
      stale: false,
      ttl: 7 * 24 * 60 * 60 * 1000 // 7 days to match auth.ts
    });
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    try {
      console.log("Checking username:", username);
      const [user] = await db.select().from(users).where(eq(users.username, username));
      console.log("User found:", user);
      return user;
    } catch (error) {
      console.error("Error in getUserByUsername:", error);
      throw error;
    }
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async getUserByMobileNumber(mobileNumber: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.mobileNumber, mobileNumber));
    return user;
  }

  async createUser(user: InsertUser): Promise<User> {
    const [newUser] = await db.insert(users).values(user).returning();
    return newUser;
  }

  async updateUser(id: number, userData: Partial<User>): Promise<User | undefined> {
    const [updatedUser] = await db
      .update(users)
      .set(userData)
      .where(eq(users.id, id))
      .returning();
    return updatedUser;
  }

  // Post operations
  async createPost(post: InsertPost): Promise<Post> {
    const [newPost] = await db.insert(posts).values(post).returning();
    return newPost;
  }

  async getPosts(): Promise<Post[]> {
    return await db.select().from(posts).orderBy(desc(posts.createdAt));
  }

  async getPostsByUserId(userId: number): Promise<Post[]> {
    return await db
      .select()
      .from(posts)
      .where(eq(posts.userId, userId))
      .orderBy(desc(posts.createdAt));
  }

  async getPostsByCommunityId(communityId: number): Promise<Post[]> {
    return await db
      .select()
      .from(posts)
      .where(eq(posts.communityId, communityId))
      .orderBy(desc(posts.createdAt));
  }

  async getPostById(id: number): Promise<Post | undefined> {
    const [post] = await db.select().from(posts).where(eq(posts.id, id));
    return post;
  }

  async updatePost(id: number, updates: Partial<Post>): Promise<Post | undefined> {
    const [updatedPost] = await db
      .update(posts)
      .set(updates)
      .where(eq(posts.id, id))
      .returning();
    return updatedPost;
  }

  async deletePost(id: number): Promise<void> {
    await db.delete(posts).where(eq(posts.id, id));
  }

  async getAllPosts(): Promise<Post[]> {
    return await db.select().from(posts).orderBy(desc(posts.createdAt));
  }

  // Job operations
  async createJob(job: InsertJob): Promise<Job> {
    const [newJob] = await db.insert(jobs).values(job).returning();
    return newJob;
  }

  async getJobs(): Promise<Job[]> {
    return await db.select().from(jobs).orderBy(desc(jobs.createdAt));
  }

  async getJobById(id: number): Promise<Job | undefined> {
    const [job] = await db.select().from(jobs).where(eq(jobs.id, id));
    return job;
  }

  async getJobsByUserId(userId: number): Promise<Job[]> {
    return await db
      .select()
      .from(jobs)
      .where(eq(jobs.userId, userId))
      .orderBy(desc(jobs.createdAt));
  }

  // Community operations
  async createCommunity(community: InsertCommunity): Promise<Community> {
    const [newCommunity] = await db.insert(communities).values({
      ...community,
      memberCount: 1
    }).returning();
    
    // Add creator as a member
    await this.addCommunityMember(community.createdBy, newCommunity.id);
    
    return newCommunity;
  }

  async getCommunities(): Promise<Community[]> {
    return await db.select().from(communities);
  }

  async getCommunityById(id: number): Promise<Community | undefined> {
    const [community] = await db.select().from(communities).where(eq(communities.id, id));
    return community;
  }

  async getCommunityByName(name: string): Promise<Community | undefined> {
    const [community] = await db.select().from(communities).where(eq(communities.name, name));
    return community;
  }

  // Community members operations
  async addCommunityMember(userId: number, communityId: number): Promise<boolean> {
    // Check if already a member
    const existingMembers = await db
      .select()
      .from(communityMembers)
      .where(
        and(
          eq(communityMembers.userId, userId),
          eq(communityMembers.communityId, communityId)
        )
      );
    
    if (existingMembers.length > 0) {
      return false;
    }
    
    // Add member
    await db.insert(communityMembers).values({
      userId,
      communityId,
      joinedAt: new Date()
    });
    
    // Update member count
    await db
      .update(communities)
      .set({ 
        memberCount: (communities as any).memberCount + 1 
      })
      .where(eq(communities.id, communityId));
    
    return true;
  }

  async removeCommunityMember(userId: number, communityId: number): Promise<boolean> {
    const result = await db
      .delete(communityMembers)
      .where(
        and(
          eq(communityMembers.userId, userId),
          eq(communityMembers.communityId, communityId)
        )
      );
    
    if (result.rowCount > 0) {
      // Update member count
      await db
        .update(communities)
        .set({ 
          memberCount: (communities as any).memberCount - 1 
        })
        .where(eq(communities.id, communityId));
      
      return true;
    }
    
    return false;
  }

  async getCommunityMembers(communityId: number): Promise<User[]> {
    const members = await db
      .select()
      .from(communityMembers)
      .where(eq(communityMembers.communityId, communityId));
    
    if (members.length === 0) {
      return [];
    }
    
    const userResults = [];
    for (const member of members) {
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.id, member.userId));
      
      if (user) {
        userResults.push(user);
      }
    }
    
    return userResults;
  }

  async getUserCommunities(userId: number): Promise<Community[]> {
    const memberships = await db
      .select()
      .from(communityMembers)
      .where(eq(communityMembers.userId, userId));
    
    if (memberships.length === 0) {
      return [];
    }
    
    const communityResults = [];
    for (const membership of memberships) {
      const [community] = await db
        .select()
        .from(communities)
        .where(eq(communities.id, membership.communityId));
      
      if (community) {
        communityResults.push(community);
      }
    }
    
    return communityResults;
  }

  // Connection operations
  async createConnection(connection: InsertConnection): Promise<Connection> {
    const [newConnection] = await db
      .insert(connections)
      .values({
        ...connection,
        status: "pending"
      })
      .returning();
    
    return newConnection;
  }

  async updateConnectionStatus(id: number, status: string): Promise<Connection | undefined> {
    const [updatedConnection] = await db
      .update(connections)
      .set({ status })
      .where(eq(connections.id, id))
      .returning();
    
    return updatedConnection;
  }

  async getUserConnections(userId: number): Promise<{connection: Connection, user: User}[]> {
    const userConnections = await db
      .select()
      .from(connections)
      .where(
        and(
          or(
            eq(connections.requesterId, userId),
            eq(connections.receiverId, userId)
          ),
          eq(connections.status, "accepted")
        )
      );
    
    const result = [];
    
    for (const connection of userConnections) {
      const otherUserId = connection.requesterId === userId 
        ? connection.receiverId 
        : connection.requesterId;
      
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.id, otherUserId));
      
      if (user) {
        result.push({ connection, user });
      }
    }
    
    return result;
  }

  async getPendingConnections(userId: number): Promise<{connection: Connection, user: User}[]> {
    const pendingConnections = await db
      .select()
      .from(connections)
      .where(
        and(
          eq(connections.receiverId, userId),
          eq(connections.status, "pending")
        )
      );
    
    const result = [];
    
    for (const connection of pendingConnections) {
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.id, connection.requesterId));
      
      if (user) {
        result.push({ connection, user });
      }
    }
    
    return result;
  }

  async getSentPendingConnections(userId: number): Promise<{connection: Connection, user: User}[]> {
    const sentPendingConnections = await db
      .select()
      .from(connections)
      .where(
        and(
          eq(connections.requesterId, userId),
          eq(connections.status, "pending")
        )
      );
    
    const result = [];
    
    for (const connection of sentPendingConnections) {
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.id, connection.receiverId));
      
      if (user) {
        result.push({ connection, user });
      }
    }
    
    return result;
  }

  // Message operations
  async createMessage(message: InsertMessage): Promise<Message> {
    const [newMessage] = await db
      .insert(messages)
      .values(message)
      .returning();
    
    return newMessage;
  }

  async getMessagesBetweenUsers(user1Id: number, user2Id: number): Promise<Message[]> {
    return await db
      .select()
      .from(messages)
      .where(
        or(
          and(
            eq(messages.senderId, user1Id),
            eq(messages.receiverId, user2Id)
          ),
          and(
            eq(messages.senderId, user2Id),
            eq(messages.receiverId, user1Id)
          )
        )
      )
      .orderBy(messages.createdAt);
  }

  async getUserMessages(userId: number): Promise<{message: Message, sender: User}[]> {
    const userMessages = await db
      .select()
      .from(messages)
      .where(eq(messages.receiverId, userId))
      .orderBy(desc(messages.createdAt));
    
    const result = [];
    
    for (const message of userMessages) {
      const [sender] = await db
        .select()
        .from(users)
        .where(eq(users.id, message.senderId));
      
      if (sender) {
        result.push({ message, sender });
      }
    }
    
    return result;
  }

  // Job application operations
  async createJobApplication(application: InsertJobApplication): Promise<JobApplication> {
    const [newApplication] = await db
      .insert(jobApplications)
      .values({
        ...application,
        status: "pending"
      })
      .returning();
    
    return newApplication;
  }

  async getJobApplicationsByJobId(jobId: number): Promise<{application: JobApplication, applicant: User}[]> {
    const applications = await db
      .select()
      .from(jobApplications)
      .where(eq(jobApplications.jobId, jobId));
    
    const result = [];
    
    for (const application of applications) {
      const [applicant] = await db
        .select()
        .from(users)
        .where(eq(users.id, application.applicantId));
      
      if (applicant) {
        result.push({ application, applicant });
      }
    }
    
    return result;
  }

  async getJobApplicationsByUserId(userId: number): Promise<{application: JobApplication, job: Job}[]> {
    const applications = await db
      .select()
      .from(jobApplications)
      .where(eq(jobApplications.applicantId, userId));
    
    const result = [];
    
    for (const application of applications) {
      const [job] = await db
        .select()
        .from(jobs)
        .where(eq(jobs.id, application.jobId));
      
      if (job) {
        result.push({ application, job });
      }
    }
    
    return result;
  }

  async updateJobApplicationStatus(id: number, status: string): Promise<JobApplication | undefined> {
    const [updatedApplication] = await db
      .update(jobApplications)
      .set({ status })
      .where(eq(jobApplications.id, id))
      .returning();
    
    return updatedApplication;
  }

  // Like operations
  async addLike(userId: number, postId: number, type?: string): Promise<Like> {
    // Check if already liked
    const existingLikes = await db
      .select()
      .from(likes)
      .where(
        and(
          eq(likes.userId, userId),
          eq(likes.postId, postId)
        )
      );
    
    if (existingLikes.length > 0) {
      return existingLikes[0];
    }
    
    const [newLike] = await db
      .insert(likes)
      .values({
        userId,
        postId
      })
      .returning();
    
    return newLike;
  }

  async removeLike(userId: number, postId: number): Promise<boolean> {
    const result = await db
      .delete(likes)
      .where(
        and(
          eq(likes.userId, userId),
          eq(likes.postId, postId)
        )
      );
    
    return result.rowCount > 0;
  }

  async getPostLikes(postId: number): Promise<Like[]> {
    return await db
      .select()
      .from(likes)
      .where(eq(likes.postId, postId));
  }

  // Repost operations
  async addRepost(userId: number, postId: number): Promise<Repost> {
    // Check if already reposted
    const existingReposts = await db
      .select()
      .from(reposts)
      .where(
        and(
          eq(reposts.userId, userId),
          eq(reposts.postId, postId)
        )
      );
    
    if (existingReposts.length > 0) {
      return existingReposts[0];
    }

    const [newRepost] = await db
      .insert(reposts)
      .values({
        userId,
        postId
      })
      .returning();
    
    return newRepost;
  }

  async removeRepost(userId: number, postId: number): Promise<boolean> {
    const result = await db
      .delete(reposts)
      .where(
        and(
          eq(reposts.userId, userId),
          eq(reposts.postId, postId)
        )
      );
    
    return result.rowCount !== null && result.rowCount > 0;
  }

  async getPostReposts(postId: number): Promise<Repost[]> {
    return await db
      .select()
      .from(reposts)
      .where(eq(reposts.postId, postId));
  }

  async getUserRepost(userId: number, postId: number): Promise<Repost | undefined> {
    const [repost] = await db
      .select()
      .from(reposts)
      .where(
        and(
          eq(reposts.userId, userId),
          eq(reposts.postId, postId)
        )
      );
    
    return repost;
  }

  // Comment operations
  async addComment(userId: number, postId: number, content: string): Promise<Comment> {
    const [newComment] = await db
      .insert(comments)
      .values({
        userId,
        postId,
        content
      })
      .returning();
    
    return newComment;
  }

  async getPostComments(postId: number): Promise<{comment: Comment, user: User}[]> {
    const postComments = await db
      .select()
      .from(comments)
      .where(eq(comments.postId, postId))
      .orderBy(comments.createdAt);
    
    const result = [];
    
    for (const comment of postComments) {
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.id, comment.userId));
      
      if (user) {
        result.push({ comment, user });
      }
    }
    
    return result;
  }

  // Admin operations
  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users);
  }

  async deleteUser(id: number): Promise<boolean> {
    try {
      // Get user
      const [user] = await db.select().from(users).where(eq(users.id, id));
      if (!user) return false;
      
      // Delete related data first to avoid foreign key constraints
      // Delete user's posts
      const userPosts = await db.select().from(posts).where(eq(posts.userId, id));
      for (const post of userPosts) {
        await this.deletePost(post.id);
      }
  
      // Delete user's jobs
      const userJobs = await db.select().from(jobs).where(eq(jobs.userId, id));
      for (const job of userJobs) {
        await this.deleteJob(job.id);
      }
      
      // Delete user's connections
      await db.delete(connections).where(
        or(
          eq(connections.requesterId, id),
          eq(connections.receiverId, id)
        )
      );
      
      // Delete user's community memberships
      await db.delete(communityMembers).where(eq(communityMembers.userId, id));
      
      // Delete user's job applications
      await db.delete(jobApplications).where(eq(jobApplications.applicantId, id));
      
      // Delete user's likes
      await db.delete(likes).where(eq(likes.userId, id));
      
      // Delete user's comments
      await db.delete(comments).where(eq(comments.userId, id));
      
      // Delete user's saved jobs
      await db.delete(savedJobs).where(eq(savedJobs.userId, id));
      
      // Finally, delete the user
      await db.delete(users).where(eq(users.id, id));
      
      return true;
    } catch (error) {
      console.error("Error deleting user:", error);
      return false;
    }
  }
  
  async getJob(id: number): Promise<Job | undefined> {
    const [job] = await db.select().from(jobs).where(eq(jobs.id, id));
    return job;
  }
  
  async updateJob(id: number, jobUpdate: Partial<Job>): Promise<Job | undefined> {
    try {
      const [job] = await db.select().from(jobs).where(eq(jobs.id, id));
      if (!job) return undefined;
      
      const [updatedJob] = await db
        .update(jobs)
        .set(jobUpdate)
        .where(eq(jobs.id, id))
        .returning();
      
      return updatedJob;
    } catch (error) {
      console.error("Error updating job:", error);
      return undefined;
    }
  }
  
  async deleteJob(id: number): Promise<boolean> {
    try {
      // Delete related data first
      // Delete job applications
      await db.delete(jobApplications).where(eq(jobApplications.jobId, id));
      
      // Delete saved jobs
      await db.delete(savedJobs).where(eq(savedJobs.jobId, id));
      
      // Finally delete the job
      const result = await db.delete(jobs).where(eq(jobs.id, id));
      return result.rowCount ? result.rowCount > 0 : false;
    } catch (error) {
      console.error("Error deleting job:", error);
      return false;
    }
  }
  
  async getAllJobs(): Promise<Job[]> {
    return await db.select().from(jobs);
  }
  
  async getCommunity(id: number): Promise<Community | undefined> {
    const [community] = await db.select().from(communities).where(eq(communities.id, id));
    return community;
  }
  
  async updateCommunity(id: number, communityUpdate: Partial<Community>): Promise<Community | undefined> {
    try {
      const [community] = await db.select().from(communities).where(eq(communities.id, id));
      if (!community) return undefined;
      
      const [updatedCommunity] = await db
        .update(communities)
        .set(communityUpdate)
        .where(eq(communities.id, id))
        .returning();
      
      return updatedCommunity;
    } catch (error) {
      console.error("Error updating community:", error);
      return undefined;
    }
  }
  
  async deleteCommunity(id: number): Promise<boolean> {
    try {
      // Delete related data first
      // Delete community members
      await db.delete(communityMembers).where(eq(communityMembers.communityId, id));
      
      // Update posts to remove community association
      await db
        .update(posts)
        .set({ communityId: null })
        .where(eq(posts.communityId, id));
      
      // Finally delete the community
      const result = await db.delete(communities).where(eq(communities.id, id));
      return result.rowCount ? result.rowCount > 0 : false;
    } catch (error) {
      console.error("Error deleting community:", error);
      return false;
    }
  }
  
  async getAllCommunities(): Promise<Community[]> {
    return await db.select().from(communities);
  }
  
  async getAllPosts(): Promise<Post[]> {
    return await db.select().from(posts).orderBy(desc(posts.createdAt));
  }
  
  async deletePost(id: number): Promise<boolean> {
    try {
      // Delete likes for this post
      await db.delete(likes).where(eq(likes.postId, id));
      
      // Delete comments for this post
      await db.delete(comments).where(eq(comments.postId, id));
      
      // Delete the post
      const result = await db.delete(posts).where(eq(posts.id, id));
      return result.rowCount ? result.rowCount > 0 : false;
    } catch (error) {
      console.error("Error deleting post:", error);
      return false;
    }
  }
  
  async deleteUser(id: number): Promise<boolean> {
    try {
      // Logic for deleting user
      await db.delete(users).where(eq(users.id, id));
      return true;
    } catch (error) {
      console.error('Error deleting user:', error);
      return false;
    }
  }

  async getAllPostsWithUsers(): Promise<any[]> {
    const postsResult = await db
      .select()
      .from(posts)
      .orderBy(desc(posts.createdAt));
    
    const result = [];
    for (const post of postsResult) {
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.id, post.userId));
      
      result.push({
        ...post,
        user
      });
    }
    
    return result;
  }

  async deletePost(id: number): Promise<boolean> {
    try {
      // Get post
      const [post] = await db.select().from(posts).where(eq(posts.id, id));
      if (!post) return false;
      
      // Delete related data
      // Delete likes
      await db.delete(likes).where(eq(likes.postId, id));
      
      // Delete comments
      await db.delete(comments).where(eq(comments.postId, id));
      
      // Finally, delete the post
      await db.delete(posts).where(eq(posts.id, id));
      
      return true;
    } catch (error) {
      console.error('Error deleting post:', error);
      return false;
    }
  }

  async getAllJobsWithUsers(): Promise<any[]> {
    const jobsResult = await db
      .select()
      .from(jobs)
      .orderBy(desc(jobs.createdAt));
    
    const result = [];
    for (const job of jobsResult) {
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.id, job.userId));
      
      result.push({
        ...job,
        user
      });
    }
    
    return result;
  }

  async deleteJob(id: number): Promise<boolean> {
    try {
      // Get job
      const [job] = await db.select().from(jobs).where(eq(jobs.id, id));
      if (!job) return false;
      
      // Delete related applications
      await db.delete(jobApplications).where(eq(jobApplications.jobId, id));
      
      // Finally, delete the job
      await db.delete(jobs).where(eq(jobs.id, id));
      
      return true;
    } catch (error) {
      console.error('Error deleting job:', error);
      return false;
    }
  }

  async getAllCommunitiesWithCreators(): Promise<any[]> {
    const communitiesResult = await db
      .select()
      .from(communities);
    
    const result = [];
    for (const community of communitiesResult) {
      const [creator] = await db
        .select()
        .from(users)
        .where(eq(users.id, community.createdBy));
      
      result.push({
        ...community,
        createdBy: creator
      });
    }
    
    return result;
  }

  async deleteCommunity(id: number): Promise<boolean> {
    try {
      // Get community
      const [community] = await db.select().from(communities).where(eq(communities.id, id));
      if (!community) return false;
      
      // Delete community members
      await db.delete(communityMembers).where(eq(communityMembers.communityId, id));
      
      // Update posts with this community ID
      await db
        .update(posts)
        .set({ communityId: null })
        .where(eq(posts.communityId, id));
      
      // Finally, delete the community
      await db.delete(communities).where(eq(communities.id, id));
      
      return true;
    } catch (error) {
      console.error('Error deleting community:', error);
      return false;
    }
  }
  
  // Saved jobs operations
  async saveJob(userId: number, jobId: number): Promise<SavedJob> {
    try {
      // Check if job is already saved
      const existingSavedJobs = await db
        .select()
        .from(savedJobs)
        .where(and(
          eq(savedJobs.userId, userId),
          eq(savedJobs.jobId, jobId)
        ));
      
      if (existingSavedJobs.length > 0) {
        return existingSavedJobs[0];
      }
      
      // Save new job
      const [savedJob] = await db
        .insert(savedJobs)
        .values({
          userId,
          jobId,
          createdAt: new Date()
        })
        .returning();
      
      return savedJob;
    } catch (error) {
      console.error("Error saving job:", error);
      throw error;
    }
  }
  
  async unsaveJob(userId: number, jobId: number): Promise<boolean> {
    try {
      const result = await db
        .delete(savedJobs)
        .where(and(
          eq(savedJobs.userId, userId),
          eq(savedJobs.jobId, jobId)
        ));
      
      return result.rowCount !== null && result.rowCount > 0;
    } catch (error) {
      console.error("Error unsaving job:", error);
      return false;
    }
  }
  
  async getSavedJobsByUserId(userId: number): Promise<Job[]> {
    try {
      const savedJobsList = await db
        .select()
        .from(savedJobs)
        .where(eq(savedJobs.userId, userId));
      
      if (savedJobsList.length === 0) {
        return [];
      }
      
      const jobIds = savedJobsList.map(saved => saved.jobId);
      
      // For each job ID, get the job details
      const jobsList = [];
      for (const jobId of jobIds) {
        const [job] = await db
          .select()
          .from(jobs)
          .where(eq(jobs.id, jobId));
        
        if (job) {
          jobsList.push(job);
        }
      }
      
      return jobsList;
    } catch (error) {
      console.error("Error getting saved jobs:", error);
      return [];
    }
  }
  
  async isJobSavedByUser(userId: number, jobId: number): Promise<boolean> {
    try {
      const savedJobsList = await db
        .select()
        .from(savedJobs)
        .where(and(
          eq(savedJobs.userId, userId),
          eq(savedJobs.jobId, jobId)
        ));
      
      return savedJobsList.length > 0;
    } catch (error) {
      console.error("Error checking if job is saved:", error);
      return false;
    }
  }

  // Password Reset Request operations
  async createPasswordResetRequest(request: InsertPasswordResetRequest): Promise<PasswordResetRequest> {
    try {
      const [newRequest] = await db
        .insert(passwordResetRequests)
        .values({
          ...request,
          status: 'pending',
          createdAt: new Date()
        })
        .returning();
      
      return newRequest;
    } catch (error) {
      console.error("Error creating password reset request:", error);
      throw error;
    }
  }

  async getPasswordResetRequests(): Promise<PasswordResetRequest[]> {
    try {
      return await db
        .select()
        .from(passwordResetRequests)
        .orderBy(desc(passwordResetRequests.createdAt));
    } catch (error) {
      console.error("Error getting password reset requests:", error);
      return [];
    }
  }

  async getPendingPasswordResetRequests(): Promise<PasswordResetRequest[]> {
    try {
      return await db
        .select()
        .from(passwordResetRequests)
        .where(eq(passwordResetRequests.status, 'pending'))
        .orderBy(desc(passwordResetRequests.createdAt));
    } catch (error) {
      console.error("Error getting pending password reset requests:", error);
      return [];
    }
  }

  async updatePasswordResetRequest(id: number, updates: Partial<PasswordResetRequest>): Promise<PasswordResetRequest | undefined> {
    try {
      const [updatedRequest] = await db
        .update(passwordResetRequests)
        .set(updates)
        .where(eq(passwordResetRequests.id, id))
        .returning();
      
      return updatedRequest;
    } catch (error) {
      console.error("Error updating password reset request:", error);
      return undefined;
    }
  }

  async deletePasswordResetRequest(id: number): Promise<boolean> {
    try {
      const result = await db
        .delete(passwordResetRequests)
        .where(eq(passwordResetRequests.id, id));
      
      return result.rowCount !== null && result.rowCount > 0;
    } catch (error) {
      console.error("Error deleting password reset request:", error);
      return false;
    }
  }
}

export const storage = new DatabaseStorage();
