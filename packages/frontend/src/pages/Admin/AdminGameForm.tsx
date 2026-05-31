import { useState, useEffect, useRef, type FormEvent, type DragEvent } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { fetchGame, fetchCreateGame, fetchUpdateGame, fetchUploadRom, fetchUploadCover, fetchDeleteCover, PLATFORM_LABELS, assetUrl, type Game } from '../../api/games';

const PLATFORMS = Object.keys(PLATFORM_LABELS);

const START_YEAR = 1972;
const YEARS: number[] = [];
for (let y = new Date().getFullYear(); y >= START_YEAR; y--) YEARS.push(y);

const emptyForm = {
  title_zh: '',
  title_en: '',
  platform: 'nes',
  release_year: '',
  publisher: '',
  tags: '',
  cover_url: '',
  rom_path: '',
  core_type: '',
};

export default function AdminGameForm() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEdit = !!id;
  const romInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState('');
  const [dragRom, setDragRom] = useState(false);
  const [dragCover, setDragCover] = useState(false);

  const [romFile, setRomFile] = useState<File | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [romProgress, setRomProgress] = useState(-1);
  const [coverProgress, setCoverProgress] = useState(-1);

  useEffect(() => {
    if (!id) return;
    fetchGame(parseInt(id))
      .then((g) => setForm({
        title_zh: g.title_zh ?? '',
        title_en: g.title_en,
        platform: g.platform,
        release_year: g.release_year?.toString() ?? '',
        publisher: g.publisher ?? '',
        tags: g.tags.join(', '),
        cover_url: g.cover_url ?? '',
        rom_path: g.rom_path,
        core_type: g.core_type,
      }))
      .catch((err) => setError('加载游戏失败: ' + String(err)));
  }, [id]);

  useEffect(() => {
    return () => {
      if (coverPreview) URL.revokeObjectURL(coverPreview);
    };
  }, [coverPreview]);

  const set = (key: string) => (e: { target: { value: string } }) => {
    setForm((prev) => ({ ...prev, [key]: e.target.value }));
  };

  const handleRomFile = () => {
    const file = romInputRef.current?.files?.[0];
    if (!file) return;
    setRomFile(file);
  };

  const handleCoverFile = () => {
    const file = coverInputRef.current?.files?.[0];
    if (!file) return;
    if (coverPreview) URL.revokeObjectURL(coverPreview);
    setCoverFile(file);
    setCoverPreview(URL.createObjectURL(file));
  };

  const handleDeleteCover = async () => {
    if (coverPreview) {
      URL.revokeObjectURL(coverPreview);
      setCoverPreview(null);
    }
    setCoverFile(null);
    if (form.cover_url) {
      const filename = form.cover_url.startsWith('uploads/') ? form.cover_url.slice('uploads/'.length) : form.cover_url;
      setUploading('封面删除中...');
      try {
        await fetchDeleteCover(filename);
        setForm((prev) => ({ ...prev, cover_url: '' }));
        setUploading('');
      } catch (err) {
        setUploading('封面删除失败: ' + String(err));
      }
    }
  };

  const handleDrop = (ref: React.RefObject<HTMLInputElement | null>, setDrag: (v: boolean) => void, fileHandler: () => void) => (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDrag(false);
    const file = e.dataTransfer.files?.[0];
    if (!file || !ref.current) return;
    const dt = new DataTransfer();
    dt.items.add(file);
    ref.current.files = dt.files;
    fileHandler();
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!form.title_en.trim()) {
      setError('英文名称为必填项');
      return;
    }
    setSaving(true);
    setError('');
    try {
      let romPath = form.rom_path;
      if (romFile) {
        setRomProgress(0);
        const result = await fetchUploadRom(romFile, form.platform, setRomProgress);
        romPath = result.path;
      }

      let coverUrl = form.cover_url;
      if (coverFile) {
        setCoverProgress(0);
        const result = await fetchUploadCover(coverFile, setCoverProgress);
        coverUrl = result.path;
        if (coverPreview) {
          URL.revokeObjectURL(coverPreview);
          setCoverPreview(null);
        }
      }

      const data: Partial<Game> = {
        title_zh: form.title_zh.trim() || null,
        title_en: form.title_en.trim(),
        platform: form.platform,
        release_year: form.release_year ? parseInt(form.release_year) : null,
        publisher: form.publisher.trim() || null,
        tags: form.tags.split(/[,，]/).map((t) => t.trim()).filter(Boolean),
        cover_url: coverUrl.trim() || null,
        rom_path: romPath.trim(),
        core_type: form.core_type.trim(),
      };
      if (isEdit) {
        await fetchUpdateGame(parseInt(id!), data);
      } else {
        await fetchCreateGame(data);
      }
      navigate('/admin');
    } catch (err) {
      setError('保存失败: ' + String(err));
    } finally {
      setSaving(false);
      setUploading('');
      setRomProgress(-1);
      setCoverProgress(-1);
    }
  };

  if (id && !form.title_en && !error) {
    return <p className="admin__loading">Loading...</p>;
  }

  const displayRomPath = romFile ? romFile.name : form.rom_path;
  const displayCoverUrl = coverPreview ? coverPreview : assetUrl(form.cover_url);

  return (
    <div className="admin-form-wrapper">
      <h3>{isEdit ? '编辑游戏' : '新增游戏'}</h3>
      {error && <p className="admin__error">{error}</p>}
      {uploading && <p className="admin__upload-status">{uploading}</p>}
      {romProgress >= 0 && (
        <div className="admin__upload-progress">
          <span>ROM: {romProgress}%</span>
          <progress value={romProgress} max={100} />
        </div>
      )}
      {coverProgress >= 0 && (
        <div className="admin__upload-progress">
          <span>封面: {coverProgress}%</span>
          <progress value={coverProgress} max={100} />
        </div>
      )}

      <form className="admin-form" onSubmit={handleSubmit}>
        <div className="admin-form__body">
          <div className="admin-form__main">
            <div className="admin-form__row">
              <label>
                中文名
                <input value={form.title_zh} onChange={set('title_zh')} placeholder="可选" />
              </label>
              <label>
                <span>英文名 <span className="required">*</span></span>
                <input value={form.title_en} onChange={set('title_en')} placeholder="必填" required />
              </label>
            </div>

            <div className="admin-form__row">
              <label>
                平台
                <select value={form.platform} onChange={set('platform')}>
                  {PLATFORMS.map((p) => (
                    <option key={p} value={p}>{PLATFORM_LABELS[p]}</option>
                  ))}
                </select>
              </label>
              <label>
                发行年份
                <select value={form.release_year} onChange={set('release_year')}>
                  <option value="">不限</option>
                  {YEARS.map((y) => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </label>
            </div>

            <div className="admin-form__row">
              <label>
                发行商
                <input value={form.publisher} onChange={set('publisher')} placeholder="Nintendo" />
              </label>
            </div>

            <label>
              标签（逗号分隔）
              <input value={form.tags} onChange={set('tags')} placeholder="动作, 平台跳跃" />
            </label>

            <div className="admin-form__field">
              <span className="admin-form__label-text">ROM 文件</span>
              <div
                className={`admin-form__drop-zone${dragRom ? ' admin-form__drop-zone--drag' : ''}${displayRomPath ? ' admin-form__drop-zone--done' : ''}`}
                onDragOver={(e) => { e.preventDefault(); setDragRom(true); }}
                onDragLeave={() => setDragRom(false)}
                onDrop={handleDrop(romInputRef, setDragRom, handleRomFile)}
                onClick={(e) => { e.stopPropagation(); romInputRef.current?.click(); }}
              >
                <input type="file" ref={romInputRef} onChange={handleRomFile} style={{ display: 'none' }} />
                <span className="admin-form__drop-icon">📁</span>
                <span className="admin-form__drop-text">
                  {displayRomPath || '拖拽 ROM 文件到此处'}
                </span>
                <span className="admin-form__drop-hint">或点击选择文件</span>
                {dragRom && <div className="admin-form__drop-overlay" />}
              </div>
            </div>
          </div>

          <div className="admin-form__sidebar">
            <div className="admin-form__field">
              <span className="admin-form__label-text">封面图片</span>
              <div
                className={`admin-form__drop-zone admin-form__drop-zone--cover${dragCover ? ' admin-form__drop-zone--drag' : ''}${displayCoverUrl ? ' admin-form__drop-zone--done' : ''}`}
                onDragOver={(e) => { e.preventDefault(); setDragCover(true); }}
                onDragLeave={() => setDragCover(false)}
                onDrop={handleDrop(coverInputRef, setDragCover, handleCoverFile)}
                onClick={(e) => { e.stopPropagation(); coverInputRef.current?.click(); }}
              >
                <input type="file" ref={coverInputRef} accept="image/*" onChange={handleCoverFile} style={{ display: 'none' }} />
                {displayCoverUrl ? (
                  <img src={displayCoverUrl} alt="封面预览" className="admin-form__cover-thumb" />
                ) : (
                  <>
                    <span className="admin-form__drop-icon">🖼️</span>
                    <span className="admin-form__drop-text">拖拽封面图片</span>
                    <span className="admin-form__drop-hint">或点击选择图片</span>
                  </>
                )}
                {dragCover && <div className="admin-form__drop-overlay" />}
              </div>
              {(coverFile || form.cover_url) && (
                <button type="button" className="admin-form__delete-cover" onClick={handleDeleteCover}>
                  删除封面
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="admin-form__buttons">
          <button type="submit" className="admin__btn admin__btn--primary" disabled={saving}>
            {saving ? '保存中...' : '保存'}
          </button>
          <button type="button" className="admin__btn" onClick={() => navigate('/admin')}>
            取消
          </button>
        </div>
      </form>
    </div>
  );
}
