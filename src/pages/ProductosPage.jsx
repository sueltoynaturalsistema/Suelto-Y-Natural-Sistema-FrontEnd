import { useState, useEffect, useCallback, useMemo } from "react";
import ProductoForm from "../components/ProductoForm";
import {
  getProductos,
  crearProducto,
  eliminarProducto,
  actualizarOferta,
  editarProducto,
  getCategorias,
  getProveedores,
} from "../api/api";

const fmtMoney = (n) =>
  "$" + Number(n || 0).toLocaleString("es-AR", { maximumFractionDigits: 0 });

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
  filter: ["M4 6h16", "M7 12h10", "M10 18h4"],
  plus: ["M12 5v14", "M5 12h14"],
  edit: ["M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5", "M18.5 3.5a2 2 0 012.8 2.8L12 15.6 8 17l1.4-4z"],
  trash: ["M4 7h16", "M9 7V4a1 1 0 011-1h4a1 1 0 011 1v3", "M19 7l-.9 12a2 2 0 01-2 1.9H7.9a2 2 0 01-2-1.9L5 7", "M10 11v6", "M14 11v6"],
  tag: ["M3 7.5V4a1 1 0 011-1h3.5a2 2 0 011.4.6l9 9a2 2 0 010 2.8l-3.5 3.5a2 2 0 01-2.8 0l-9-9A2 2 0 013 7.5z", "M7 7h.01"],
  box: ["M21 16V8a2 2 0 00-1-1.7l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.7l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z", "M3.3 7L12 12l8.7-5", "M12 22V12"],
  alert: ["M12 9v4", "M12 17h.01", "M10.3 3.9L1.8 18a2 2 0 001.7 3h16.8a2 2 0 001.7-3L13.7 3.9a2 2 0 00-3.4 0z"],
};

/* ---------- KPI (canon Ventas/Reportes, opcional clicable) ---------- */
const Kpi = ({ label, value, sub, accent, icon, onClick, active }) => {
  const base =
    "bg-white rounded-xl border p-5 shadow-sm hover:shadow-md transition-shadow text-left w-full";
  const Tag = onClick ? "button" : "div";
  return (
    <Tag
      onClick={onClick}
      className={`${base} ${active ? "border-transparent ring-2 ring-emerald-300" : "border-slate-200"}`}
    >
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
    </Tag>
  );
};

/* ---------- Badge de stock (canon Reportes) ---------- */
const StockBadge = ({ cantidad }) => {
  const c = Number(cantidad || 0);
  let cls = "bg-emerald-50 text-emerald-700 border-emerald-200";
  let label = "En stock";
  if (c === 0) {
    cls = "bg-rose-50 text-rose-700 border-rose-200";
    label = "Agotado";
  } else if (c < 5) {
    cls = "bg-orange-50 text-orange-700 border-orange-200";
    label = "Crítico";
  } else if (c < 10) {
    cls = "bg-amber-50 text-amber-700 border-amber-200";
    label = "Bajo";
  }
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-md border ${cls}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70" />
      {label}
    </span>
  );
};

