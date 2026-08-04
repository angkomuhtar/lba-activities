export function roleLabel(roleName: string, roles: { name: string; label: string }[]) {
  const found = roles.find((r) => r.name === roleName);
  return found?.label ?? roleName;
}