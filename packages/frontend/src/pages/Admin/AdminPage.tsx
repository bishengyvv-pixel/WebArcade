import { Routes, Route, Link } from 'react-router-dom';
import AdminGameList from './AdminGameList';
import AdminGameForm from './AdminGameForm';

export default function AdminPage() {
  return (
    <div className="admin">
      <header className="admin__header">
        <h2>管理后台</h2>
        <nav className="admin__nav">
          <Link to="/admin">游戏列表</Link>
          <Link to="/admin/games/new">新增游戏</Link>
          <Link to="/">← 返回大厅</Link>
        </nav>
      </header>
      <div className="admin__body">
        <Routes>
          <Route index element={<AdminGameList />} />
          <Route path="games/new" element={<AdminGameForm />} />
          <Route path="games/:id/edit" element={<AdminGameForm />} />
        </Routes>
      </div>
    </div>
  );
}
