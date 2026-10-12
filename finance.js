import { prisma } from './prisma.js';
import { monthRange, round2 } from './utils.js';

// Budget utilisation for one month (Member 2: budget tracking + notifications)
export async function getBudgetStatus(userId, month, year) {
  const { start, end } = monthRange(month, year);
  const [budgets, expenses] = await Promise.all([
    prisma.budget.findMany({ where: { userId, month, year }, orderBy: { category: 'asc' } }),
    prisma.transaction.findMany({
      where: { userId, type: 'EXPENSE', date: { gte: start, lt: end } },
      select: { category: true, amount: true },
    }),
  ]);

  const spentBy = {};
  for (const e of expenses) spentBy[e.category] = (spentBy[e.category] || 0) + e.amount;

  return budgets.map((b) => {
    const spent = round2(spentBy[b.category] || 0);
    const percent = b.limit > 0 ? round2((spent / b.limit) * 100) : 0;
    const status = percent > 100 ? 'EXCEEDED' : percent >= 80 ? 'WARNING' : 'OK';
    return { ...b, spent, remaining: round2(b.limit - spent), percent, status };
  });
}

export function budgetAlerts(statuses) {
  return statuses
    .filter((b) => b.status !== 'OK')
    .map((b) => ({
      category: b.category,
      status: b.status,
      percent: b.percent,
      message:
        b.status === 'EXCEEDED'
          ? `You went over your ${b.category} budget by ৳${round2(b.spent - b.limit)}.`
          : `You have used ${b.percent}% of your ${b.category} budget.`,
    }));
}

// Savings goal progress + required periodic savings (Member 2)
export function enrichGoal(g) {
  const remaining = Math.max(g.targetAmount - g.savedAmount, 0);
  const percent =
    g.targetAmount > 0 ? Math.min(round2((g.savedAmount / g.targetAmount) * 100), 100) : 0;
  const daysLeft = Math.ceil((new Date(g.deadline) - new Date()) / 86400000);
  const completed = remaining === 0;
  const overdue = daysLeft < 0 && !completed;
  const monthsLeft = Math.max(daysLeft, 0) / 30.44;
  const monthlyPeriods = Math.max(Math.ceil(monthsLeft), 1);
  const weeklyPeriods = Math.max(Math.ceil(Math.max(daysLeft, 0) / 7), 1);

  return {
    ...g,
    remaining: round2(remaining),
    percent,
    daysLeft,
    completed,
    overdue,
    requiredMonthly: round2(remaining / monthlyPeriods),
    requiredWeekly: round2(remaining / weeklyPeriods),
  };
}
