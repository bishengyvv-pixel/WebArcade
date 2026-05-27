interface Props {
  value: string;
  onChange: (sort: string) => void;
}

const OPTIONS = [
  { value: '', label: '默认排序' },
  { value: 'title', label: '名称 A-Z' },
  { value: 'year', label: '发行年份' },
];

export default function SortSelect({ value, onChange }: Props) {
  return (
    <select
      className="sort-select"
      value={value}
      onChange={(e) => onChange(e.target.value)}
    >
      {OPTIONS.map((opt) => (
        <option key={opt.value} value={opt.value}>{opt.label}</option>
      ))}
    </select>
  );
}
