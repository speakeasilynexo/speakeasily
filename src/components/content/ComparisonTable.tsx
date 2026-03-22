export interface ComparisonRow {
  feature: string;
  speakeasily: boolean;
  competitor: boolean;
}

interface ComparisonTableProps {
  rows: ComparisonRow[];
  speakEasilyLabel: string;
  othersLabel: string;
  title: string;
}

function renderValue(value: boolean): string {
  return value ? "✓" : "✗";
}

const ComparisonTable = ({ rows, speakEasilyLabel, othersLabel, title }: ComparisonTableProps) => {
  return (
    <section className="mx-auto max-w-5xl px-4 py-16 sm:px-6" aria-labelledby="comparison-title">
      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full border-collapse">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-5 py-4 text-left text-sm font-semibold text-slate-700">{title}</th>
                <th className="px-5 py-4 text-left text-sm font-semibold text-green-700">{speakEasilyLabel}</th>
                <th className="px-5 py-4 text-left text-sm font-semibold text-slate-600">{othersLabel}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.feature} className="border-t border-slate-100">
                  <td className="px-5 py-4 text-sm font-medium text-slate-900">{row.feature}</td>
                  <td className="px-5 py-4 text-sm text-green-600 font-semibold">{renderValue(row.speakeasily)}</td>
                  <td className="px-5 py-4 text-sm text-slate-400">{renderValue(row.competitor)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
};

export default ComparisonTable;
