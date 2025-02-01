import { Routes, Route } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import { HomePage } from './pages/HomePage';
import { TransactionsPage } from './pages/TransactionsPage';
import { AuthPage } from './pages/AuthPage';
import { DashboardPage } from './pages/DashboardPage';
import { BatchTransferPage } from './pages/BatchTransferPage';
import { SettingsPage } from './pages/SettingsPage';
import { LeaderboardPage } from './pages/LeaderboardPage';
import { DeveloperPage } from './pages/DeveloperPage';
import { FAQPage } from './pages/FAQPage';
import { Footer } from './components/Footer';

function App() {
  return (
    <div className="min-h-screen bg-gray-900 text-white grid-pattern">
      <div className="fixed inset-0 bg-gradient-to-br from-blue-900/20 to-purple-900/20 pointer-events-none" />
      <Navbar />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/transactions" element={<TransactionsPage />} />
        <Route path="/batch" element={<BatchTransferPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/leaderboard" element={<LeaderboardPage />} />
        <Route path="/developers" element={<DeveloperPage />} />
        <Route path="/faq" element={<FAQPage />} />
        <Route path="/auth" element={<AuthPage />} />
      </Routes>
      <Footer/>
    </div>
  );
}

export default App;