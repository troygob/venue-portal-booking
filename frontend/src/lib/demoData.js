// Sample data used only in Demo Mode. None of this ever touches Supabase
// or the FastAPI backend — it's plain in-memory state so anyone can click
// through every role without a real account, a real database, or real
// network calls. Resets whenever demo mode is (re)entered from the login
// screen.

export const DEMO_PROFILES = {
  student: {
    id: 'demo-student',
    email: 'demo.student@students.smu.edu.ph',
    first_name: 'Pepito',
    last_name: 'Manaloto',
    role: 'student',
    org_id: 'demo-org',
    department_id: 'demo-dept',
    position: 'Org President',
    verification_status: 'Verified',
  },
  dept_head: {
    id: 'demo-dept-head',
    email: 'demo.depthead@smu.edu.ph',
    first_name: 'John',
    last_name: 'Jacinto',
    role: 'dept_head',
    department_id: 'demo-dept',
    position: 'Department Head, Student Affairs',
    verification_status: 'Verified',
  },
  school_admin: {
    id: 'demo-school-admin',
    email: 'demo.admin@smu.edu.ph',
    first_name: 'Corazon',
    last_name: 'Cruz',
    role: 'school_admin',
    position: 'System Administrator',
    verification_status: 'Verified',
  },
  facilities: {
    id: 'demo-facilities',
    email: 'demo.facilities@facilities.smu.edu.ph',
    first_name: 'Ben',
    last_name: 'Benito',
    role: 'facilities',
    position: 'Facilities Manager',
    verification_status: 'Verified',
  },
}

export const DEMO_ROLE_ORDER = ['student', 'dept_head', 'school_admin', 'facilities']

export const DEMO_VENUES = [
  { venue_id: 'v-roces', venue_name: 'Roces Hall', location: 'Roces Building', capacity: 300, applicable_fees: 2500, booking_deadline_days: 5, status: 'Available' },
  { venue_id: 'v-shc', venue_name: 'Sacred Heart Center', location: 'UB Park', capacity: 500, applicable_fees: 5000, booking_deadline_days: 7, status: 'Available' },
  { venue_id: 'v-tonus', venue_name: 'Tonus Gymnasium', location: 'Tonus Gym', capacity: 1200, applicable_fees: 8000, booking_deadline_days: 10, status: 'Available' },
  { venue_id: 'v-sthall', venue_name: 'St. Therese Hall', location: 'JVD Building, top floor', capacity: 250, applicable_fees: 2000, booking_deadline_days: 5, status: 'Available' },
  { venue_id: 'v-hotel', venue_name: 'Hotel', location: 'De Buscherre Building', capacity: 150, applicable_fees: 6000, booking_deadline_days: 7, status: 'Available' },
  { venue_id: 'v-aula', venue_name: 'Aula Maria Hall', location: 'Apo Pilo Top Floor', capacity: 400, applicable_fees: 3000, booking_deadline_days: 5, status: 'Available' },
  { venue_id: 'v-rt202', venue_name: 'RT202', location: 'RT building, 2F', capacity: 60, applicable_fees: 500, booking_deadline_days: 3, status: 'Available' },
  { venue_id: 'v-rt303', venue_name: 'RT303', location: 'RT building, 3F', capacity: 60, applicable_fees: 500, booking_deadline_days: 3, status: 'Under Maintenance' },
  { venue_id: 'v-avr1', venue_name: 'AVR1', location: 'Next to Museo', capacity: 80, applicable_fees: 800, booking_deadline_days: 3, status: 'Available' },
  { venue_id: 'v-avr2', venue_name: 'AVR2', location: 'L Building, 3rd floor', capacity: 80, applicable_fees: 800, booking_deadline_days: 3, status: 'Available' },
]

const today = new Date()
function daysFromNow(n) {
  const d = new Date(today)
  d.setDate(d.getDate() + n)
  return d.toISOString().slice(0, 10)
}

export const INITIAL_DEMO_PROPOSALS = [
  {
    proposal_id: 'p-1',
    officer_id: 'demo-student',
    officer_name: 'Reese Alcala',
    venue_id: 'v-aula',
    venue_name: 'Aula Maria Hall',
    event_title: 'Freshmen Welcome Night',
    event_date: daysFromNow(12),
    start_time: '18:00',
    end_time: '21:00',
    purpose: 'Welcome social for incoming freshmen, hosted by the Student Council.',
    estimated_attendance: 350,
    budget_estimate: 15000,
    status: 'Pending',
    date_submitted: daysFromNow(-2),
    approved_roles: ['dept_head'],
  },
  {
    proposal_id: 'p-2',
    officer_id: 'demo-student',
    officer_name: 'Reese Alcala',
    venue_id: 'v-tonus',
    venue_name: 'Tonus Gymnasium',
    event_title: 'Intramurals Opening Ceremony',
    event_date: daysFromNow(20),
    start_time: '08:00',
    end_time: '12:00',
    purpose: 'Opening program and parade of athletes for the annual intramurals.',
    estimated_attendance: 900,
    budget_estimate: 40000,
    status: 'Needs Revision',
    date_submitted: daysFromNow(-5),
    revision_remarks: 'Please add a crowd/medical safety plan given the attendance size.',
    approved_roles: [],
  },
  {
    proposal_id: 'p-3',
    officer_id: 'demo-student',
    officer_name: 'Reese Alcala',
    venue_id: 'v-avr1',
    venue_name: 'AVR1',
    event_title: 'Thesis Writing Workshop',
    event_date: daysFromNow(6),
    start_time: '13:00',
    end_time: '16:00',
    purpose: 'Skills workshop for graduating students, run by the Research Office.',
    estimated_attendance: 45,
    budget_estimate: 3000,
    status: 'Approved',
    date_submitted: daysFromNow(-9),
    approved_roles: ['dept_head', 'school_admin', 'facilities'],
  },
  {
    proposal_id: 'p-4',
    officer_id: 'demo-student',
    officer_name: 'Reese Alcala',
    venue_id: 'v-rt202',
    venue_name: 'RT202',
    event_title: 'Org Officer Elections',
    event_date: daysFromNow(-3),
    start_time: '09:00',
    end_time: '11:00',
    purpose: 'Annual officer elections for the Computer Science Society.',
    estimated_attendance: 55,
    budget_estimate: 1000,
    status: 'Rejected',
    date_submitted: daysFromNow(-15),
    approved_roles: [],
  },
]

export const INITIAL_DEMO_NOTIFICATIONS = [
  { notification_id: 'n-1', recipient_id: 'demo-student', message: "Your proposal 'Intramurals Opening Ceremony' needs revision. Remarks: Please add a crowd/medical safety plan given the attendance size.", date_sent: daysFromNow(-4), read_status: 'Unread' },
  { notification_id: 'n-2', recipient_id: 'demo-student', message: "Your proposal 'Thesis Writing Workshop' has been fully approved.", date_sent: daysFromNow(-8), read_status: 'Read' },
  { notification_id: 'n-3', recipient_id: 'demo-dept-head', message: "New proposal 'Freshmen Welcome Night' is awaiting review.", date_sent: daysFromNow(-2), read_status: 'Unread' },
  { notification_id: 'n-4', recipient_id: 'demo-school-admin', message: "New proposal 'Freshmen Welcome Night' is awaiting review.", date_sent: daysFromNow(-2), read_status: 'Unread' },
  { notification_id: 'n-5', recipient_id: 'demo-facilities', message: "New proposal 'Freshmen Welcome Night' is awaiting review.", date_sent: daysFromNow(-2), read_status: 'Unread' },
]
