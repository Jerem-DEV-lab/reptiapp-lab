import { Navigate, Route, Routes } from 'react-router-dom'
import { RequireActing, Shell } from './Shell'
import { AccountsPage } from './pages/AccountsPage'
import { LoginPage } from './pages/LoginPage'
import { OverviewPage } from './pages/OverviewPage'
import { SeedPage } from './pages/SeedPage'
import { SensorsPage } from './pages/SensorsPage'

export function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route element={<Shell />}>
        <Route path="/comptes" element={<AccountsPage />} />
        <Route element={<RequireActing />}>
          <Route path="/compte" element={<OverviewPage />} />
          <Route path="/jeu" element={<SeedPage />} />
          <Route path="/capteurs" element={<SensorsPage />} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/comptes" replace />} />
    </Routes>
  )
}
