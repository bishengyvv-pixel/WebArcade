import { useState, useEffect, type FormEvent } from 'react';

interface Props {
  value: string;
  onSearch: (query: string) => void;
}

export default function SearchBar({ value, onSearch }: Props) {
  const [text, setText] = useState(value);

  useEffect(() => {
    setText(value);
  }, [value]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    onSearch(text.trim());
  };

  return (
    <form className="search-bar" onSubmit={handleSubmit}>
      <input
        type="text"
        className="search-bar__input"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="搜索游戏..."
      />
      <button type="submit" className="search-bar__btn">搜索</button>
      {value && (
        <button type="button" className="search-bar__clear" onClick={() => { setText(''); onSearch(''); }}>
          ✕
        </button>
      )}
    </form>
  );
}
