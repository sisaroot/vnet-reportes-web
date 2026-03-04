import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import AsesorView from './pages/AsesorView';
import AdminView from './pages/AdminView';

function App() {
  return (
    <>
      <div className="bg-blob blob-1"></div>
      <div className="bg-blob blob-2"></div>
      
      <Router>
        <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<Login />} />
          <Route path="/asesor" element={<AsesorView />} />
          <Route path="/admin" element={<AdminView />} />
        </Routes>
      </Router>
    </>
  );
}

export default App;
