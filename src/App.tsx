import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect, useState, lazy, Suspense } from 'react';
import { auth } from './lib/firebase';
import { onAuthStateChanged, User } from 'firebase/auth';

const AdminLogin = lazy(() => import('./components/AdminLogin'));
const AdminDashboard = lazy(() => import('./components/AdminDashboard'));
const ScanRedirect = lazy(() => import('./components/ScanRedirect'));
const AddPlace = lazy(() => import('./components/AddPlace'));
const QRList = lazy(() => import('./components/QRList'));
const Analytics = lazy(() => import('./components/Analytics'));

const LoadingFallback = () => (
  <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center space-y-4">
    <div className="relative">
      <img src="/conlog.jpeg" alt="TAPHUB Logo" className="h-12 w-auto logo-glow mb-2" />
      <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto"></div>
    </div>
    <div className="text-xs font-bold text-slate-500 uppercase tracking-widest font-mono">Loading TAPHUB...</div>
  </div>
);

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
    return <LoadingFallback />;
  }

  return (
    <Router>
      <Suspense fallback={<LoadingFallback />}>
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
      </Suspense>
    </Router>
  );
}
