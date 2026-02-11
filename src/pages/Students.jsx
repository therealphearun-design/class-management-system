// =====================================================
// src/pages/Students.jsx
// =====================================================
function Students() {
  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <h1 className="text-2xl font-bold mb-4">Students</h1>

      <div className="overflow-x-auto">
        <table className="w-full bg-white shadow rounded">
          <thead className="bg-gray-200">
            <tr>
              <th className="p-3 text-left">ID</th>
              <th className="p-3 text-left">Name</th>
              <th className="p-3 text-left">Class</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-t">
              <td className="p-3">1</td>
              <td className="p-3">John Doe</td>
              <td className="p-3">IT-101</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default Students
