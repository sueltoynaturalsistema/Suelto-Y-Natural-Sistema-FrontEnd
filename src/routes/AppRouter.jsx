import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";

import PrivateRoute from "../components/PrivateRoute";
import Layout from "../components/Layout";

import LoginPage from "../pages/LoginPage"; 
import ProductosPage from "../pages/ProductosPage";
import VentasPage from "../pages/VentasPage";
import ReportesPage from "../pages/ReportesPage";
import CategoriasPage from "../pages/CategoriasPage";
import ProveedoresPage from "../pages/ProveedoresPage";

const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<LoginPage />} />

        <Route path="/productos" element={
          <PrivateRoute>
            <Layout>
              <ProductosPage />
            </Layout>
          </PrivateRoute>
        } />

        <Route path="/categorias" element={
          <PrivateRoute>
            <Layout>
              <CategoriasPage />
            </Layout>
          </PrivateRoute>
        } />

        <Route path="/proveedores" element={
          <PrivateRoute>
            <Layout>
              <ProveedoresPage />
            </Layout>
          </PrivateRoute>
        } />

        <Route path="/ventas" element={
          <PrivateRoute>
            <Layout>
              <VentasPage />
            </Layout>
          </PrivateRoute>
        } />

        <Route path="/reportes" element={
          <PrivateRoute>
            <Layout>
              <ReportesPage />
            </Layout>
          </PrivateRoute>
        } />

        <Route path="*" element={<Navigate to="/productos" replace />} />
      </Routes>
    </Router>
  );
};

export default App;