import type { TagInfo } from '../api/games';

interface Props {
  tags: TagInfo[];
  selected: string;
  onChange: (tag: string) => void;
}

export default function TagFilter({ tags, selected, onChange }: Props) {
  return (
    <div className="tag-filter">
      {tags.map((t) => (
        <button
          key={t.tag}
          className={`tag-filter__btn ${selected === t.tag ? 'active' : ''}`}
          onClick={() => onChange(selected === t.tag ? '' : t.tag)}
        >
          {t.tag}
          <span className="tag-filter__count">{t.count}</span>
        </button>
      ))}
    </div>
  );
}
