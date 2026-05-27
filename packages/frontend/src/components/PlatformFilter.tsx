import { PLATFORM_LABELS, type PlatformInfo } from '../api/games';

interface Props {
  platforms: PlatformInfo[];
  selected: string;
  onChange: (platform: string) => void;
}

export default function PlatformFilter({ platforms, selected, onChange }: Props) {
  return (
    <div className="platform-filter">
      <button
        className={`platform-filter__btn ${selected === '' ? 'active' : ''}`}
        onClick={() => onChange('')}
      >
        全部
      </button>
      {platforms.map((p) => (
        <button
          key={p.platform}
          className={`platform-filter__btn ${selected === p.platform ? 'active' : ''}`}
          onClick={() => onChange(p.platform)}
        >
          {PLATFORM_LABELS[p.platform] ?? p.platform}
          <span className="platform-filter__count">{p.count}</span>
        </button>
      ))}
    </div>
  );
}
