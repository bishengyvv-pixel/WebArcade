import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchGames, fetchDeleteGame, fetchScanRoms, PLATFORM_LABELS, type Game, type ScanResult } from '../../api/games';

export default function AdminGameList() {
  const navigate = useNavigate();
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback((p: number) => {
    setLoading(true);
    setError('');
    fetchGames({ page: p, pageSize: 50, sort: 'title' })
      .then((data) => {
        setGames(data.items);
        setTotal(data.total);
      })
      .catch((err) => setError(String(err)))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(page); }, [page, load]);

  const handleDelete = async (game: Game) => {
    const title = game.title_zh || game.title_en;
    if (!confirm(`确定要删除「${title}」吗？`)) return;
    try {
      await fetchDeleteGame(game.id);
      if (games.length === 1 && page > 1) {
        setPage(page - 1);
      } else {
        load(page);
      }
    } catch (err) {
      alert('删除失败: ' + String(err));
    }
  };

  const handleScan = async () => {
    setScanning(true);
    setScanResult(null);
    try {
      const result = await fetchScanRoms();
      setScanResult(result);
      load(page);
    } catch (err) {
      alert('扫描失败: ' + String(err));
    } finally {
      setScanning(false);
    }
  };

  return (
    <div>
      <div className="admin__actions">
        <button className="admin__btn admin__btn--primary" onClick={() => navigate('/admin/games/new')}>
          + 新增游戏
        </button>
        <button className="admin__btn" onClick={handleScan} disabled={scanning}>
          {scanning ? '扫描中...' : '扫描 ROM 目录'}
        </button>
      </div>

      {scanResult && (
        <div className="admin__scan-result">
          扫描完成：发现 {scanResult.found} 个文件，新增 {scanResult.added} 个，跳过 {scanResult.skipped} 个
          <button className="admin__scan-close" onClick={() => setScanResult(null)}>✕</button>
        </div>
      )}

      {error && <p className="admin__error">{error}</p>}

      {loading ? (
        <p className="admin__loading">加载中...</p>
      ) : (
        <>
          <table className="admin__table">
            <thead>
              <tr>
                <th>ID</th>
                <th>名称</th>
                <th>平台</th>
                <th>ROM 路径</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {games.map((g) => (
                <tr key={g.id}>
                  <td>{g.id}</td>
                  <td>{g.title_zh || g.title_en}</td>
                  <td>{PLATFORM_LABELS[g.platform] ?? g.platform}</td>
                  <td className="admin__rom-path">{g.rom_path}</td>
                  <td className="admin__table-actions">
                    <button onClick={() => navigate(`/admin/games/${g.id}/edit`)}>编辑</button>
                    <button className="danger" onClick={() => handleDelete(g)}>删除</button>
                  </td>
                </tr>
              ))}
              {games.length === 0 && (
                <tr><td colSpan={5} className="admin__empty">暂无游戏</td></tr>
              )}
            </tbody>
          </table>

          {total > 50 && (
            <div className="pagination" style={{ marginTop: 16 }}>
              <button disabled={page <= 1} onClick={() => setPage(page - 1)}>上一页</button>
              <span>第 {page} 页</span>
              <button disabled={page * 50 >= total} onClick={() => setPage(page + 1)}>下一页</button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
