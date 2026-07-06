# Plan: Clickable Group Cards + Reward Display

## Goal
Make `/admin/task-management` page work as described by user:
1. Clicking a group card (Section 0) should auto-select it in Section 3 and show its tasks
2. Editing a task's total amount should auto-calculate and save both `profit` and `reward`

## File to modify

**`app/(admin)/admin/task-management/page.jsx`** (1219 lines, single "use client" component)

---

## Change 1: Make group cards clickable (lines 526–536)

### Current (static `<div>`)
```jsx
<div key={g._id} className="border border-slate-200 rounded-lg p-3 text-sm">
  <p className="font-medium text-slate-900">{g.name}</p>
  {g.description && <p className="text-xs text-slate-400 mt-0.5">{g.description}</p>}
  <p className="text-xs mt-2">...</p>
</div>
```

### New (clickable `<button>`, toggles `selectedGroupTaskId`)
```jsx
const isSelected = selectedGroupTaskId === g._id;
return (
  <button
    key={g._id}
    type="button"
    onClick={() => setSelectedGroupTaskId(isSelected ? "" : g._id)}
    className={`border text-left rounded-lg p-3 text-sm transition cursor-pointer ${
      isSelected
        ? "border-[#E05305] bg-orange-50 ring-1 ring-[#E05305]"
        : "border-slate-200 hover:border-slate-300 hover:bg-slate-50"
    }`}
  >
    <p className="font-medium text-slate-900">{g.name}</p>
    {g.description && <p className="text-xs text-slate-400 mt-0.5">{g.description}</p>}
    <p className="text-xs mt-2">
      <span className="text-slate-500">{used}/30 tasks</span>
      <span className={`ml-2 font-medium ${available > 0 ? "text-emerald-600" : "text-red-500"}`}>
        ({available} slot{available !== 1 ? "s" : ""} available)
      </span>
    </p>
  </button>
);
```

**What it does:**
- Clicking a group card sets `selectedGroupTaskId` to that group's `_id`
- Clicking the same card again deselects (toggles to `""`)
- The `selectedGroupTaskId` state already controls Section 3's dropdown — so Section 3 will immediately show that group's tasks
- Selected card gets an orange border + light orange background for visual feedback

---

## Change 2: Add "Reward" column to group task table (lines 822–877)

### Current table header (line 824–831)
```jsx
<th>App Name</th>
<th>Logo</th>
<th>Total Amount</th>
<th>Profit</th>
<th>Status</th>
<th>Date</th>
<th>Actions</th>
```

### New table header
```jsx
<th>App Name</th>
<th>Logo</th>
<th>Total Amount</th>
<th>Profit</th>
<th>Reward</th>
<th>Status</th>
<th>Date</th>
<th>Actions</th>
```

### Current table cell (line 846)
```jsx
<td className="py-3 px-4 text-emerald-600 font-medium">${formatMoney(task.profit)}</td>
```

### New table cell — add after profit cell
```jsx
<td className="py-3 px-4 text-emerald-600 font-medium">${formatMoney(task.profit)}</td>
<td className="py-3 px-4 text-emerald-600 font-medium">${formatMoney(task.reward ?? task.profit)}</td>
```

---

## Change 3: Show "Calculated Reward" in edit modal (lines 1083–1089)

### Current
```jsx
{/* Auto Profit Display */}
<div className="md:col-span-2 bg-slate-50 rounded-lg px-4 py-3 flex items-center justify-between">
  <div>
    <p className="text-sm font-medium text-slate-700">Calculated Profit (0.5%)</p>
    <p className="text-xs text-slate-400">0.5% of total amount</p>
  </div>
  <span className="text-lg font-bold text-[#E05305]">${formatMoney(editProfit)}</span>
</div>
```

### New — show both profit and reward side by side
```jsx
{/* Auto Profit & Reward Display */}
<div className="md:col-span-2 grid grid-cols-2 gap-3">
  <div className="bg-slate-50 rounded-lg px-4 py-3">
    <p className="text-sm font-medium text-slate-700">Calculated Profit (0.5%)</p>
    <p className="text-xs text-slate-400">0.5% of total amount</p>
    <span className="text-lg font-bold text-[#E05305]">${formatMoney(editProfit)}</span>
  </div>
  <div className="bg-slate-50 rounded-lg px-4 py-3">
    <p className="text-sm font-medium text-slate-700">Calculated Reward</p>
    <p className="text-xs text-slate-400">Same as profit</p>
    <span className="text-lg font-bold text-emerald-600">${formatMoney(editProfit)}</span>
  </div>
</div>
```

---

## No backend changes needed

The `PUT /api/admin/tasks/[id]/route.js` already does this (lines 18-19, 47-48):

```js
const totalAmt = Math.max(0, Number(totalAmount) || 0);
const profit = Math.round(totalAmt * 0.5) / 100;

const updateFields = {
  totalAmount: totalAmt,
  profit,
  reward: profit,        // <-- already saved alongside profit
  ...
};
```

Both `profit` and `reward` are already persisted to the database on every edit.

---

## Summary

| # | Change | Location (line) |
|---|--------|----------------|
| 1 | Group cards clickable → toggle `selectedGroupTaskId` | Lines 526–536 |
| 2 | Add "Reward" column to group task table | Lines 824–877 |
| 3 | Show "Calculated Reward" in edit modal | Lines 1083–1089 |

No API, database, or model changes required.
