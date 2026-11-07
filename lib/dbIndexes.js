/**
 * Idempotent index creation for the query shapes used by the application.
 *
 * Indexes are additive only. Existing data is never modified. Failures are
 * reported and do not prevent the application from starting.
 */
const INDEX_SPECS = [
  // Users: identity lookup, role listing, newest-first admin list.
  ["users", { uid: 1 }, { unique: true, name: "uid_1_unique" }],
  ["users", { authUid: 1 }, { sparse: true, name: "authUid_1_sparse" }],
  ["users", { email: 1 }],
  ["users", { role: 1, createdAt: -1 }],
  ["users", { createdAt: -1 }],

  // Tasks: dashboard/history, set ordering, template lookup by group.
  ["tasks", { assigneeUid: 1, status: 1, createdAt: -1 }],
  ["tasks", { assigneeUid: 1, setNumber: 1, position: 1 }],
  ["tasks", { assigneeUid: 1, parentTaskGroupId: 1, setNumber: -1, createdAt: -1 }],
  ["tasks", { parentTaskGroupId: 1 }],
  ["tasks", { isTemplate: 1, taskGroupId: 1 }],
  ["tasks", { createdAt: -1 }],

  // Task sets: latest set, set lookup, rolling daily-limit query.
  ["userTaskSets", { uid: 1, setNumber: -1 }],
  ["userTaskSets", { uid: 1, status: 1, completedAt: -1 }],
  // One in-progress task set per user/set number.
  ["userTaskSets", { uid: 1, setNumber: 1 }, { unique: true, partialFilterExpression: { status: "in_progress" } }],

  // Combined tasks: active combo lookup and per-set lookup.
  ["comboTasks", { uid: 1, status: 1 }],
  ["comboTasks", { uid: 1, setNumber: 1 }],

  // Finance lists and histories.
  ["deposits", { status: 1, createdAt: -1 }],
  ["deposits", { uid: 1, createdAt: -1 }],
  ["withdrawals", { status: 1, createdAt: -1 }],
  ["withdrawals", { uid: 1, createdAt: -1 }],
  ["balanceLogs", { uid: 1, createdAt: -1 }],
  ["balanceLogs", { createdAt: -1 }],

  // Notifications: inbox list and unread count.
  ["notifications", { uid: 1, isRead: 1, createdAt: -1 }],

  // Referral codes and group assignment history.
  ["invitationCodes", { code: 1 }, { unique: true, name: "code_1_unique" }],
  ["invitationCodes", { createdByUid: 1, isActive: 1 }],
  // One active referral code per user.
  ["invitationCodes", { createdByUid: 1 }, { unique: true, name: "createdByUid_1_active_unique", partialFilterExpression: { isActive: true, createdByUid: { $gt: "" } } }],
  ["groupAssignments", { assigneeUid: 1, assignedAt: -1 }],

  // VIP requests: pending queue and per-user history.
  ["vipRequests", { status: 1, createdAt: -1 }],
  ["vipRequests", { uid: 1, createdAt: -1 }],

  // Ad account assignment and Meta sync lookup.
  ["adAccounts", { uid: 1, unassignedAt: 1 }],
  ["adAccounts", { metaAccountId: 1 }],

  // Operational logs.
  ["notificationLogs", { createdAt: -1 }],
  ["notificationLogs", { uid: 1, createdAt: -1 }],
  ["syncLogs", { createdAt: -1 }],

  // Chat history reads (existing readAt indexes are preserved in the database).
  ["messages", { conversationId: 1, createdAt: -1 }],

  // Phase 3: audit and login history.
  ["activityLogs", { createdAt: -1 }],
  ["activityLogs", { actorUid: 1, createdAt: -1 }],
  ["activityLogs", { targetType: 1, targetId: 1, createdAt: -1 }],
  ["activityLogs", { action: 1, createdAt: -1 }],
  ["loginHistory", { uid: 1, createdAt: -1 }],
  ["loginHistory", { createdAt: -1 }],
  ["loginHistory", { result: 1, createdAt: -1 }],

  // Phase 5: VIP config versions.
  ["vipConfigVersions", { status: 1, createdAt: -1 }],
  ["vipConfigVersions", { createdAt: -1 }],

  // Phase 4: combo config versions.
  ["comboConfigVersions", { status: 1, createdAt: -1 }],
  ["comboConfigVersions", { createdAt: -1 }],

  // Phase 6: terms versions and acceptances.
  ["termsVersions", { status: 1, createdAt: -1 }],
  ["termsVersions", { version: 1 }],
  ["termsAcceptances", { uid: 1, acceptedAt: -1 }],
  ["termsAcceptances", { version: 1, acceptedAt: -1 }],
  ["termsAcceptances", { uid: 1, version: 1 }],
];

export async function ensureDatabaseIndexes(db) {
  const results = await Promise.allSettled(
    INDEX_SPECS.map(([collection, keys, options]) =>
      db.collection(collection).createIndex(keys, { background: true, ...(options || {}) })
    )
  );

  const failed = [];
  results.forEach((result, index) => {
    if (result.status === "rejected") {
      const [collection, keys, options] = INDEX_SPECS[index];
      failed.push({
        collection,
        keys,
        options,
        message: result.reason?.message || String(result.reason),
      });
    }
  });

  if (failed.length) {
    console.error("Index creation incomplete:", failed);
  }

  return { total: INDEX_SPECS.length, failed };
}
