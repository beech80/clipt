import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '@/contexts/AuthContext';
import { ReportDialogProvider } from '@/components/report/ReportDialogProvider';
import { Toaster } from 'sonner';
import { Routes, Route } from 'react-router-dom';
import { authRoutes } from '@/config/routes/authRoutes';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ReportDialogProvider>
          <Routes>
            {authRoutes.map((route) => (
              <Route
                key={route.path}
                path={`/${route.path}`}
                element={route.element}
              />
            ))}
          </Routes>
          <Toaster position="top-center" />
        </ReportDialogProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;