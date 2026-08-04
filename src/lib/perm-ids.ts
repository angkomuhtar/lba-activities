// Permission identifier tertentu yang dicek logika internal (guard, menu).
// Role dinamis di DB, tapi identifier permission ini adalah turun (string).
export const PERMS = {
  dashboard: "dashboard.view",
  userView: "user.view",
  userManage: "user.manage",
  settingsManage: "settings.manage",
  shipView: "ship.view",
  shipManage: "ship.manage",
  activityManage: "activity.manage",
  stockManage: "stock.manage",
} as const;