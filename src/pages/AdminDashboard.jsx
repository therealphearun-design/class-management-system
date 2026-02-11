// =====================================================
// src/pages/AdminDashboard.jsx
// =====================================================
function AdminDashboard() {
  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded shadow">
          <h2 className="text-lg font-semibold">Students</h2>
          <p className="text-2xl">120</p>
        </div>

        <div className="bg-white p-4 rounded shadow">
          <h2 className="text-lg font-semibold">Teachers</h2>
          <p className="text-2xl">12</p>
        </div>

        <div className="bg-white p-4 rounded shadow">
          <h2 className="text-lg font-semibold">Classes</h2>
          <p className="text-2xl">8</p>
        </div>
      </div>
    </div>
  )
}

export default AdminDashboard
