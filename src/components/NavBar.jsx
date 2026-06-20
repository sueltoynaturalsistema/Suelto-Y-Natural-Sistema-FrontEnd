import { useContext, useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import { getProductos } from "../api/api";

const LINKS = [
  { path: "/productos", label: "Productos" },
  { path: "/categorias", label: "Categorías" },
  { path: "/proveedores", label: "Proveedores" },
  { path: "/ventas", label: "Ventas" },
  { path: "/reportes", label: "Reportes" },
];

const Navbar = () => {
  const { logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();
  const [stockBajo, setStockBajo] = useState([]);

  // Verificamos el stock cada vez que se cambia de ruta
  useEffect(() => {
    const cargarStock = async () => {
      try {
        const response = await getProductos();
        const productos = Array.isArray(response)
          ? response
          : Array.isArray(response?.productos)
          ? response.productos
          : [];

        const productosCriticos = productos.filter(
          (p) => Number(p?.cantidad || 0) < 10
        );

        setStockBajo(productosCriticos);
      } catch (error) {
        console.error("Error cargando stock:", error);
        setStockBajo([]);
      }
    };

    cargarStock();
  }, [location.pathname]);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const linkClass = (path) =>
    `px-3 py-2 rounded-lg text-sm font-semibold transition ${
      location.pathname === path
        ? "bg-emerald-600 text-white shadow-sm"
        : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
    }`;

  return (
    <>
      <nav className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between gap-4">
          {/* MARCA */}
          <div
            onClick={() => navigate("/productos")}
            className="flex items-center gap-2.5 cursor-pointer select-none shrink-0"
          >
            <div className="w-9 h-9 rounded-lg bg-emerald-600 grid place-items-center text-white shadow-sm">
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.52-4.48 10-10 10Z" />
                <path d="M2 21c0-3 1.85-5.36 5.08-6" />
              </svg>
            </div>
            <h1 className="text-base font-black text-slate-900">Dietética</h1>
          </div>
          
          {/* NAVEGACIÓN CENTRAL */}
          <div className="flex items-center gap-1">
            {LINKS.map(({ path, label }) => (
              <div key={path} className="relative">
                <button onClick={() => navigate(path)} className={linkClass(path)}>
                  {label}
                </button>
                {path === "/reportes" && stockBajo.length > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 bg-rose-500 text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] px-1 flex items-center justify-center shadow-sm animate-pulse">
                    {stockBajo.length}
                  </span>
                )}
              </div>
            ))}
          </div>

          {/* USUARIO */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="text-right hidden sm:block leading-none">
              <p className="text-sm font-semibold text-slate-700">Admin</p>
              <p className="text-[11px] text-slate-400 mt-0.5">Sesión activa</p>
            </div>
            <button
              onClick={handleLogout}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-200 px-3 py-1.5 rounded-md transition"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.8}
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
                <path d="M16 17l5-5-5-5" />
                <path d="M21 12H9" />
              </svg>
              Salir
            </button>
          </div>
        </div>
      </nav>

      {/* ALERTA INFERIOR DE STOCK BAJO */}
      {stockBajo.length > 0 && (
        <div className="bg-rose-50 border-b border-rose-200">
          <div className="max-w-7xl mx-auto px-6 py-2 flex items-center justify-between gap-4">
            <p className="inline-flex items-center gap-2 text-sm font-semibold text-rose-700">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
              Hay {stockBajo.length} producto{stockBajo.length !== 1 ? "s" : ""} con stock bajo
            </p>
            <button
              onClick={() => navigate("/reportes")}
              className="text-xs font-semibold text-rose-600 hover:text-rose-800 transition"
            >
              Ver reportes →
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default Navbar;
