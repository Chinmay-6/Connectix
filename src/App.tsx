import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import AdminLogin from './components/AdminLogin';
import AdminDashboard from './components/AdminDashboard';
import ScanRedirect from './components/ScanRedirect';
import { useEffect, useState } from 'react';
import { auth } from './lib/firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import AddPlace from './components/AddPlace';
import QRList from './components/QRList';
import Analytics from './components/Analytics';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center space-y-4">
        <div className="w-10 h-10 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin"></div>
        <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">Initializing Connectix...</div>
      </div>
    );
  }

  return (
    <Router>
      <Routes>
        {/* Public Customer Scan Route */}
        <Route path="/scan/:qrId" element={<ScanRedirect />} />

        {/* Admin Login Route */}
        <Route path="/admin/login" element={!user ? <AdminLogin /> : <Navigate to="/admin/dashboard/list" />} />
        
        {/* Admin Dashboard Protected Routes */}
        <Route path="/admin/dashboard" element={user ? <AdminDashboard /> : <Navigate to="/admin/login" />}>
          <Route path="list" element={<QRList />} />
          <Route path="add" element={<AddPlace />} />
          <Route path="analytics" element={<Analytics />} />
          <Route index element={<Navigate to="list" />} />
        </Route>

        <Route path="*" element={<Navigate to="/admin/login" />} />
      </Routes>
    </Router>
  );
}
