import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/MainPage';
import ContractVerificationApp from './pages/ContractVerificationApp';
import HomePage from './pages/Home';
import History from './pages/History';
import {Web3Provider} from "./contexts/Web3Context";

function App() {
  return (
    <Web3Provider>
      <Router>
        <div className="min-h-screen bg-gray-900 text-white grid-pattern">
          <div className="fixed inset-0 bg-gradient-to-br from-blue-900/20 to-purple-900/20 pointer-events-none" />
          <Navbar />
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/transfer" element={<Home />} />
            <Route path="/history" element={<History />} />
            <Route path="/Bonus" element={<ContractVerificationApp />} />
          </Routes>
          <Footer />
        </div>
      </Router>
  </Web3Provider>
  );
}

export default App;
