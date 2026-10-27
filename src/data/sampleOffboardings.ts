import { OffboardingRecord } from '../types/offboarding';
import { DEFAULT_CHECKLIST_SECTIONS } from './defaultChecklist';

// Helper to deep clone checklist
function cloneChecklist() {
  return JSON.parse(JSON.stringify(DEFAULT_CHECKLIST_SECTIONS));
}

// Generate realistic mock offboardings
export const SAMPLE_OFFBOARDINGS: OffboardingRecord[] = [
  {
    id: 'offboard-001',
    employeeName: 'Kasun Wickramasinghe',
    employeeEmail: 'kasun.w@mycompany.com',
    department: 'IT',
    lastWorkingDay: '2026-10-15', // Past date -> OVERDUE!
    manager: 'Dinesh Perera (VP of Eng)',
    assignedItPerson: 'Saman IT Admin',
    status: 'in_progress',
    notes: 'Senior DevOps Engineer with access to AWS roots, Cloudflare, and Kubernetes clusters. Make sure to revoke root access first.',
    checklist: (() => {
      const list = cloneChecklist();
      // Tick some items
      list[0].items[0].completed = true;
      list[0].items[0].completedBy = 'it.admin@mycompany.com';
      list[0].items[0].completedAt = '2026-10-15T10:30:00Z';
      list[0].items[1].completed = true;
      list[0].items[1].completedBy = 'it.admin@mycompany.com';
      list[0].items[1].completedAt = '2026-10-15T10:32:00Z';
      list[0].items[2].completed = true;
      list[0].items[2].completedBy = 'it.admin@mycompany.com';
      list[0].items[2].completedAt = '2026-10-15T10:35:00Z';
      list[1].items[0].completed = true;
      list[1].items[0].completedBy = 'it.admin@mycompany.com';
      list[1].items[0].completedAt = '2026-10-16T09:00:00Z';
      list[1].items[0].note = 'Dell Latitude laptop & Samsung Galaxy Android phone collected with chargers, no physical damage';
      return list;
    })(),
    vault: {
      items: [
        {
          id: 'cred-sample-1',
          title: 'Dell Latitude 5520 - OS BitLocker Key',
          credentialType: 'bitlocker',
          deviceName: 'Dell Latitude 5520',
          serialNumber: '8FK92X3',
          secretValue: '482910-384729-102948-573820-192847-582910-482910-394821',
          notes: 'Drive C: OS Volume. Key ID: 3C49DF10-A821-4E80',
          createdAt: '2026-10-15T10:35:00Z',
        },
        {
          id: 'cred-sample-2',
          title: 'Temporary Local Administrator Password',
          credentialType: 'local_admin',
          deviceName: 'Dell Latitude 5520',
          serialNumber: '8FK92X3',
          secretValue: 'Adm!n#Corp2026$Lk',
          notes: 'Username: .\\localadmin (use before domain leave / format)',
          createdAt: '2026-10-15T10:36:00Z',
        },
      ],
      updatedAt: '2026-10-15T10:36:00Z',
    },
    createdAt: '2026-10-10T08:00:00Z',
    updatedAt: '2026-10-16T09:15:00Z',
    createdBy: 'it.admin@mycompany.com',
  },
  {
    id: 'offboard-002',
    employeeName: 'Nadeesha Senaratne',
    employeeEmail: 'nadeesha.s@mycompany.com',
    department: 'Digital Marketing (DM)',
    lastWorkingDay: '2026-10-28', // Upcoming date
    manager: 'Amanda Silva (CMO)',
    assignedItPerson: 'Nimal Jayawardena',
    status: 'not_started',
    notes: 'Handles company LinkedIn, Instagram, and HubSpot CRM. Needs smooth transition of social accounts to Nuwan.',
    checklist: cloneChecklist(),
    createdAt: '2026-10-20T11:00:00Z',
    updatedAt: '2026-10-20T11:00:00Z',
    createdBy: 'it.admin@mycompany.com',
  },
  {
    id: 'offboard-003',
    employeeName: 'Ruwan Fernando',
    employeeEmail: 'ruwan.f@mycompany.com',
    department: 'Admin & Finance',
    lastWorkingDay: '2026-10-05',
    manager: 'Kolitha De Silva (CFO)',
    assignedItPerson: 'Saman IT Admin',
    status: 'completed',
    notes: 'All financial portals, bank tokens, and accounting ERP seats successfully reassigned. BitLocker key backed up to secure archive.',
    checklist: (() => {
      const list = cloneChecklist();
      // Tick all items
      list.forEach((sec: any) => {
        sec.items.forEach((it: any) => {
          it.completed = true;
          it.completedBy = 'it.admin@mycompany.com';
          it.completedAt = '2026-10-06T15:00:00Z';
        });
      });
      return list;
    })(),
    createdAt: '2026-09-25T09:00:00Z',
    updatedAt: '2026-10-06T15:30:00Z',
    createdBy: 'it.admin@mycompany.com',
  },
];
