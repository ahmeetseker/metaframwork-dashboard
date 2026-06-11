import { createBrowserRouter } from 'react-router-dom'
import { AppShell } from '@/components/shell/AppShell'
import { Dashboard } from '@/pages/Dashboard'
import { Modules } from '@/pages/Modules'
import { ModuleDetail } from '@/pages/ModuleDetail'

const Stub = ({ name }: { name: string }) => (
  <h1 className="text-2xl font-semibold tracking-tight">{name}</h1>
)

export const router = createBrowserRouter([
  {
    element: <AppShell />,
    children: [
      { path: '/', element: <Dashboard /> },
      { path: '/data', element: <Stub name="Data" /> },
      { path: '/data/:moduleId', element: <Stub name="Data" /> },
      { path: '/modules', element: <Modules /> },
      { path: '/modules/:moduleId', element: <ModuleDetail /> },
      { path: '/builder', element: <Stub name="Form builder" /> },
      { path: '/builder/:moduleId', element: <Stub name="Form builder" /> },
      { path: '/theme', element: <Stub name="Theme" /> },
      { path: '/api', element: <Stub name="API explorer" /> },
      { path: '/audit', element: <Stub name="Audit log" /> },
      { path: '/roles', element: <Stub name="Roles" /> },
    ],
  },
])
