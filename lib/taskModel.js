export function roundCurrency(value) {
  return Math.round(Number(value || 0) * 100) / 100;
}

const NUM_COMBINATION_SLOTS = 5;
const COMBINATION_RANGE = { start: 10, end: 25 };

export function generateCombinationPositions() {
  const positions = new Set();
  while (positions.size < NUM_COMBINATION_SLOTS) {
    const pos = Math.floor(Math.random() * (COMBINATION_RANGE.end - COMBINATION_RANGE.start + 1)) + COMBINATION_RANGE.start;
    positions.add(pos);
  }
  return Array.from(positions).sort((a, b) => a - b);
}

export function isCombinationTask(task = {}) {
  const position = Number(task.position || 0);
  const comboPositions = Array.isArray(task.combinationPositions) ? task.combinationPositions : [];
  return Boolean(task.isCombinationTask || task.taskType === "combination" || comboPositions.includes(position));
}

export function getTaskRewardMultiplier(task = {}) {
  if (Number(task.profitMultiplier || task.rewardMultiplier || 0) > 1) {
    return Number(task.profitMultiplier || task.rewardMultiplier);
  }

  return isCombinationTask(task) ? 5 : 1;
}

export function getTaskRequiredBalance(task = {}) {
  const storedRequirement = Number(task.requiredBalance);
  if (Number.isFinite(storedRequirement) && storedRequirement > 0) {
    return storedRequirement;
  }

  const reward = Number(task.reward || 0);
  const position = Number(task.position || 1);

  if (isCombinationTask(task)) {
    return Math.max(50, roundCurrency(reward * 4.5 + position * 3));
  }

  const bands = [1.15, 1.25, 1.35, 1.45, 1.6];
  const band = bands[(position - 1) % bands.length];
  return Math.max(10, roundCurrency(reward * band + position * 0.75));
}

export function getCombinationReward(positions, currentPosition, totalTasks) {
  const comboIndex = positions.indexOf(currentPosition);
  if (comboIndex === -1) return null;

  const baseFactor = 0.05 + (comboIndex / positions.length) * 0.25;
  const baseRewardFraction = roundCurrency(baseFactor);
  const profitPercent = roundCurrency(baseFactor * 100);

  return {
    profitPercent,
    baseRewardFraction,
  };
}

export function buildTaskFinancialProfile(task = {}, positionOverride = null, setNumberOverride = null, combinationPositions = null) {
  const position = Number(positionOverride ?? task.position ?? 0);
  const setNumber = Number(setNumberOverride ?? task.setNumber ?? 1);
  const reward = Number(task.reward || 0);
  const taskWithCombos = combinationPositions ? { ...task, combinationPositions } : task;
  const combinationTask = isCombinationTask({ ...taskWithCombos, position });

  return {
    setNumber,
    position,
    reward,
    combinationPositions: combinationPositions || task.combinationPositions || [],
    taskType: combinationTask ? "combination" : task.taskType || "single",
    isCombinationTask: combinationTask,
    profitMultiplier: combinationTask ? 5 : Number(task.profitMultiplier || task.rewardMultiplier || 1),
    requiredBalance: getTaskRequiredBalance({ ...task, position }),
  };
}