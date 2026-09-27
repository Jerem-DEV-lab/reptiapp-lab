import { Navigate, Route, Routes } from 'react-router-dom'
import { RequireActing, Shell } from './Shell'
import { AccountsPage } from './pages/AccountsPage'
import { ContactsPage } from './pages/ContactsPage'
import { LoginPage } from './pages/LoginPage'
import { OverviewPage } from './pages/OverviewPage'
import { SeedLayout } from './pages/SeedLayout'
import { EntityPage, SeedHubPage } from './pages/SeedPages'
import { SensorsPage } from './pages/SensorsPage'

export function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route element={<Shell />}>
        <Route path="/comptes" element={<AccountsPage />} />
        <Route path="/contacts" element={<ContactsPage />} />
        <Route element={<RequireActing />}>
          <Route path="/compte" element={<OverviewPage />} />
          <Route path="/jeu" element={<SeedLayout />}>
            <Route index element={<SeedHubPage />} />
            <Route path=":entity" element={<EntityPage />} />
          </Route>
          <Route path="/capteurs" element={<SensorsPage />} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/comptes" replace />} />
    </Routes>
  )
}
