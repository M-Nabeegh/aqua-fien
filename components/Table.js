export default function Table({ columns = [], data = [] }) {
  return (
    <div className="overflow-x-auto bg-white rounded-lg shadow">
      <table className="min-w-full text-sm">
        <thead className="bg-gray-100 text-gray-700">
          <tr>
            {columns.map((c, i) => (
              <th key={i} className="px-3 py-2 text-left font-medium">{c}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, i) => (
            <tr key={i} className="border-t">
              {columns.map((c, j) => (
                <td key={j} className="px-3 py-2">{row[c]}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
