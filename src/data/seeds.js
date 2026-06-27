import { nanoid } from '../utils/nanoid'

export function seedDefaultData() {
  const goals = [
    { id: nanoid(), name: 'Feature Development', color: '#01696f', description: 'New product features' },
    { id: nanoid(), name: 'Bug Fixes', color: '#da7101', description: 'Bug resolution work' },
    { id: nanoid(), name: 'Code Review', color: '#006494', description: 'Review and feedback' },
    { id: nanoid(), name: 'Documentation', color: '#7a39bb', description: 'Writing docs' },
    { id: nanoid(), name: 'Testing & QA', color: '#437a22', description: 'Quality assurance' },
  ]

  const associates = [
    { id: nanoid(), name: 'Rahul Sharma', employeeId: 'EMP001', team: 'Frontend', status: 'active' },
    { id: nanoid(), name: 'Priya Nair', employeeId: 'EMP002', team: 'Backend', status: 'active' },
    { id: nanoid(), name: 'Arjun Patel', employeeId: 'EMP003', team: 'Frontend', status: 'active' },
    { id: nanoid(), name: 'Sneha Reddy', employeeId: 'EMP004', team: 'QA', status: 'active' },
    { id: nanoid(), name: 'Kiran Mehta', employeeId: 'EMP005', team: 'Backend', status: 'active' },
    { id: nanoid(), name: 'Divya Singh', employeeId: 'EMP006', team: 'DevOps', status: 'active' },
    { id: nanoid(), name: 'Vikram Iyer', employeeId: 'EMP007', team: 'Frontend', status: 'active' },
    { id: nanoid(), name: 'Ananya Das', employeeId: 'EMP008', team: 'Backend', status: 'active' },
    { id: nanoid(), name: 'Ravi Kumar', employeeId: 'EMP009', team: 'QA', status: 'active' },
    { id: nanoid(), name: 'Meera Joshi', employeeId: 'EMP010', team: 'DevOps', status: 'active' },
  ]

  const standups = []

  return { associates, goals, standups }
}