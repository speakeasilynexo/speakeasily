export interface ComparisonRow {
  feature: string;
  speakeasily: boolean;
  competitor: boolean;
}

interface ComparisonTableProps {
  rows: ComparisonRow[];
}

function renderValue(value: boolean): string {
  return value ? "Sí" : "No";
}

const ComparisonTable = ({ rows }: ComparisonTableProps) => {
  return (
    <section className="mx-auto max-w-5xl px-4 py-16 sm:px-6" aria-labelledby="comparison-title">
      <div className="mb-8 max-w-2xl">
        <h2 id="comparison-title" className="text-3xl font-semibold tracking-tight text-slate-900">
          SpeakEasily frente a otras opciones
        </h2>
        <p className="mt-3 text-base leading-7 text-slate-600">
          Si buscas una opción práctica para aprender inglés, comparar formatos te ayuda a ver qué encaja mejor contigo.
        </p>
      </div>
      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
        <table className="min-w-full border-collapse">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-5 py-4 text-left text-sm font-semibold text-slate-700">Característica</th>
              <th className="px-5 py-4 text-left text-sm font-semibold text-green-700">SpeakEasily</th>
              <th className="px-5 py-4 text-left text-sm font-semibold text-slate-600">Duolingo / academias / apps</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.feature} className="border-t border-slate-100">
                <td className="px-5 py-4 text-sm font-medium text-slate-900">{row.feature}</td>
                <td className="px-5 py-4 text-sm text-slate-700">{renderValue(row.speakeasily)}</td>
                <td className="px-5 py-4 text-sm text-slate-700">{renderValue(row.competitor)}</td>
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
