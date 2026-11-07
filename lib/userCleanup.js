/**
 * Remove or detach data owned by a deleted user.
 *
 * Ad accounts are company inventory, so they are unassigned rather than
 * deleted. Global configuration collections are never touched.
 */
export async function deleteUserRelatedData(db, uid) {
  if (!uid) return { failed: [] };

  const now = new Date();

  const operations = [
    ["tasks", db.collection("tasks").deleteMany({ assigneeUid: uid })],
    ["taskSets", db.collection("taskSets").deleteMany({ assigneeUid: uid })],
    ["userTaskSets", db.collection("userTaskSets").deleteMany({ uid })],
    ["comboTasks", db.collection("comboTasks").deleteMany({ uid })],
    ["groupAssignments", db.collection("groupAssignments").deleteMany({ assigneeUid: uid })],
    ["vipRequests", db.collection("vipRequests").deleteMany({ uid })],
    ["records", db.collection("records").deleteMany({ uid })],
    ["balanceLogs", db.collection("balanceLogs").deleteMany({ uid })],
    ["notifications", db.collection("notifications").deleteMany({ uid })],
    ["notificationLogs", db.collection("notificationLogs").deleteMany({ uid })],
    ["deposits", db.collection("deposits").deleteMany({ uid })],
    ["withdrawals", db.collection("withdrawals").deleteMany({ uid })],
    [
      "messages",
      db.collection("messages").deleteMany({
        $or: [{ conversationId: uid }, { senderUid: uid }, { receiverUid: uid }],
      }),
    ],
    [
      "invitationCodes",
      db.collection("invitationCodes").deleteMany({
        $or: [{ createdByUid: uid }, { usedByUid: uid }],
      }),
    ],
    [
      "adAccounts",
      db.collection("adAccounts").updateMany(
        { uid },
        {
          $set: {
            uid: "",
            email: "",
            assignedBy: null,
            assignedAt: null,
            unassignedAt: now,
            updatedAt: now,
          },
        }
      ),
    ],
  ];

  const settled = await Promise.allSettled(operations.map(([, promise]) => promise));
  const failed = [];

  settled.forEach((result, index) => {
    if (result.status === "rejected") {
      failed.push({
        collection: operations[index][0],
        message: result.reason?.message || String(result.reason),
      });
    }
  });

  return { failed };
}
