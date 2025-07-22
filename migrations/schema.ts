import { pgTable, foreignKey, serial, text, integer, timestamp, boolean, unique, jsonb, index, varchar, json } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"



export const communities = pgTable("communities", {
	id: serial().primaryKey().notNull(),
	name: text().notNull(),
	description: text().notNull(),
	createdBy: integer("created_by").notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	memberCount: integer("member_count").default(0).notNull(),
	isPrivate: boolean("is_private").default(false).notNull(),
	inviteOnly: boolean("invite_only").default(false).notNull(),
}, (table) => [
	foreignKey({
			columns: [table.createdBy],
			foreignColumns: [users.id],
			name: "communities_created_by_users_id_fk"
		}),
]);

export const comments = pgTable("comments", {
	id: serial().primaryKey().notNull(),
	content: text().notNull(),
	userId: integer("user_id").notNull(),
	postId: integer("post_id").notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "comments_user_id_users_id_fk"
		}),
	foreignKey({
			columns: [table.postId],
			foreignColumns: [posts.id],
			name: "comments_post_id_posts_id_fk"
		}),
]);

export const connections = pgTable("connections", {
	id: serial().primaryKey().notNull(),
	requesterId: integer("requester_id").notNull(),
	receiverId: integer("receiver_id").notNull(),
	status: text().default('pending').notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.requesterId],
			foreignColumns: [users.id],
			name: "connections_requester_id_users_id_fk"
		}),
	foreignKey({
			columns: [table.receiverId],
			foreignColumns: [users.id],
			name: "connections_receiver_id_users_id_fk"
		}),
]);

export const messages = pgTable("messages", {
	id: serial().primaryKey().notNull(),
	senderId: integer("sender_id").notNull(),
	receiverId: integer("receiver_id").notNull(),
	content: text().notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	isRead: boolean("is_read").default(false).notNull(),
}, (table) => [
	foreignKey({
			columns: [table.senderId],
			foreignColumns: [users.id],
			name: "messages_sender_id_users_id_fk"
		}),
	foreignKey({
			columns: [table.receiverId],
			foreignColumns: [users.id],
			name: "messages_receiver_id_users_id_fk"
		}),
]);

export const users = pgTable("users", {
	id: serial().primaryKey().notNull(),
	username: text().notNull(),
	password: text().notNull(),
	email: text().notNull(),
	name: text().notNull(),
	title: text(),
	bio: text(),
	mobileNumber: text("mobile_number"),
	profileImageUrl: text("profile_image_url"),
	digitalCvUrl: text("digital_cv_url"),
	isRecruiter: boolean("is_recruiter").default(false).notNull(),
	company: text(),
	industry: text(),
	twoFactorEnabled: boolean("two_factor_enabled").default(false).notNull(),
	privacySettings: jsonb("privacy_settings").default({"profileVisibility":"all","digitalCvVisibility":"all"}),
	skills: text().array(),
	experiences: jsonb().array(),
	education: jsonb().array(),
}, (table) => [
	unique("users_username_unique").on(table.username),
	unique("users_email_unique").on(table.email),
]);

export const posts = pgTable("posts", {
	id: serial().primaryKey().notNull(),
	userId: integer("user_id").notNull(),
	content: text().notNull(),
	imageUrl: text("image_url"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	isAnonymous: boolean("is_anonymous").default(false).notNull(),
	communityId: integer("community_id"),
	originalPostId: integer("original_post_id"),
	repostedBy: integer("reposted_by"),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "posts_user_id_users_id_fk"
		}),
	foreignKey({
			columns: [table.communityId],
			foreignColumns: [communities.id],
			name: "posts_community_id_communities_id_fk"
		}),
	foreignKey({
			columns: [table.originalPostId],
			foreignColumns: [table.id],
			name: "posts_original_post_id_fkey"
		}),
	foreignKey({
			columns: [table.repostedBy],
			foreignColumns: [users.id],
			name: "posts_reposted_by_fkey"
		}),
]);

export const jobs = pgTable("jobs", {
	id: serial().primaryKey().notNull(),
	title: text().notNull(),
	company: text().notNull(),
	location: text().notNull(),
	description: text().notNull(),
	skills: text().array(),
	userId: integer("user_id").notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	salary: text(),
	jobType: text("job_type"),
	experienceLevel: text("experience_level"),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "jobs_user_id_users_id_fk"
		}),
]);

export const jobApplications = pgTable("job_applications", {
	id: serial().primaryKey().notNull(),
	jobId: integer("job_id").notNull(),
	applicantId: integer("applicant_id").notNull(),
	status: text().default('applied').notNull(),
	note: text(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.jobId],
			foreignColumns: [jobs.id],
			name: "job_applications_job_id_jobs_id_fk"
		}),
	foreignKey({
			columns: [table.applicantId],
			foreignColumns: [users.id],
			name: "job_applications_applicant_id_users_id_fk"
		}),
]);

export const likes = pgTable("likes", {
	id: serial().primaryKey().notNull(),
	userId: integer("user_id").notNull(),
	postId: integer("post_id").notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "likes_user_id_users_id_fk"
		}),
	foreignKey({
			columns: [table.postId],
			foreignColumns: [posts.id],
			name: "likes_post_id_posts_id_fk"
		}),
]);

export const session = pgTable("session", {
	sid: varchar().primaryKey().notNull(),
	sess: json().notNull(),
	expire: timestamp({ precision: 6, mode: 'string' }).notNull(),
}, (table) => [
	index("IDX_session_expire").using("btree", table.expire.asc().nullsLast().op("timestamp_ops")),
]);

export const savedJobs = pgTable("saved_jobs", {
	id: serial().primaryKey().notNull(),
	userId: integer("user_id").notNull(),
	jobId: integer("job_id").notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
	unique("saved_jobs_user_id_job_id_key").on(table.userId, table.jobId),
]);

export const reposts = pgTable("reposts", {
	id: serial().primaryKey().notNull(),
	userId: integer("user_id").notNull(),
	postId: integer("post_id").notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "reposts_user_id_fkey"
		}),
	foreignKey({
			columns: [table.postId],
			foreignColumns: [posts.id],
			name: "reposts_post_id_fkey"
		}),
]);

export const communityMembers = pgTable("community_members", {
	id: serial().primaryKey().notNull(),
	userId: integer("user_id").notNull(),
	communityId: integer("community_id").notNull(),
	joinedAt: timestamp("joined_at", { mode: 'string' }).defaultNow().notNull(),
	role: text().default('member').notNull(),
	isInvited: boolean("is_invited").default(false).notNull(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "community_members_user_id_users_id_fk"
		}),
	foreignKey({
			columns: [table.communityId],
			foreignColumns: [communities.id],
			name: "community_members_community_id_communities_id_fk"
		}),
]);

export const companies = pgTable("companies", {
	id: integer(),
	name: text(),
	ownerid: integer(),
	description: text(),
	industry: text(),
	location: text(),
	size: text(),
	website: text(),
	email: text(),
	logourl: text(),
	createdat: timestamp({ withTimezone: true, mode: 'string' }),
});
