import { useState, useEffect, useCallback } from "react";
import ProveedorForm from "../components/ProveedorForm";
import { getProveedores, guardarProveedor, eliminarProveedor, getProductos } from "../api/api";

/* ---------- Iconos ---------- */
const Icon = ({ d, className = "h-5 w-5" }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={1.8}
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    {Array.isArray(d) ? d.map((p, i) => <path key={i} d={p} />) : <path d={d} />}
  </svg>
);

const ICONS = {
  search: "M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z",
  plus: ["M12 5v14", "M5 12h14"],
  edit: ["M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5", "M18.5 3.5a2 2 0 012.8 2.8L12 15.6 8 17l1.4-4z"],
  trash: ["M4 7h16", "M9 7V4a1 1 0 011-1h4a1 1 0 011 1v3", "M19 7l-.9 12a2 2 0 01-2 1.9H7.9a2 2 0 01-2-1.9L5 7", "M10 11v6", "M14 11v6"],
  truck: ["M3 7a1 1 0 011-1h9a1 1 0 011 1v8H3z", "M14 9h3.5l2.5 3v3H14z", "M7.5 18.5a1.5 1.5 0 100-3 1.5 1.5 0 000 3z", "M17.5 18.5a1.5 1.5 0 100-3 1.5 1.5 0 000 3z"],
  box: ["M21 16V8a2 2 0 00-1-1.7l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.7l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z", "M3.3 7L12 12l8.7-5", "M12 22V12"],
  mail: ["M4 6h16a1 1 0 011 1v10a1 1 0 01-1 1H4a1 1 0 01-1-1V7a1 1 0 011-1z", "M4 7l8 6 8-6"],
  phone: "M5 4h3l2 5-2 1a11 11 0 005 5l1-2 5 2v3a1 1 0 01-1 1A15 15 0 014 5a1 1 0 011-1z",
};

const Kpi = ({ label, value, sub, accent, icon }) => (
  <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-shadow">
    <div className="flex items-start justify-between">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">{label}</p>
        <p className="mt-2 text-3xl font-black text-slate-900 leading-none tabular-nums">{value}</p>
        {sub && <p className="mt-2 text-xs text-slate-500">{sub}</p>}
      </div>
      <div className={`w-10 h-10 rounded-lg grid place-items-center ${accent}`}>
        <Icon d={ICONS[icon]} className="w-5 h-5" />
      </div>
    </div>
  </div>
);

