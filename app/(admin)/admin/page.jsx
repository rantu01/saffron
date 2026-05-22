"use client";

import { useEffect, useState } from "react";

export default function DashboardPage() {
	const [stats, setStats] = useState({ users: 0, tasks: 0, availableCodes: 0 });
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		async function load() {
			setLoading(true);
			try {
				const [usersRes, tasksRes, invitesRes] = await Promise.all([
					fetch("/api/admin/users"),
					fetch("/api/admin/tasks"),
					fetch("/api/admin/invitations"),
				]);

				const usersData = await usersRes.json();
				const tasksData = await tasksRes.json();
				const invitesData = await invitesRes.json();

				const invitationList = invitesData.invitations || [];

				setStats({
					users: (usersData.users || []).length,
					tasks: (tasksData.tasks || []).length,
					availableCodes: invitationList.filter((item) => !item.usedByUid).length,
				});
			} finally {
				setLoading(false);
			}
		}

		load();
	}, []);

	return (
		<div>
			<h1 className="text-2xl font-semibold mb-4">Dashboard Home</h1>

			<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
				<div className="p-4 bg-white rounded shadow">
					<p className="text-sm text-slate-500">Total Users</p>
					<p className="text-2xl font-semibold mt-1">{loading ? "..." : stats.users}</p>
				</div>
				<div className="p-4 bg-white rounded shadow">
					<p className="text-sm text-slate-500">Total Tasks</p>
					<p className="text-2xl font-semibold mt-1">{loading ? "..." : stats.tasks}</p>
				</div>
				<div className="p-4 bg-white rounded shadow">
					<p className="text-sm text-slate-500">Available Invitation Codes</p>
					<p className="text-2xl font-semibold mt-1">{loading ? "..." : stats.availableCodes}</p>
				</div>
			</div>
		</div>
	);
}
