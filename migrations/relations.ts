import { relations } from "drizzle-orm/relations";
import { users, communities, comments, posts, connections, messages, jobs, jobApplications, likes, reposts, communityMembers } from "./schema";

export const communitiesRelations = relations(communities, ({one, many}) => ({
	user: one(users, {
		fields: [communities.createdBy],
		references: [users.id]
	}),
	posts: many(posts),
	communityMembers: many(communityMembers),
}));

export const usersRelations = relations(users, ({many}) => ({
	communities: many(communities),
	comments: many(comments),
	connections_requesterId: many(connections, {
		relationName: "connections_requesterId_users_id"
	}),
	connections_receiverId: many(connections, {
		relationName: "connections_receiverId_users_id"
	}),
	messages_senderId: many(messages, {
		relationName: "messages_senderId_users_id"
	}),
	messages_receiverId: many(messages, {
		relationName: "messages_receiverId_users_id"
	}),
	posts_userId: many(posts, {
		relationName: "posts_userId_users_id"
	}),
	posts_repostedBy: many(posts, {
		relationName: "posts_repostedBy_users_id"
	}),
	jobs: many(jobs),
	jobApplications: many(jobApplications),
	likes: many(likes),
	reposts: many(reposts),
	communityMembers: many(communityMembers),
}));

export const commentsRelations = relations(comments, ({one}) => ({
	user: one(users, {
		fields: [comments.userId],
		references: [users.id]
	}),
	post: one(posts, {
		fields: [comments.postId],
		references: [posts.id]
	}),
}));

export const postsRelations = relations(posts, ({one, many}) => ({
	comments: many(comments),
	user_userId: one(users, {
		fields: [posts.userId],
		references: [users.id],
		relationName: "posts_userId_users_id"
	}),
	community: one(communities, {
		fields: [posts.communityId],
		references: [communities.id]
	}),
	post: one(posts, {
		fields: [posts.originalPostId],
		references: [posts.id],
		relationName: "posts_originalPostId_posts_id"
	}),
	posts: many(posts, {
		relationName: "posts_originalPostId_posts_id"
	}),
	user_repostedBy: one(users, {
		fields: [posts.repostedBy],
		references: [users.id],
		relationName: "posts_repostedBy_users_id"
	}),
	likes: many(likes),
	reposts: many(reposts),
}));

export const connectionsRelations = relations(connections, ({one}) => ({
	user_requesterId: one(users, {
		fields: [connections.requesterId],
		references: [users.id],
		relationName: "connections_requesterId_users_id"
	}),
	user_receiverId: one(users, {
		fields: [connections.receiverId],
		references: [users.id],
		relationName: "connections_receiverId_users_id"
	}),
}));

export const messagesRelations = relations(messages, ({one}) => ({
	user_senderId: one(users, {
		fields: [messages.senderId],
		references: [users.id],
		relationName: "messages_senderId_users_id"
	}),
	user_receiverId: one(users, {
		fields: [messages.receiverId],
		references: [users.id],
		relationName: "messages_receiverId_users_id"
	}),
}));

export const jobsRelations = relations(jobs, ({one, many}) => ({
	user: one(users, {
		fields: [jobs.userId],
		references: [users.id]
	}),
	jobApplications: many(jobApplications),
}));

export const jobApplicationsRelations = relations(jobApplications, ({one}) => ({
	job: one(jobs, {
		fields: [jobApplications.jobId],
		references: [jobs.id]
	}),
	user: one(users, {
		fields: [jobApplications.applicantId],
		references: [users.id]
	}),
}));

export const likesRelations = relations(likes, ({one}) => ({
	user: one(users, {
		fields: [likes.userId],
		references: [users.id]
	}),
	post: one(posts, {
		fields: [likes.postId],
		references: [posts.id]
	}),
}));

export const repostsRelations = relations(reposts, ({one}) => ({
	user: one(users, {
		fields: [reposts.userId],
		references: [users.id]
	}),
	post: one(posts, {
		fields: [reposts.postId],
		references: [posts.id]
	}),
}));

export const communityMembersRelations = relations(communityMembers, ({one}) => ({
	user: one(users, {
		fields: [communityMembers.userId],
		references: [users.id]
	}),
	community: one(communities, {
		fields: [communityMembers.communityId],
		references: [communities.id]
	}),
}));