const ProveedoresPage = () => {
  const [proveedores, setProveedores] = useState([]);
  const [productos, setProductos] = useState([]);
  const [busqueda, setBusqueda] = useState("");
  const [mostrarModal, setMostrarModal] = useState(false);
  const [proveedorAEditar, setProveedorAEditar] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchDatos = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const [dataProvs, dataProds] = await Promise.all([getProveedores(), getProductos()]);
      setProveedores(Array.isArray(dataProvs) ? dataProvs : []);
      setProductos(Array.isArray(dataProds) ? dataProds : []);
    } catch (err) {
      console.error(err);
      setError("No se pudieron cargar los proveedores");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDatos();
  }, [fetchDatos]);

  const contarProductos = (provId) =>
    productos.filter((p) => String(p.proveedorId || p.proveedor?.id) === String(provId)).length;

  const handleSave = async (proveedor) => {
    try {
      const proveedorCorregido = {
        id: proveedor.id || "",
        nombre: proveedor.nombre?.trim() || "",
        mail: proveedor.mail?.trim() || "",
        nroTelefono: proveedor.nroTelefono?.trim() || "",
      };

      if (!proveedorCorregido.nombre) {
        return alert("El nombre es obligatorio");
      }

      if (
        proveedorCorregido.mail &&
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(proveedorCorregido.mail)
      ) {
        return alert("El formato del mail es inválido");
      }

      await guardarProveedor(proveedorCorregido);
      await fetchDatos();
      setMostrarModal(false);
      setProveedorAEditar(null);
    } catch (err) {
      console.error(err);
      alert(
        err.response?.data?.message || err.message || "Error al guardar el proveedor"
      );
    }
  };

  const handleDelete = async (id) => {
    const usos = contarProductos(id);
    const msg = usos > 0
      ? `Este proveedor abastece ${usos} producto(s). ¿Eliminarlo de todos modos?`
      : "¿Estás seguro de eliminar este proveedor?";
    if (!window.confirm(msg)) return;
    try {
      await eliminarProveedor(id);
      await fetchDatos();
    } catch (err) {
      console.error(err);
      alert("No se pudo eliminar el proveedor");
    }
  };

  const proveedoresFiltrados = proveedores.filter((p) =>
    (p.nombre || "").toLowerCase().includes(busqueda.toLowerCase())
  );

  const conProductos = proveedores.filter((p) => contarProductos(p.id) > 0).length;

  const hoy = new Date().toLocaleDateString("es-AR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      {/* HEADER */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6 py-6 flex items-end justify-between flex-wrap gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-emerald-600">Compras</p>
            <h1 className="mt-1 text-3xl font-black text-slate-900">Proveedores</h1>
            <p className="mt-1 text-sm text-slate-500 capitalize">{hoy}</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={fetchDatos}
              className="text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 px-3 py-1.5 rounded-md transition"
            >
              Actualizar
            </button>
            <button
              onClick={() => {
                setProveedorAEditar(null);
                setMostrarModal(true);
              }}
              className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm px-4 py-2 rounded-lg font-semibold transition"
            >
              <Icon d={ICONS.plus} className="h-4 w-4" />
              Nuevo proveedor
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        {error && (
          <div className="bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-lg text-sm font-medium">
            {error}
          </div>
        )}

        {/* KPIs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Kpi label="Total proveedores" value={proveedores.length} sub="Distribuidores registrados" icon="truck" accent="bg-emerald-50 text-emerald-600" />
          <Kpi label="Con productos" value={conProductos} sub="Proveedores activos" icon="box" accent="bg-sky-50 text-sky-600" />
        </div>

        {/* TABLA */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between gap-4 flex-wrap">
            <div>
              <h3 className="text-base font-bold text-slate-900">Listado de proveedores</h3>
              <p className="text-xs text-slate-500 mt-0.5">Distribuidores y datos de contacto</p>
            </div>
            <div className="relative">
              <Icon d={ICONS.search} className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Buscar proveedor…"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg bg-slate-50 focus:bg-white focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 outline-none transition w-64"
              />
            </div>
          </div>

          {loading ? (
            <div className="py-20 text-center text-slate-400 text-sm font-medium">Cargando proveedores…</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50/60 border-b border-slate-200">
                  <tr className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    <th className="px-6 py-3 text-left">Proveedor</th>
                    <th className="px-6 py-3 text-left">Contacto</th>
                    <th className="px-6 py-3 text-right">Productos</th>
                    <th className="px-6 py-3 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {proveedoresFiltrados.length > 0 ? (
                    proveedoresFiltrados.map((p) => {
                      const usos = contarProductos(p.id);
                      return (
                        <tr key={p.id} className="hover:bg-slate-50/60 transition">
                          <td className="px-6 py-3.5">
                            <p className="font-semibold text-slate-800">{p.nombre}</p>
                          </td>

                          {/* Contacto */}
                          <td className="px-6 py-3.5">
                            <div className="space-y-1">
                              {p.mail ? (
                                <a href={`mailto:${p.mail}`} className="inline-flex items-center gap-1.5 text-slate-600 hover:text-emerald-600 transition">
                                  <Icon d={ICONS.mail} className="h-3.5 w-3.5 text-slate-400" />
                                  {p.mail}
                                </a>
                              ) : (
                                <span className="inline-flex items-center gap-1.5 text-slate-300">
                                  <Icon d={ICONS.mail} className="h-3.5 w-3.5" />
                                  Sin email
                                </span>
                              )}
                              {p.nroTelefono ? (
                                <a href={`tel:${p.nroTelefono}`} className="flex items-center gap-1.5 text-slate-600 hover:text-emerald-600 transition">
                                  <Icon d={ICONS.phone} className="h-3.5 w-3.5 text-slate-400" />
                                  {p.nroTelefono}
                                </a>
                              ) : (
                                <span className="flex items-center gap-1.5 text-slate-300">
                                  <Icon d={ICONS.phone} className="h-3.5 w-3.5" />
                                  Sin teléfono
                                </span>
                              )}
                            </div>
                          </td>

                          {/* Productos */}
                          <td className="px-6 py-3.5 text-right">
                            {usos > 0 ? (
                              <span className="inline-flex items-center rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600 tabular-nums">
                                {usos}
                              </span>
                            ) : (
                              <span className="text-xs text-slate-400">—</span>
                            )}
                          </td>

                          {/* Acciones */}
                          <td className="px-6 py-3.5">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                onClick={() => {
                                  setProveedorAEditar(p);
                                  setMostrarModal(true);
                                }}
                                title="Editar"
                                className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-emerald-50 hover:text-emerald-600 transition"
                              >
                                <Icon d={ICONS.edit} className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleDelete(p.id)}
                                title="Eliminar"
                                className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition"
                              >
                                <Icon d={ICONS.trash} className="h-4 w-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan="4" className="px-6 py-16 text-center text-sm text-slate-400">
                        {busqueda ? "Sin resultados para tu búsqueda" : "No hay proveedores registrados"}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {!loading && (
            <div className="px-6 py-3 bg-slate-50/60 border-t border-slate-200 text-xs text-slate-500">
              Mostrando <strong className="text-slate-700">{proveedoresFiltrados.length}</strong> de{" "}
              <strong className="text-slate-700">{proveedores.length}</strong> proveedores
            </div>
          )}
        </div>
      </div>

      {/* MODAL */}
      {mostrarModal && (
        <ProveedorForm
          proveedorInicial={proveedorAEditar}
          onSave={handleSave}
          onClose={() => {
            setMostrarModal(false);
            setProveedorAEditar(null);
          }}
        />
      )}
    </div>
  );
};

export default ProveedoresPage;