const ProductosPage = () => {
  const [productos, setProductos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [proveedores, setProveedores] = useState([]);
  const [busqueda, setBusqueda] = useState("");

  const [mostrarFiltros, setMostrarFiltros] = useState(false);
  const [filtroCategoria, setFiltroCategoria] = useState("");
  const [filtroProveedor, setFiltroProveedor] = useState("");
  const [filtroStock, setFiltroStock] = useState("");
  const [filtroOferta, setFiltroOferta] = useState("");

  const [mostrarModal, setMostrarModal] = useState(false);
  const [productoAEditar, setProductoAEditar] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [pagina, setPagina] = useState(1);
  const [porPagina, setPorPagina] = useState(20);

const fetchDatos = useCallback(async () => {
  try {
    setLoading(true);
    setError("");

    const [resProductos, resCategorias, resProveedores] = await Promise.all([
      getProductos(),
      getCategorias(),
      getProveedores(),
    ]);

    console.log("PRODUCTOS API:", resProductos);

    setProductos(Array.isArray(resProductos) ? resProductos : []);
    setCategorias(Array.isArray(resCategorias) ? resCategorias : []);
    setProveedores(Array.isArray(resProveedores) ? resProveedores : []);
  } catch (err) {
    console.error(err);
    setError("No se pudieron cargar los productos del inventario");
  } finally {
    setLoading(false);
  }
}, []);

  useEffect(() => {
    fetchDatos();
  }, [fetchDatos]);

 const handleSave = async (producto) => {
  try {
    const payload = {
      ...producto,
      fechaVencimiento: producto.fechaVencimiento
        ? new Date(producto.fechaVencimiento)
        : null,
    };

    if (productoAEditar) {
      await editarProducto(productoAEditar.id, payload);
    } else {
      await crearProducto(payload);
    }

    await fetchDatos();
    setMostrarModal(false);
    setProductoAEditar(null);
  } catch (err) {
    console.error(err);
    alert("Error al guardar el producto");
  }
};

  const handleDelete = async (id) => {
    if (!window.confirm("¿Eliminar este producto del inventario?")) return;
    try {
      await eliminarProducto(id);
      fetchDatos();
    } catch (err) {
      console.error(err);
      alert("No se pudo eliminar el producto");
    }
  };

  const handleOferta = async (id, estado) => {
    // Update optimista: cambia solo esa fila, sin recargar toda la tabla.
    setProductos((prev) =>
      prev.map((p) => (p.id === id ? { ...p, oferta: estado } : p))
    );
    try {
      await actualizarOferta(id, estado);
    } catch (err) {
      console.error(err);
      alert("Error al actualizar la oferta");
      // Revertir si falló el servidor.
      setProductos((prev) =>
        prev.map((p) => (p.id === id ? { ...p, oferta: !estado } : p))
      );
    }
  };

  const limpiarFiltros = () => {
    setFiltroCategoria("");
    setFiltroProveedor("");
    setFiltroStock("");
    setFiltroOferta("");
    setBusqueda("");
  };

  const hayFiltros = filtroCategoria || filtroProveedor || filtroStock || filtroOferta;

  const productosFiltrados = productos.filter((p) => {
    const query = busqueda.toLowerCase();
    const matchesBusqueda =
      (p.nombre || "").toLowerCase().includes(query) ||
      String(p.id).toLowerCase().includes(query);

    const pCatId = String(p.categoria || p.categoriaId || "");
    const matchesCategoria = filtroCategoria === "" || pCatId === String(filtroCategoria);

    const pProvId = String(p.proveedorId || p.proveedor?.id || "");
    const matchesProveedor = filtroProveedor === "" || pProvId === String(filtroProveedor);

    const cantidadStock = p.cantidad || 0;
    let matchesStock = true;
    if (filtroStock === "critico") matchesStock = cantidadStock < 10;
    if (filtroStock === "normal") matchesStock = cantidadStock >= 10;

    let matchesOferta = true;
    if (filtroOferta === "activa") matchesOferta = p.oferta === true;
    if (filtroOferta === "no") matchesOferta = !p.oferta;

    return matchesBusqueda && matchesCategoria && matchesProveedor && matchesStock && matchesOferta;
  });

  // Paginado client-side: vuelve a pág 1 cuando cambia algún filtro/búsqueda.
  useEffect(() => {
    setPagina(1);
  }, [busqueda, filtroCategoria, filtroProveedor, filtroStock, filtroOferta, porPagina]);

  const totalPaginas = Math.max(1, Math.ceil(productosFiltrados.length / porPagina));
  const paginaActual = Math.min(pagina, totalPaginas);
  const productosPagina = productosFiltrados.slice(
    (paginaActual - 1) * porPagina,
    paginaActual * porPagina
  );

  const stats = {
    total: productos.length,
    oferta: productos.filter((p) => p.oferta).length,
    stock: productos.filter((p) => p.cantidad < 10).length,
  };

  const sinFiltros = !busqueda && !hayFiltros;

  const valorInventario = useMemo(
    () =>
      productosFiltrados.reduce(
        (acc, p) => acc + Number(p.precioCompra || 0) * Number(p.cantidad || 0),
        0
      ),
    [productosFiltrados]
  );

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
            <p className="text-xs font-bold uppercase tracking-widest text-emerald-600">Inventario</p>
            <h1 className="mt-1 text-3xl font-black text-slate-900">Productos</h1>
            <p className="mt-1 text-sm text-slate-500 capitalize">{hoy}</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-2 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-md">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Datos en vivo
            </span>
            <button
              onClick={fetchDatos}
              className="text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 px-3 py-1.5 rounded-md transition"
            >
              Actualizar
            </button>
            <button
              onClick={() => {
                setProductoAEditar(null);
                setMostrarModal(true);
              }}
              className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm px-4 py-2 rounded-lg font-semibold transition"
            >
              <Icon d={ICONS.plus} className="h-4 w-4" />
              Nuevo producto
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

        {/* KPIs (clic = filtra) */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Kpi
            label="Total productos"
            value={stats.total}
            sub={`Valor catálogo ${fmtMoney(valorInventario)}`}
            icon="box"
            accent="bg-emerald-50 text-emerald-600"
            active={sinFiltros}
            onClick={limpiarFiltros}
          />
          <Kpi
            label="En oferta"
            value={stats.oferta}
            sub="Promociones activas"
            icon="tag"
            accent="bg-amber-50 text-amber-600"
            active={filtroOferta === "activa"}
            onClick={() => {
              setFiltroOferta(filtroOferta === "activa" ? "" : "activa");
              setMostrarFiltros(true);
            }}
          />
          <Kpi
            label="Stock crítico"
            value={stats.stock}
            sub="Menos de 10 unidades"
            icon="alert"
            accent="bg-rose-50 text-rose-600"
            active={filtroStock === "critico"}
            onClick={() => {
              setFiltroStock(filtroStock === "critico" ? "" : "critico");
              setMostrarFiltros(true);
            }}
          />
        </div>

        {/* BÚSQUEDA + FILTROS */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 space-y-4">
          <div className="flex gap-3">
            <div className="relative flex-1">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                <Icon d={ICONS.search} className="h-4 w-4" />
              </span>
              <input
                type="text"
                placeholder="Buscar por nombre o ID…"
                className="w-full text-sm border border-slate-200 rounded-lg pl-9 pr-3 py-2.5 bg-slate-50 focus:bg-white focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 outline-none transition"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
              />
            </div>
            <button
              onClick={() => setMostrarFiltros(!mostrarFiltros)}
              className={`inline-flex items-center gap-2 px-4 rounded-lg text-sm font-semibold border transition ${
                mostrarFiltros || hayFiltros
                  ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                  : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
              }`}
            >
              <Icon d={ICONS.filter} className="h-4 w-4" />
              <span className="hidden sm:inline">Filtros</span>
              {hayFiltros && (
                <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-emerald-600 px-1.5 text-[11px] font-bold text-white">
                  {[filtroCategoria, filtroProveedor, filtroStock, filtroOferta].filter(Boolean).length}
                </span>
              )}
            </button>
          </div>

          {mostrarFiltros && (
            <div className="pt-4 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Categoría</label>
                <select
                  value={filtroCategoria}
                  onChange={(e) => setFiltroCategoria(e.target.value)}
                  className="text-sm border border-slate-200 rounded-lg px-3 py-2.5 bg-slate-50 focus:bg-white focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 outline-none transition font-medium text-slate-700"
                >
                  <option value="">Todas las categorías</option>
                  {categorias.map((c) => (
                    <option key={c.id} value={c.id}>{c.name || c.nombre}</option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Proveedor</label>
                <select
                  value={filtroProveedor}
                  onChange={(e) => setFiltroProveedor(e.target.value)}
                  className="text-sm border border-slate-200 rounded-lg px-3 py-2.5 bg-slate-50 focus:bg-white focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 outline-none transition font-medium text-slate-700"
                >
                  <option value="">Todos los proveedores</option>
                  {proveedores.map((p) => (
                    <option key={p.id} value={p.id}>{p.name || p.nombre}</option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Nivel de stock</label>
                <select
                  value={filtroStock}
                  onChange={(e) => setFiltroStock(e.target.value)}
                  className="text-sm border border-slate-200 rounded-lg px-3 py-2.5 bg-slate-50 focus:bg-white focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 outline-none transition font-medium text-slate-700"
                >
                  <option value="">Todos los niveles</option>
                  <option value="critico">Crítico (menos de 10)</option>
                  <option value="normal">Seguro (10 o más)</option>
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Oferta</label>
                <select
                  value={filtroOferta}
                  onChange={(e) => setFiltroOferta(e.target.value)}
                  className="text-sm border border-slate-200 rounded-lg px-3 py-2.5 bg-slate-50 focus:bg-white focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 outline-none transition font-medium text-slate-700"
                >
                  <option value="">Todas</option>
                  <option value="activa">Solo en oferta</option>
                  <option value="no">Sin oferta</option>
                </select>
              </div>

              {(busqueda || hayFiltros) && (
                <div className="sm:col-span-2 lg:col-span-4 flex justify-end">
                  <button
                    onClick={limpiarFiltros}
                    className="text-xs font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-200 px-3 py-1.5 rounded-md transition"
                  >
                    Limpiar filtros
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* TABLA */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between gap-4 flex-wrap">
            <div>
              <h3 className="text-base font-bold text-slate-900">Catálogo de productos</h3>
              <p className="text-xs text-slate-500 mt-0.5">Listado completo con precios y stock</p>
            </div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 bg-slate-100 px-2.5 py-1 rounded-md">
              {productosFiltrados.length} productos
            </span>
          </div>

          {loading ? (
            <div className="py-20 text-center text-slate-400 text-sm font-medium">Cargando productos…</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
              <thead className="bg-slate-50/60 border-b border-slate-200">
  <tr className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
    <th className="px-4 py-3 text-left">Producto</th>
    <th className="px-4 py-3 text-left">Categoría</th>
    <th className="px-4 py-3 text-right">Precio</th>
    <th className="px-4 py-3 text-right">Margen</th>
    <th className="px-4 py-3 text-right">Stock</th>
    <th className="px-4 py-3 text-left">Proveedor</th>
    <th className="px-4 py-3 text-left w-28">Oferta</th>

    <th className="px-4 py-3 text-left">Vencimiento</th>

    <th className="px-4 py-3 text-right whitespace-nowrap">Acciones</th>
  </tr>
</thead>
              <tbody className="divide-y divide-slate-100">
                {productosFiltrados.length ? (
                  productosPagina.map((p) => {
                    const pVenta = p.precioVenta || p.precioUnitario || p.precioPorGramo || 0;
                    const pCompra = p.precioCompra || 0;
                    const ganancia = pVenta - pCompra;
                    const margen = pCompra > 0 ? (ganancia / pCompra) * 100 : 0;

                    const catMatch = categorias.find(
                      (c) => String(c.id) === String(p.categoria || p.categoriaId)
                    );

                    const provMatch = proveedores.find(
                      (prov) => String(prov.id) === String(p.proveedorId || p.proveedor?.id)
                    );

                    const vencimiento = p.fechaVencimiento
                      ? new Date(p.fechaVencimiento)
                      : null;

                    return (
                      <tr key={p.id} className="hover:bg-slate-50/60 transition">
                        {/* Producto */}
                        <td className="px-4 py-3.5 max-w-[200px]">
                          <p className="font-semibold text-slate-800 truncate">{p.nombre}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span
                              className={`inline-block h-1.5 w-1.5 rounded-full ${
                                p.tipo === "suelto" ? "bg-amber-500" : "bg-emerald-500"
                              }`}
                            />
                            <span className="text-xs text-slate-500 capitalize">
                              {p.tipo || "envasado"}
                            </span>
                            <span className="text-xs text-slate-300 font-mono">#{String(p.id).slice(0, 8)}</span>
                          </div>
                        </td>

                        {/* Categoría */}
                        <td className="px-4 py-3.5">
                          <span className="inline-flex items-center rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
                            {catMatch ? catMatch.name || catMatch.nombre : "Sin categoría"}
                          </span>
                        </td>

                        {/* Precio */}
                        <td className="px-4 py-3.5 text-right tabular-nums">
                          <p className="font-bold text-slate-900">{fmtMoney(pVenta)}</p>
                          <p className="text-xs text-slate-400">costo {fmtMoney(pCompra)}</p>
                        </td>

                        {/* Margen */}
                        <td className="px-4 py-3.5 text-right tabular-nums">
                          <p
                            className={`font-bold ${
                              ganancia >= 0 ? "text-emerald-600" : "text-rose-600"
                            }`}
                          >
                            {fmtMoney(ganancia)}
                          </p>
                          {pCompra > 0 && (
                            <p
                              className={`text-xs ${
                                margen >= 0 ? "text-slate-400" : "text-rose-500"
                              }`}
                            >
                              {margen >= 0 ? "+" : ""}
                              {margen.toFixed(0)}%
                            </p>
                          )}
                        </td>

                        {/* Stock */}
                        <td className="px-4 py-3.5 text-right">
                          <div className="flex flex-col items-end gap-1">
                            <span
                              className={`font-bold tabular-nums ${
                                p.cantidad === 0
                                  ? "text-rose-600"
                                  : p.cantidad < 10
                                  ? "text-amber-600"
                                  : "text-slate-800"
                              }`}
                            >
                              {p.cantidad}
                            </span>
                          </div>
                        </td>

                        {/* Proveedor */}
                        <td className="px-4 py-3.5 max-w-[12rem]">
                          <span className="text-slate-600 truncate block">
                            {provMatch ? provMatch.name || provMatch.nombre : "—"}
                          </span>
                        </td>

                        {/* Oferta */}
                        <td className="px-4 py-3.5 w-32">
                          <div className="w-[88px]">
                            {p.oferta ? (
                              <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-md border bg-amber-50 text-amber-700 border-amber-200">
                                <Icon d={ICONS.tag} className="h-3 w-3" />
                                Oferta
                              </span>
                            ) : (
                              <span className="text-xs text-slate-400">—</span>
                            )}
                          </div>
                        </td>

                        {/* ✅ NUEVA COLUMNA: VENCIMIENTO */}
                     <td className="px-4 py-3.5">
  {p.fechaVencimiento ? (() => {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    const fechaVenc = new Date(p.fechaVencimiento);
    fechaVenc.setHours(0, 0, 0, 0);

    const diferenciaDias = Math.ceil(
      (fechaVenc - hoy) / (1000 * 60 * 60 * 24)
    );

    if (diferenciaDias < 0) {
      return (
        <div className="flex flex-col">
          <span className="text-xs font-bold text-red-600">
            VENCIDO
          </span>
          <span className="text-xs text-slate-500">
            {fechaVenc.toLocaleDateString("es-AR")}
          </span>
        </div>
      );
    }

    if (diferenciaDias <= 30) {
      return (
        <div className="flex flex-col">
          <span className="text-xs font-bold text-orange-600">
            Vence en {diferenciaDias} días
          </span>
          <span className="text-xs text-slate-500">
            {fechaVenc.toLocaleDateString("es-AR")}
          </span>
        </div>
      );
    }

    return (
      <span className="text-xs font-semibold text-slate-700">
        {fechaVenc.toLocaleDateString("es-AR")}
      </span>
    );
  })() : (
    <span className="text-xs text-slate-400">—</span>
  )}
</td>

                        {/* Acciones */}
                        <td className="px-4 py-3.5 whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => handleOferta(p.id, !p.oferta)}
                              title={p.oferta ? "Quitar oferta" : "Marcar en oferta"}
                              className={`flex h-8 w-8 items-center justify-center rounded-lg transition ${
                                p.oferta
                                  ? "bg-amber-50 text-amber-600 hover:bg-amber-100"
                                  : "text-slate-400 hover:bg-slate-100 hover:text-amber-600"
                              }`}
                            >
                              <Icon d={ICONS.tag} className="h-4 w-4" />
                            </button>

                            <button
                              onClick={() => {
                                setProductoAEditar(p);
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
                    <td colSpan="9" className="px-6 py-12 text-center text-slate-500">
                      No hay productos para mostrar.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          )}
          {!loading ? (
            <div className="px-6 py-3 bg-slate-50/60 border-t border-slate-200 text-xs text-slate-500 flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-3 flex-wrap">
                <span>
                  Mostrando <strong className="text-slate-700">{productosPagina.length}</strong> de{" "}
                  <strong className="text-slate-700">{productosFiltrados.length}</strong> filtrados{" "}
                  <span className="text-slate-400">(total {productos.length})</span>
                </span>
                <label className="flex items-center gap-1.5 text-slate-500">
                  Por página:
                  <select
                    value={porPagina}
                    onChange={(e) => setPorPagina(Number(e.target.value))}
                    className="text-xs font-semibold border border-slate-200 rounded-md px-2 py-1 bg-white text-slate-700 outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 transition"
                  >
                    {[20, 50, 100].map((n) => (
                      <option key={n} value={n}>{n}</option>
                    ))}
                  </select>
                </label>
              </div>

              {totalPaginas > 1 && (
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setPagina((p) => Math.max(1, p - 1))}
                    disabled={paginaActual === 1}
                    className="text-xs font-semibold px-3 py-1.5 rounded-md border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
                  >
                    ← Anterior
                  </button>
                  <span className="text-xs font-semibold text-slate-600 px-2">
                    Página {paginaActual} de {totalPaginas}
                  </span>
                  <button
                    onClick={() => setPagina((p) => Math.min(totalPaginas, p + 1))}
                    disabled={paginaActual === totalPaginas}
                    className="text-xs font-semibold px-3 py-1.5 rounded-md border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
                  >
                    Siguiente →
                  </button>
                </div>
              )}

              <span>
                Valor de stock (filtrado):{" "}
                <strong className="text-slate-700">{fmtMoney(valorInventario)}</strong>
              </span>
            </div>
          ) : null}
        </div>
      </div>

      {mostrarModal && (
        <ProductoForm
          productoInicial={productoAEditar}
          onSave={handleSave}
          onClose={() => {
            setMostrarModal(false);
            setProductoAEditar(null);
          }}
        />
      )}
    </div>
  );
};

export default ProductosPage;
