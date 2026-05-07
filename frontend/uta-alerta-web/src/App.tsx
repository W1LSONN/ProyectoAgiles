import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Login from './pages/Login.js';
import Home from './pages/Home.js';
import Guardia from './pages/Guardia.js';
import Admin from './pages/Admin.js';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/"        element={<Login />} />
        <Route path="/login"   element={<Login />} />
        <Route path="/home"    element={<Home />} />
        <Route path="/guardia" element={<Guardia />} />
        <Route path="/admin"   element={<Admin />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
