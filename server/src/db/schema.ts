import {
  pgTable,
  uuid,
  text,
  timestamp,
  integer,
  jsonb,
  pgEnum,
  boolean,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Enums
export const roleEnum = pgEnum('role', ['ADMIN', 'QA_MANAGER', 'HANDLER', 'VIEWER']);
export const severityEnum = pgEnum('severity', ['CRITICAL', 'MAJOR', 'MINOR']);
export const ncrStatusEnum = pgEnum('ncr_status', [
  'DRAFT',
  'ASSIGNED',
  'AWAITING_APPROVAL',
  'VERIFICATION',
  'APPROVED',
  'REJECTED',
  'CLOSED',
  'CANCELLED',
]);

// Notification Settings (Single row global config)
export const notificationSettings = pgTable('notification_settings', {
  id: integer('id').primaryKey().default(1),
  globalEnabled: boolean('global_enabled').default(true).notNull(),

  // Notification types
  ncrCreatedEnabled: boolean('ncr_created_enabled').default(true).notNull(),
  ncrAssignedEnabled: boolean('ncr_assigned_enabled').default(true).notNull(),
  statusChangeEnabled: boolean('status_change_enabled').default(true).notNull(),
  overdueEnabled: boolean('overdue_enabled').default(true).notNull(),
  verificationRequiredEnabled: boolean('verification_required_enabled').default(true).notNull(),
  verificationRejectedEnabled: boolean('verification_rejected_enabled').default(true).notNull(),
  ncrClosedEnabled: boolean('ncr_closed_enabled').default(true).notNull(),
  ncrCancelledEnabled: boolean('ncr_cancelled_enabled').default(true).notNull(),

  // Overdue settings
  overdueFirstFollowUpDays: integer('overdue_first_follow_up_days').default(3).notNull(),
  overdueRecurringDays: integer('overdue_recurring_days').default(7).notNull(),

  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});
export const capaStatusEnum = pgEnum('capa_status', [
  'PENDING',
  'IN_PROGRESS',
  'COMPLETED',
  'OVERDUE',
]);

// Departments
export const departments = pgTable('departments', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').unique().notNull(),
  primaryHandlerId: uuid('primary_handler_id'), // Set later to avoid circular dependency in schema
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Users
export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  email: text('email').unique().notNull(),
  passwordHash: text('password_hash').notNull(),
  role: roleEnum('role').default('HANDLER').notNull(),
  departmentId: uuid('department_id')
    .references(() => departments.id)
    .notNull(),
  mustChangePassword: boolean('must_change_password').default(false).notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// NCRs
export const ncrs = pgTable('ncrs', {
  id: uuid('id').primaryKey().defaultRandom(),
  autoId: text('auto_id').unique().notNull(), // e.g., "NCR-0001"
  title: text('title').notNull(),
  description: text('description').notNull(),
  severity: severityEnum('severity').notNull(),
  status: ncrStatusEnum('status').default('DRAFT').notNull(),

  projectId: text('project_id').notNull(),
  projectName: text('project_name').notNull().default('N/A'),
  location: text('location').notNull(),
  category: text('category').notNull(),

  attachments: jsonb('attachments'),

  rootCauseAnalysis: jsonb('root_cause_analysis'), // 5-Why etc.

  cancellationReason: text('cancellation_reason'),
  cancellationUserId: uuid('cancellation_user_id').references(() => users.id),

  issuedByUserId: uuid('issued_by_user_id')
    .references(() => users.id)
    .notNull(),
  issuedToDepartmentId: uuid('issued_to_department_id')
    .references(() => departments.id)
    .notNull(),

  handlerId: uuid('handler_id').references(() => users.id),

  dateClosed: timestamp('date_closed'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// CAPA Actions
export const capaActions = pgTable('capa_actions', {
  id: uuid('id').primaryKey().defaultRandom(),
  ncrId: uuid('ncr_id')
    .references(() => ncrs.id)
    .notNull(),
  ownerId: uuid('owner_id')
    .references(() => users.id)
    .notNull(),
  description: text('description').notNull(),
  dueDate: timestamp('due_date').notNull(),
  status: capaStatusEnum('status').default('PENDING').notNull(),
  completionPercentage: integer('completion_percentage').default(0).notNull(),
  isPreventive: boolean('is_preventive').default(false).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Audit Logs (NCR Related)
export const auditLogs = pgTable('audit_logs', {
  id: uuid('id').primaryKey().defaultRandom(),
  ncrId: uuid('ncr_id')
    .references(() => ncrs.id)
    .notNull(),
  userId: uuid('user_id')
    .references(() => users.id)
    .notNull(),
  action: text('action').notNull(),
  details: jsonb('details'),
  timestamp: timestamp('timestamp').defaultNow().notNull(),
});

// User Audit Logs (Role/Dept changes)
export const userAuditLogs = pgTable('user_audit_logs', {
  id: uuid('id').primaryKey().defaultRandom(),
  targetUserId: uuid('target_user_id')
    .references(() => users.id)
    .notNull(),
  actingUserId: uuid('acting_user_id')
    .references(() => users.id)
    .notNull(),
  action: text('action').notNull(), // 'ROLE_CHANGE', 'DEPT_CHANGE', 'STATUS_CHANGE', 'PASSWORD_RESET'
  details: jsonb('details'),
  timestamp: timestamp('timestamp').defaultNow().notNull(),
});

// Electronic Signatures
export const signatures = pgTable('signatures', {
  id: uuid('id').primaryKey().defaultRandom(),
  ncrId: uuid('ncr_id')
    .references(() => ncrs.id)
    .notNull(),
  userId: uuid('user_id')
    .references(() => users.id)
    .notNull(),
  stage: text('stage').notNull(), // ISSUE, VERIFICATION, CLOSURE
  timestamp: timestamp('timestamp').defaultNow().notNull(),
  metadata: jsonb('metadata'),
});

// Counters for Auto-ID
export const counters = pgTable('counters', {
  name: text('name').primaryKey(),
  value: integer('value').notNull().default(0),
});

// Relations
export const departmentsRelations = relations(departments, ({ many }) => ({
  users: many(users),
  ncrsIssuedTo: many(ncrs, { relationName: 'issuedToDepartment' }),
}));

export const usersRelations = relations(users, ({ one, many }) => ({
  department: one(departments, {
    fields: [users.departmentId],
    references: [departments.id],
  }),
  issuedNcrs: many(ncrs, { relationName: 'issuedBy' }),
  handledNcrs: many(ncrs, { relationName: 'handler' }),
  capaActions: many(capaActions),
  auditLogs: many(auditLogs),
  signatures: many(signatures),
  userAuditLogsAsTarget: many(userAuditLogs, { relationName: 'targetUser' }),
  userAuditLogsAsActor: many(userAuditLogs, { relationName: 'actingUser' }),
}));

export const userAuditLogsRelations = relations(userAuditLogs, ({ one }) => ({
  targetUser: one(users, {
    fields: [userAuditLogs.targetUserId],
    references: [users.id],
    relationName: 'targetUser',
  }),
  actingUser: one(users, {
    fields: [userAuditLogs.actingUserId],
    references: [users.id],
    relationName: 'actingUser',
  }),
}));

export const ncrsRelations = relations(ncrs, ({ one, many }) => ({
  issuedBy: one(users, {
    fields: [ncrs.issuedByUserId],
    references: [users.id],
    relationName: 'issuedBy',
  }),
  issuedToDepartment: one(departments, {
    fields: [ncrs.issuedToDepartmentId],
    references: [departments.id],
    relationName: 'issuedToDepartment',
  }),
  handler: one(users, {
    fields: [ncrs.handlerId],
    references: [users.id],
    relationName: 'handler',
  }),
  cancellationUser: one(users, {
    fields: [ncrs.cancellationUserId],
    references: [users.id],
  }),
  capaActions: many(capaActions),
  auditLogs: many(auditLogs),
  signatures: many(signatures),
}));

export const capaActionsRelations = relations(capaActions, ({ one }) => ({
  ncr: one(ncrs, {
    fields: [capaActions.ncrId],
    references: [ncrs.id],
  }),
  owner: one(users, {
    fields: [capaActions.ownerId],
    references: [users.id],
  }),
}));

export const auditLogsRelations = relations(auditLogs, ({ one }) => ({
  ncr: one(ncrs, {
    fields: [auditLogs.ncrId],
    references: [ncrs.id],
  }),
  user: one(users, {
    fields: [auditLogs.userId],
    references: [users.id],
  }),
}));

export const signaturesRelations = relations(signatures, ({ one }) => ({
  ncr: one(ncrs, {
    fields: [signatures.ncrId],
    references: [ncrs.id],
  }),
  user: one(users, {
    fields: [signatures.userId],
    references: [users.id],
  }),
}));
