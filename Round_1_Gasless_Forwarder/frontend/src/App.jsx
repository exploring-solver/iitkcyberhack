import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Transactions from './pages/Transactions';
import Settings from './pages/Settings';
import { Web3Provider } from './context/Web3Context';
import Instructions from './components/Instructions';
import { LeaderboardPage } from './components/Leaderboard';
import { FAQPage } from './components/FAQPage';

const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#90caf9',
    },
    secondary: {
      main: '#f48fb1',
    },
    background: {
      default: '#121212',
      paper: '#1e1e1e',
    },
  },
});

function App() {
  return (
    <Web3Provider>
      <ThemeProvider theme={darkTheme}>
        <CssBaseline />
        <Router>
          <Layout>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/transactions" element={<Transactions />} />
              <Route path="/instructions" element={<Instructions />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/leaderboard" element={<LeaderboardPage />} />
              <Route path="/faq" element={<FAQPage />} />
            </Routes>
          </Layout>
        </Router>
      </ThemeProvider>
    </Web3Provider>
  );
}

export default App; 