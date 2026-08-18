import { Routes, Route } from 'react-router-dom'
import { AppProvider } from './data/AppContext'
import Layout from './components/Layout'
import NotFound from './pages/NotFound'
import Home from './pages/Home'
import Dashboard from './pages/Dashboard'
import Associates from './pages/Associates'
import Goals from './pages/Goals'
import StandupEntry from './pages/StandupEntry'
import Reports from './pages/Reports'
import MOM from './pages/MOM'
import TasksKanban from './pages/TasksKanban'
import FmeaTracker from './pages/FmeaTracker'
import DvpTracker from './pages/DvpTracker'
import TaskAnalysis from './pages/TaskAnalysis'
import Notifications from './pages/Notifications'

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
          <Route path="/" element={<Home />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/standup" element={<StandupEntry />} />
          <Route path="/associates" element={<Associates />} />
          <Route path="/goals" element={<Goals />} />
          <Route path="/tasks" element={<TasksKanban />} />
          <Route path="/fmea" element={<FmeaTracker />} />
          <Route path="/dvp" element={<DvpTracker />} />
          <Route path="/task-analysis" element={<TaskAnalysis />} />
          <Route path="/notifications" element={<Notifications />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/mom" element={<MOM />} />
          <Route path="/settings" element={<Placeholder name="Settings" />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Layout>
    </AppProvider>
  )
}