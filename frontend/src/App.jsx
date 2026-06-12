import { Route, Routes } from 'react-router-dom'
import TopNav from './components/TopNav'
import { analyzeProtocol } from './lib/analyze'
import AdminPage from './pages/AdminPage'
import AnalyzePage from './pages/AnalyzePage'
import ParametersPage from './pages/ParametersPage'
import ResultsPage from './pages/ResultsPage'
import SearchPage from './pages/SearchPage'

export default function App() {
  return (
    <div className="flex min-h-screen flex-col">
      <TopNav />
      <Routes>
        <Route path="/admin" element={<AdminPage />} />
        <Route path="/" element={<AnalyzePage onSubmit={analyzeProtocol} />} />
        <Route path="/parameters" element={<ParametersPage />} />
        <Route path="/resultados" element={<ResultsPage />} />
        <Route path="/buscar" element={<SearchPage />} />
      </Routes>
    </div>
  )
}
