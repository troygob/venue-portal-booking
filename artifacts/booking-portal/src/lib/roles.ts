export const ROLE_LABELS: Record<string, string> = {
  student: 'Student Leader',
  dept_head: 'Department Head',
  school_admin: 'School Admin',
  facilities: 'Facilities Manager',
};

// Every item's `roles` list is the single source of truth for both the
// sidebar and page-level access checks — one place to keep in sync.
export const NAV_ITEMS = [
  { to: '/', label: 'Dashboard', roles: ['student', 'dept_head', 'school_admin', 'facilities'] },
  { to: '/submit', label: 'Submit proposal', roles: ['student'] },
  { to: '/queue', label: 'Approval queue', roles: ['dept_head', 'school_admin', 'facilities'] },
  { to: '/venues', label: 'Venues', roles: ['student', 'dept_head', 'school_admin', 'facilities'] },
  { to: '/calendar', label: 'Availability calendar', roles: ['student', 'dept_head', 'school_admin', 'facilities'] },
  { to: '/notifications', label: 'Notifications', roles: ['student', 'dept_head', 'school_admin', 'facilities'] },
];

export function fmtMoney(n: number | string | null | undefined): string {
  return '₱' + Number(n ?? 0).toLocaleString();
}
