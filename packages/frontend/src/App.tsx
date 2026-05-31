import { BrowserRouter, Routes, Route } from 'react-router-dom';
import LobbyPage from './pages/Lobby/LobbyPage';
import GamePage from './pages/Game/GamePage';
import GameTestPage from './pages/Game/GameTestPage';
import AdminPage from './pages/Admin/AdminPage';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LobbyPage />} />
        <Route path="/game/test" element={<GameTestPage />} />
        <Route path="/game/:id" element={<GamePage />} />
        <Route path="/admin/*" element={<AdminPage />} />
      </Routes>
    </BrowserRouter>
  );
}
