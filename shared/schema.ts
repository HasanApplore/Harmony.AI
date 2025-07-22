import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User model
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  title: text("title"),
  bio: text("bio"),
  mobileNumber: text("mobile_number"),
  profileImageUrl: text("profile_image_url"),
  digitalCvUrl: text("digital_cv_url"),
  isRecruiter: boolean("is_recruiter").default(false).notNull(),
  company: text("company"),
  industry: text("industry"),
  twoFactorEnabled: boolean("two_factor_enabled").default(false).notNull(),
  privacySettings: jsonb("privacy_settings").default({ 
    profileVisibility: 'all',
    digitalCvVisibility: 'all' 
  }),
  skills: text("skills").array(),
  experiences: jsonb("experiences").array(),
  education: jsonb("education").array(),
});

// Post model - temporary fix for circular reference
export const posts: any = pgTable("posts", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  content: text("content").notNull(),
  imageUrl: text("image_url"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  isAnonymous: boolean("is_anonymous").default(false).notNull(),
  communityId: integer("community_id"),
  originalPostId: integer("original_post_id"),
  repostedBy: integer("reposted_by"),
});

// Like model
export const likes = pgTable("likes", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  postId: integer("post_id").notNull().references(() => posts.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Comment model
export const comments = pgTable("comments", {
  id: serial("id").primaryKey(),
  content: text("content").notNull(),
  userId: integer("user_id").notNull().references(() => users.id),
  postId: integer("post_id").notNull().references(() => posts.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Repost model
export const reposts = pgTable("reposts", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  postId: integer("post_id").notNull().references(() => posts.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Job model
export const jobs = pgTable("jobs", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  company: text("company").notNull(),
  location: text("location").notNull(),
  description: text("description").notNull(),
  skills: text("skills").array(),
  userId: integer("user_id").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  salary: text("salary"),
  jobType: text("job_type"),
  experienceLevel: text("experience_level"),
});

// Community model
export const communities = pgTable("communities", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  createdBy: integer("created_by").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  memberCount: integer("member_count").default(0).notNull(),
  isPrivate: boolean("is_private").default(false).notNull(),
  inviteOnly: boolean("invite_only").default(false).notNull(),
});

// Community Member model
export const communityMembers = pgTable("community_members", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  communityId: integer("community_id").notNull().references(() => communities.id),
  joinedAt: timestamp("joined_at").defaultNow().notNull(),
  role: text("role").default("member").notNull(), // member, moderator, admin
  isInvited: boolean("is_invited").default(false).notNull(),
});

// Connection model
export const connections = pgTable("connections", {
  id: serial("id").primaryKey(),
  requesterId: integer("requester_id").notNull().references(() => users.id),
  receiverId: integer("receiver_id").notNull().references(() => users.id),
  status: text("status").notNull().default("pending"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Message model
export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  senderId: integer("sender_id").notNull().references(() => users.id),
  receiverId: integer("receiver_id").notNull().references(() => users.id),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  isRead: boolean("is_read").default(false).notNull(),
});

// Job Application model
export const jobApplications = pgTable("job_applications", {
  id: serial("id").primaryKey(),
  jobId: integer("job_id").notNull().references(() => jobs.id),
  applicantId: integer("applicant_id").notNull().references(() => users.id),
  status: text("status").notNull().default("applied"),
  note: text("note"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Saved Jobs model
export const savedJobs = pgTable("saved_jobs", {
  id: serial("id").primaryKey(),
  jobId: integer("job_id").notNull().references(() => jobs.id),
  userId: integer("user_id").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Company model
export const companies = pgTable("companies", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  ownerId: integer("owner_id").notNull().references(() => users.id),
  description: text("description"),
  industry: text("industry"),
  location: text("location"),
  size: text("size"),
  website: text("website"),
  email: text("email"),
  logoUrl: text("logo_url"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// password Reset Request model
export const passwordResetRequests = pgTable("password_reset_requests",{
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  email: text("email").notNull(),
  status: text("status").notNull().default("pending"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  processedAt: timestamp("processed_at"),
  processedBy: integer("processed_by").references(() => users.id),
  adminNotes: text("admin_notes"),
  temporaryPassword: text("temporary_password"),
})

// Create insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  digitalCvUrl: true,
  experiences: true,
  education: true,
  skills: true,
  privacySettings: true,
});
export const insertPostSchema = createInsertSchema(posts).omit({
  id: true,
  createdAt: true,
});

export const insertJobSchema = createInsertSchema(jobs).omit({
  id: true,
  createdAt: true,
});

export const insertCommunitySchema = createInsertSchema(communities).omit({
  id: true,
  createdAt: true,
  memberCount: true,
}).extend({
  initialParticipants: z.array(z.number()).optional(),
});

export const insertConnectionSchema = createInsertSchema(connections).omit({
  id: true,
  createdAt: true,
  status: true,
});

export const insertMessageSchema = createInsertSchema(messages).omit({
  id: true,
  createdAt: true,
  isRead: true,
});

export const insertJobApplicationSchema = createInsertSchema(jobApplications).omit({
  id: true,
  createdAt: true,
  status: true,
});

export const insertSavedJobSchema = createInsertSchema(savedJobs).omit({
  id: true,
  createdAt: true,
});

export const insertCompanySchema = createInsertSchema(companies).omit({
  id: true,
  createdAt: true,
});

//insert password reset request schema
export const insertPasswordResetRequestSchema = createInsertSchema(passwordResetRequests).omit({
  id: true,
  createdAt: true,
  processedAt: true,
  processedBy: true,
  adminNotes: true,
  temporaryPassword: true,
})

export const insertRepostSchema = createInsertSchema(reposts).omit({
  id: true,
  createdAt: true,
});

// Define types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Post = typeof posts.$inferSelect;
export type InsertPost = z.infer<typeof insertPostSchema>;

export type Repost = typeof reposts.$inferSelect;
export type InsertRepost = z.infer<typeof insertRepostSchema>;

export type Job = typeof jobs.$inferSelect;
export type InsertJob = z.infer<typeof insertJobSchema>;

// For Community type, modify it to accept string for createdAt
export type Community = Omit<typeof communities.$inferSelect, 'createdAt'> & {
  createdAt: string | Date;
};
export type InsertCommunity = z.infer<typeof insertCommunitySchema>;

export type Connection = typeof connections.$inferSelect;
export type InsertConnection = z.infer<typeof insertConnectionSchema>;

export type Message = typeof messages.$inferSelect;
export type InsertMessage = z.infer<typeof insertMessageSchema>;

export type JobApplication = typeof jobApplications.$inferSelect;
export type InsertJobApplication = z.infer<typeof insertJobApplicationSchema>;

export type Like = typeof likes.$inferSelect;
export type Comment = typeof comments.$inferSelect;
export type CommunityMember = typeof communityMembers.$inferSelect;
export type SavedJob = typeof savedJobs.$inferSelect;
export type InsertSavedJob = z.infer<typeof insertSavedJobSchema>;

export type Company = typeof companies.$inferSelect;
export type InsertCompany = z.infer<typeof insertCompanySchema>;

export type PasswordResetRequest = typeof passwordResetRequests.$inferSelect;
export type InsertPasswordResetRequest = z.infer<typeof insertPasswordResetRequestSchema>;
