import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { getProductos, crearVenta, getVentas } from "../api/api";
import { useReactToPrint } from "react-to-print";

const fmtMoney = (n) =>
  "$" + Number(n || 0).toLocaleString("es-AR", { maximumFractionDigits: 0 });

const Kpi = ({ label, value, sub, accent, icon }) => (
  <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-shadow">
    <div className="flex items-start justify-between">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
          {label}
        </p>
        <p className="mt-2 text-3xl font-black text-slate-900 leading-none">
          {value}
        </p>
        {sub && <p className="mt-2 text-xs text-slate-500">{sub}</p>}
      </div>
      <div className={`w-10 h-10 rounded-lg grid place-items-center ${accent}`}>
        {icon}
      </div>
    </div>
  </div>
);

const StockHint = ({ disponible }) => {
  let cls = "bg-emerald-50 text-emerald-700 border-emerald-200";
  let label = `Stock disponible: ${disponible} u.`;
  if (disponible === 0) {
    cls = "bg-rose-50 text-rose-700 border-rose-200";
    label = "¡Sin stock disponible en mostrador!";
  } else if (disponible <= 5) {
    cls = "bg-amber-50 text-amber-700 border-amber-200";
    label = `Stock bajo: ${disponible} u. para añadir`;
  }
  return (
    <div
      className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-md border ${cls}`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70" />
      {label}
    </div>
  );
};

const VentasPage = () => {
  const [productos, setProductos] = useState([]);
  const [ventasLocales, setVentasLocales] = useState([]);
  const [productoId, setProductoId] = useState("");
  const [cantidad, setCantidad] = useState(1);
  const [metodoPago, setMetodoPago] = useState("efectivo");
  const [ofertaManual, setOfertaManual] = useState(0);
  const [carrito, setCarrito] = useState([]);
  const [ventaSeleccionada, setVentaSeleccionada] = useState(null);
  const [cargando, setCargando] = useState(false);
  const [busqueda, setBusqueda] = useState("");
  const [fechaInicio, setFechaInicio] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [fechaFin, setFechaFin] = useState(
    new Date().toISOString().split("T")[0]
  );

  const ticketRef = useRef(null);

  const fetchProductos = useCallback(async () => {
    try {
      const data = await getProductos();
      setProductos(Array.isArray(data) ? data : []);
    } catch {
      setProductos([]);
    }
  }, []);

  const fetchVentas = useCallback(async () => {
    try {
      const data = await getVentas({ desde: fechaInicio, hasta: fechaFin });
      setVentasLocales(Array.isArray(data) ? data : []);
    } catch {
      setVentasLocales([]);
    }
  }, [fechaInicio, fechaFin]);

  useEffect(() => {
    fetchProductos();
  }, [fetchProductos]);

  useEffect(() => {
    fetchVentas();
  }, [fetchVentas]);

  const productosFiltrados = productos.filter((p) =>
    p.nombre?.toLowerCase().includes(busqueda.toLowerCase())
  );

  const productoSeleccionado = productos.find(
    (p) => String(p.id) === String(productoId)
  );

  const stockDisponibleReal = useMemo(() => {
    if (!productoSeleccionado) return 0;
    const itemEnCarrito = carrito.find((item) => item.productoId === productoSeleccionado.id);
    const cantidadEnCarrito = itemEnCarrito ? itemEnCarrito.cantidad : 0;
    return productoSeleccionado.cantidad - cantidadEnCarrito;
  }, [productoSeleccionado, carrito]);

  const agregarAlCarrito = () => {
    if (!productoSeleccionado) {
      return alert("Seleccioná un producto");
    }

    if (cantidad <= 0) {
      return alert("Cantidad inválida");
    }

    if (cantidad > stockDisponibleReal) {
      return alert("Stock insuficiente para agregar esa cantidad");
    }

    const precioVenta = Number(
      productoSeleccionado.precioVenta ?? productoSeleccionado.precio ?? 0
    );
    const precioCompra = Number(productoSeleccionado.precioCompra ?? 0);
    const descuento = Number(ofertaManual) || 0;
    const precioFinal = precioVenta - (precioVenta * descuento) / 100;
    const total = precioFinal * cantidad;
    const ganancia = (precioFinal - precioCompra) * cantidad;

    const itemExistente = carrito.find(
      (item) => item.productoId === productoSeleccionado.id
    );

    if (itemExistente) {
      const actualizado = carrito.map((item) => {
        if (item.productoId === productoSeleccionado.id) {
          const nuevaCantidad = item.cantidad + cantidad;
          return {
            ...item,
            cantidad: nuevaCantidad,
            total: item.precioFinal * nuevaCantidad,
            ganancia:
              (item.precioFinal - item.precioCompra) * nuevaCantidad,
          };
        }
        return item;
      });
      setCarrito(actualizado);
    } else {
      const nuevoItem = {
        productoId: productoSeleccionado.id,
        nombre: productoSeleccionado.nombre,
        cantidad,
        precioVenta,
        precioCompra,
        descuento,
        precioFinal,
        total,
        ganancia,
      };
      setCarrito([...carrito, nuevoItem]);
    }

    setProductoId("");
    setCantidad(1);
    setOfertaManual(0);
    setBusqueda("");
  };

  const eliminarItem = (index) => {
    const actualizado = [...carrito];
    actualizado.splice(index, 1);
    setCarrito(actualizado);
  };

  const cambiarCantidad = (index, nuevaCantidad) => {
    if (nuevaCantidad <= 0) return;

    const actualizado = [...carrito];
    const item = actualizado[index];
    const prodOriginal = productos.find((p) => p.id === item.productoId);

    if (prodOriginal && nuevaCantidad > prodOriginal.cantidad) {
      return alert("No hay suficiente stock en depósito");
    }

    item.cantidad = nuevaCantidad;
    item.total = item.precioFinal * nuevaCantidad;
    item.ganancia = (item.precioFinal - item.precioCompra) * nuevaCantidad;
    setCarrito(actualizado);
  };

  const vaciarCarrito = () => {
    if (carrito.length === 0) return;
    if (window.confirm("¿Estás seguro de que querés vaciar todo el carrito?")) {
      setCarrito([]);
    }
  };

  const totalCarrito = useMemo(() => {
    return carrito.reduce((acc, item) => acc + item.total, 0);
  }, [carrito]);

  const gananciaCarrito = useMemo(() => {
    return carrito.reduce((acc, item) => acc + item.ganancia, 0);
  }, [carrito]);

  const handleVenta = async () => {
    if (carrito.length === 0) {
      return alert("Agregá productos al carrito");
    }

    const confirmar = window.confirm(
      `¿Confirmar venta de $${totalCarrito.toLocaleString("es-AR")}?`
    );

    if (!confirmar) return;

    try {
      setCargando(true);

      const ventaPayload = {
        items: carrito.map((item) => ({
          productoId: item.productoId,
          cantidad: Number(item.cantidad),
          descuento: Number(item.descuento) || 0,
        })),
        metodoPago,
      };

      const resp = await crearVenta(ventaPayload);

      const ventaTicket = {
        id: resp.id,
        fecha: resp.fecha,
        total: resp.total,
        metodoPago,
        items: carrito,
        ganancia: gananciaCarrito,
      };

      setVentaSeleccionada(ventaTicket);
      setCarrito([]);
      setMetodoPago("efectivo");
      setProductoId("");
      setCantidad(1);
      setOfertaManual(0);
      setBusqueda("");

      await fetchProductos();
      await fetchVentas();
      alert("Venta registrada correctamente");
    } catch (err) {
      console.error(err);
      const msg =
        err.response?.data?.error ||
        err.response?.data?.message ||
        "Error al registrar venta";
      alert(msg);
    } finally {
      setCargando(false);
    }
  };

  const ventasFiltradas = ventasLocales;

  const calcularGananciaVenta = (venta) => {
    const items = Array.isArray(venta?.items) ? venta.items : [];
    return items.reduce((sub, it) => {
      const pv = Number(it?.precioUnitario || 0);
      const pc = Number(it?.precioCompraUnitario || 0);
      const desc = Number(it?.descuento || 0);
      const cant = Number(it?.cantidad || 0);
      return sub + (pv - pc) * cant * (1 - desc / 100);
    }, 0);
  };

  const ingresosTotales = ventasFiltradas.reduce(
    (acc, v) => acc + Number(v.total || 0),
    0
  );

  const gananciasTotales = ventasFiltradas.reduce(
    (acc, venta) => acc + calcularGananciaVenta(venta),
    0
  );

  const totalProductosVendidos = ventasFiltradas.reduce((acc, venta) => {
    const items = Array.isArray(venta?.items) ? venta.items : [];
    return acc + items.reduce((s, it) => s + Number(it.cantidad || 0), 0);
  }, 0);

  const handlePrint = useReactToPrint({
    contentRef: ticketRef,
  });

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
            <p className="text-xs font-bold uppercase tracking-widest text-emerald-600">
              Punto de Venta
            </p>
            <h1 className="mt-1 text-3xl font-black text-slate-900">Ventas</h1>
            <p className="mt-1 text-sm text-slate-500 capitalize">{hoy}</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-2 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-md">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Datos en vivo
            </span>
            <button
              onClick={() => {
                fetchProductos();
                fetchVentas();
              }}
              className="text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 px-3 py-1.5 rounded-md transition"
            >
              Actualizar
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        {/* FILTRO FECHAS + KPIs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* DESDE */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
            <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              Desde
            </label>
            <input
              type="date"
              value={fechaInicio}
              onChange={(e) => setFechaInicio(e.target.value)}
              className="w-full mt-2 text-sm border border-slate-200 rounded-lg px-3 py-2 bg-slate-50 focus:bg-white focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 outline-none transition"
            />
          </div>

          {/* HASTA */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
            <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              Hasta
            </label>
            <input
              type="date"
              value={fechaFin}
              onChange={(e) => setFechaFin(e.target.value)}
              className="w-full mt-2 text-sm border border-slate-200 rounded-lg px-3 py-2 bg-slate-50 focus:bg-white focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 outline-none transition"
            />
          </div>

          <Kpi
            label="Ingresos"
            value={fmtMoney(ingresosTotales)}
            sub={`${ventasFiltradas.length} ventas`}
            accent="bg-emerald-50 text-emerald-600"
            icon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8V6m0 12v-2" />
              </svg>
            }
          />

          <Kpi
            label="Ganancia"
            value={fmtMoney(gananciasTotales)}
            accent="bg-emerald-50 text-emerald-600"
            icon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            }
          />

          <Kpi
            label="Productos Vendidos"
            value={totalProductosVendidos}
            accent="bg-sky-50 text-sky-600"
            icon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
            }
          />
        </div>

        {/* INTERFAZ POS */}
        <div className="flex flex-col lg:flex-row gap-6 items-start">
          {/* COLUMNA IZQUIERDA: Formulario + Historial */}
          <div className="w-full lg:w-3/5 space-y-6">
            {/* FORMULARIO NUEVA VENTA */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
              <div className="px-6 py-4 border-b border-slate-100">
                <h3 className="text-base font-bold text-slate-900">Nueva Venta</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Buscá un producto y agregalo al carrito
                </p>
              </div>

              <div className="p-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <input
                    type="text"
                    placeholder="Buscar producto..."
                    value={busqueda}
                    onChange={(e) => setBusqueda(e.target.value)}
                    className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2.5 bg-slate-50 focus:bg-white focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 outline-none transition"
                  />

                  <select
                    value={productoId}
                    onChange={(e) => setProductoId(e.target.value)}
                    className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2.5 bg-slate-50 focus:bg-white focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 outline-none transition"
                  >
                    <option value="">Seleccionar producto</option>
                    {productosFiltrados.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.nombre} | stock: {p.cantidad}
                      </option>
                    ))}
                  </select>
                </div>

                {productoSeleccionado && (
                  <StockHint disponible={stockDisponibleReal} />
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1">
                    <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 px-1">
                      Cantidad a vender
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={cantidad}
                      onChange={(e) => setCantidad(Number(e.target.value))}
                      className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2.5 bg-slate-50 focus:bg-white focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 outline-none transition font-medium"
                      placeholder="Cantidad"
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 px-1">
                      Descuento (% de oferta)
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={ofertaManual}
                      onChange={(e) => setOfertaManual(Number(e.target.value))}
                      className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2.5 bg-slate-50 focus:bg-white focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 outline-none transition font-medium"
                      placeholder="Oferta %"
                    />
                  </div>
                </div>

                <button
                  onClick={agregarAlCarrito}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 transition text-white py-2.5 rounded-lg font-semibold text-sm"
                >
                  Agregar al carrito
                </button>
              </div>
            </div>

            {/* HISTORIAL */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between gap-4 flex-wrap">
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Historial de Ventas
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Click en una fila para ver el ticket
                  </p>
                </div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 bg-slate-100 px-2.5 py-1 rounded-md">
                  {ventasFiltradas.length} ventas
                </span>
              </div>

              <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
                <table className="w-full text-sm whitespace-nowrap">
                  <thead className="bg-slate-50/60 border-b border-slate-200 sticky top-0 z-10">
                    <tr className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                      <th className="px-6 py-3 text-left">Fecha</th>
                      <th className="px-6 py-3 text-left">Productos</th>
                      <th className="px-6 py-3 text-left">Método</th>
                      <th className="px-6 py-3 text-right">Ganancia</th>
                      <th className="px-6 py-3 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {ventasFiltradas.length > 0 ? (
                      ventasFiltradas
                        .slice()
                        .reverse()
                        .map((venta, index) => (
                          <tr
                            key={index}
                            onClick={() => setVentaSeleccionada(venta)}
                            className={`cursor-pointer transition ${
                              ventaSeleccionada?.id === venta.id
                                ? "bg-emerald-50 hover:bg-emerald-100"
                                : "hover:bg-slate-50/60"
                            }`}
                          >
                            <td className="px-6 py-3.5 font-semibold text-slate-700">
                              {new Date(venta.fecha).toLocaleString("es-AR")}
                            </td>
                            <td className="px-6 py-3.5">
                              <div className="space-y-0.5">
                                {venta.items.map((item, i) => (
                                  <div key={i} className="text-sm">
                                    <span className="font-semibold text-slate-800">
                                      {item.nombre}
                                    </span>
                                    <span className="text-slate-400">
                                      {" "}
                                      × {item.cantidad}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </td>
                            <td className="px-6 py-3.5">
                              <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-md border bg-slate-50 text-slate-700 border-slate-200 capitalize">
                                {venta.metodoPago}
                              </span>
                            </td>
                            <td className="px-6 py-3.5 text-right font-bold text-emerald-600 tabular-nums">
                              {fmtMoney(calcularGananciaVenta(venta))}
                            </td>
                            <td className="px-6 py-3.5 text-right font-black text-slate-900 tabular-nums">
                              {fmtMoney(venta.total)}
                            </td>
                          </tr>
                        ))
                    ) : (
                      <tr>
                        <td
                          colSpan="5"
                          className="px-6 py-16 text-center text-sm text-slate-400"
                        >
                          No hay ventas registradas
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* COLUMNA DERECHA: Carrito + Ticket */}
          <div className="w-full lg:w-2/5 space-y-6 sticky top-6">
            {/* CARRITO */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col max-h-[800px]">
              <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between gap-3 shrink-0">
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Carrito de Compras
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {carrito.length} ítems en el carrito
                  </p>
                </div>
                {carrito.length > 0 && (
                  <button
                    onClick={vaciarCarrito}
                    className="text-xs font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-200 px-3 py-1.5 rounded-md transition"
                  >
                    Vaciar
                  </button>
                )}
              </div>

              <div className="p-6 space-y-3 overflow-y-auto flex-1 max-h-[500px]">
                {carrito.length > 0 ? (
                  carrito.map((item, index) => (
                    <div
                      key={index}
                      className="border border-slate-200 rounded-lg p-4 bg-slate-50/60 hover:bg-white hover:shadow-sm transition"
                    >
                      <div className="flex justify-between items-start gap-4">
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-slate-900 leading-tight truncate">
                            {item.nombre}
                          </p>
                          <p className="text-sm text-slate-500 mt-0.5 tabular-nums">
                            {fmtMoney(item.precioFinal)} c/u
                          </p>
                          {item.descuento > 0 && (
                            <span className="inline-block text-[11px] mt-1 bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-md font-semibold">
                              Oferta {item.descuento}%
                            </span>
                          )}
                        </div>
                        <button
                          onClick={() => eliminarItem(index)}
                          className="text-slate-400 hover:text-rose-500 font-black text-xl leading-none transition px-1"
                        >
                          ×
                        </button>
                      </div>

                      <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-200/60">
                        <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-lg p-1">
                          <button
                            onClick={() => cambiarCantidad(index, item.cantidad - 1)}
                            className="bg-slate-100 hover:bg-slate-200 text-slate-700 w-7 h-7 rounded-md font-bold transition grid place-items-center"
                          >
                            −
                          </button>
                          <span className="font-bold w-9 text-center text-slate-900 text-sm tabular-nums">
                            {item.cantidad}
                          </span>
                          <button
                            onClick={() => cambiarCantidad(index, item.cantidad + 1)}
                            className="bg-slate-100 hover:bg-slate-200 text-slate-700 w-7 h-7 rounded-md font-bold transition grid place-items-center"
                          >
                            +
                          </button>
                        </div>
                        <div className="text-right">
                          <p className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold">
                            Subtotal
                          </p>
                          <p className="text-lg font-black text-slate-900 tabular-nums">
                            {fmtMoney(item.total)}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-16 text-sm text-slate-400 bg-slate-50/60 rounded-lg border border-dashed border-slate-200">
                    El carrito está vacío
                  </div>
                )}
              </div>

              {/* TOTALES + ACCIÓN */}
              <div className="px-6 py-5 space-y-4 shrink-0 border-t border-slate-100">
                <div className="flex flex-col gap-1">
                  <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 px-1">
                    Método de pago
                  </label>
                  <select
                    value={metodoPago}
                    onChange={(e) => setMetodoPago(e.target.value)}
                    className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2.5 bg-slate-50 focus:bg-white focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 outline-none transition font-medium"
                  >
                    <option value="efectivo">Efectivo</option>
                    <option value="debito">Débito</option>
                    <option value="credito">Crédito</option>
                    <option value="transferencia">Transferencia</option>
                  </select>
                </div>

                <div className="bg-slate-50/60 border border-slate-200 rounded-lg p-4 space-y-2">
                  <div className="flex justify-between items-center text-sm">
                    <span className="font-medium text-slate-500">
                      Margen estimado
                    </span>
                    <span className="text-emerald-600 font-bold tabular-nums">
                      +{fmtMoney(gananciaCarrito)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t border-slate-200/60">
                    <span className="font-bold text-slate-700">
                      Total a Cobrar
                    </span>
                    <strong className="text-slate-900 text-2xl font-black tabular-nums">
                      {fmtMoney(totalCarrito)}
                    </strong>
                  </div>
                </div>

                <button
                  onClick={handleVenta}
                  disabled={cargando}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 transition text-white py-3 rounded-lg font-bold disabled:opacity-50 active:scale-[0.99]"
                >
                  {cargando ? "Procesando..." : "Confirmar Venta (F9)"}
                </button>
              </div>
            </div>

            {/* TICKET */}
            {ventaSeleccionada && (
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
                <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
                  <h3 className="text-base font-bold text-slate-900">
                    Vista de Ticket
                  </h3>
                  <button
                    onClick={() => setVentaSeleccionada(null)}
                    className="text-xs font-semibold text-slate-500 hover:text-slate-700"
                  >
                    Cerrar ×
                  </button>
                </div>

                <div className="p-6">
                  <div
                    ref={ticketRef}
                    className="max-w-sm mx-auto text-slate-900 bg-white p-4 rounded-lg border border-dashed border-slate-300"
                  >
                    <h1 className="text-2xl font-black text-center tracking-tight">
                      DIETÉTICA
                    </h1>
                    <p className="text-center text-xs text-slate-500 mt-1">
                      {new Date(ventaSeleccionada.fecha).toLocaleString("es-AR")}
                    </p>
                    <hr className="my-3 border-dashed border-slate-300" />

                    {ventaSeleccionada.items.map((item, i) => {
                      const cant = Number(item.cantidad || 0);
                      const desc = Number(item.descuento || 0);
                      const unit =
                        item.precioFinal != null
                          ? Number(item.precioFinal)
                          : Number(item.precioUnitario || item.precioVenta || 0) *
                            (1 - desc / 100);
                      const totalItem =
                        item.total != null ? Number(item.total) : unit * cant;
                      return (
                        <div key={i} className="mb-2 text-sm">
                          <div className="flex justify-between font-bold text-slate-800">
                            <span>{item.nombre}</span>
                            <span className="tabular-nums">{fmtMoney(totalItem)}</span>
                          </div>
                          <div className="text-xs text-slate-500 tabular-nums">
                            {fmtMoney(unit)} × {cant}
                          </div>
                        </div>
                      );
                    })}

                    <hr className="my-3 border-dashed border-slate-300" />
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between text-slate-600">
                        <span>Método de pago</span>
                        <span className="capitalize font-semibold">
                          {ventaSeleccionada.metodoPago}
                        </span>
                      </div>
                      <div className="flex justify-between font-black text-slate-900 pt-1">
                        <span>TOTAL COBRADO</span>
                        <span className="tabular-nums">
                          {fmtMoney(ventaSeleccionada.total)}
                        </span>
                      </div>
                    </div>
                    <p className="text-center mt-5 text-xs font-bold uppercase tracking-wider text-slate-400">
                      ¡Gracias por su compra!
                    </p>
                  </div>

                  <button
                    onClick={handlePrint}
                    className="mt-4 w-full bg-slate-900 hover:bg-slate-800 transition text-white py-2.5 rounded-lg font-semibold text-sm"
                  >
                    Imprimir Ticket
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default VentasPage;
