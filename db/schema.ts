import { pgTable, text, serial, integer, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { relations } from "drizzle-orm";
import { z } from "zod";

export const builds = pgTable("builds", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  price: integer("price").notNull(),
  image: text("image").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull()
});

export const reviews = pgTable("reviews", {
  id: serial("id").primaryKey(),
  buildId: integer("build_id").notNull(),
  rating: integer("rating").notNull(),
  comment: text("comment").notNull(),
  userName: text("user_name").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull()
});

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").unique().notNull(),
  email: text("email").unique(),
  password: text("password").notNull(),
  bio: text("bio"),
  bannerImage: text("banner_image"),
  createdAt: timestamp("created_at").defaultNow().notNull()
});

export const roles = pgTable("roles", {
  id: serial("id").primaryKey(),
  name: text("name").unique().notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow().notNull()
});

export const userRoles = pgTable("user_roles", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id),
  roleId: integer("role_id")
    .notNull()
    .references(() => roles.id),
  createdAt: timestamp("created_at").defaultNow().notNull()
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  userRoles: many(userRoles)
}));

export const rolesRelations = relations(roles, ({ many }) => ({
  userRoles: many(userRoles)
}));

export const userRolesRelations = relations(userRoles, ({ one }) => ({
  user: one(users, {
    fields: [userRoles.userId],
    references: [users.id]
  }),
  role: one(roles, {
    fields: [userRoles.roleId],
    references: [roles.id]
  })
}));

// Build schemas
export const insertBuildSchema = createInsertSchema(builds);
export const selectBuildSchema = createSelectSchema(builds);
export type InsertBuild = typeof builds.$inferInsert;
export type SelectBuild = typeof builds.$inferSelect;

// Review schemas
export const insertReviewSchema = createInsertSchema(reviews);
export const selectReviewSchema = createSelectSchema(reviews);
export type InsertReview = typeof reviews.$inferInsert;
export type SelectReview = typeof reviews.$inferSelect;

// User schemas
const baseUserSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  email: z.string().email("Invalid email address").optional(),
  bio: z.string().optional(),
});

export const insertUserSchema = baseUserSchema;
export const selectUserSchema = createSelectSchema(users);
export type InsertUser = z.infer<typeof insertUserSchema>;
export type SelectUser = typeof users.$inferSelect;

// Role schemas
export const insertRoleSchema = createInsertSchema(roles);
export const selectRoleSchema = createSelectSchema(roles);
export type InsertRole = typeof roles.$inferInsert;
export type SelectRole = typeof roles.$inferSelect;

// UserRole schemas
export const insertUserRoleSchema = createInsertSchema(userRoles);
export const selectUserRoleSchema = createSelectSchema(userRoles);
export type InsertUserRole = typeof userRoles.$inferInsert;
export type SelectUserRole = typeof userRoles.$inferSelect;