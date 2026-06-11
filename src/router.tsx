import { createBrowserRouter } from 'react-router-dom'
import { AppShell } from '@/components/shell/AppShell'
import { Dashboard } from '@/pages/Dashboard'
import { Modules } from '@/pages/Modules'
import { ModuleDetail } from '@/pages/ModuleDetail'
import { FormBuilder } from '@/pages/FormBuilder'
import { ThemePage } from '@/pages/ThemePage'
import { DataPage } from '@/pages/DataPage'
import { ApiExplorer } from '@/pages/ApiExplorer'
import { AuditLog } from '@/pages/AuditLog'

const Stub = ({ name }: { name: string }) => (
  <h1 className="text-2xl font-semibold tracking-tight">{name}</h1>
)

export const router = createBrowserRouter([
  {
    element: <AppShell />,
    children: [
      { path: '/', element: <Dashboard /> },
      { path: '/data', element: <DataPage /> },
      { path: '/data/:moduleId', element: <DataPage /> },
      { path: '/modules', element: <Modules /> },
      { path: '/modules/:moduleId', element: <ModuleDetail /> },
      { path: '/builder', element: <FormBuilder /> },
      { path: '/builder/:moduleId', element: <FormBuilder /> },
      { path: '/theme', element: <ThemePage /> },
      { path: '/api', element: <ApiExplorer /> },
      { path: '/audit', element: <AuditLog /> },
      { path: '/roles', element: <Stub name="Roles" /> },
    ],
  },
])
