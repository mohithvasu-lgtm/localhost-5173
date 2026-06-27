import { Routes, Route } from 'react-router-dom'
import { AppProvider } from './data/AppContext'
import Layout from './components/Layout'
import NotFound from './pages/NotFound'
import Dashboard from './pages/Dashboard'
import Associates from './pages/Associates'
import Goals from './pages/Goals'
import StandupEntry from './pages/StandupEntry'
import Reports from './pages/Reports'
import MOM from './pages/MOM'
import TasksKanban from './pages/TasksKanban'

const Placeholder = ({ name }) => (
  <div className="flex items-center justify-center h-40">
    <p className="text-ink-muted text-sm">{name} — coming in next step</p>
  </div>
)

export default function App() {
  return (
    <AppProvider>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/standup" element={<StandupEntry />} />
          <Route path="/associates" element={<Associates />} />
          <Route path="/goals" element={<Goals />} />
          <Route path="/tasks" element={<TasksKanban />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/mom" element={<MOM />} />
          <Route path="/settings" element={<Placeholder name="Settings" />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Layout>
    </AppProvider>
  )
}