import { useState, useEffect, useMemo, useCallback } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { getProductos, getVentas, getCategorias } from "../api/api";

const fmtMoney = (n) =>
  "$" + Number(n || 0).toLocaleString("es-AR", { maximumFractionDigits: 0 });

const fmtMoneyDec = (n) =>
  "$" +
  Number(n || 0).toLocaleString("es-AR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

// Formato local YYYY-MM-DD (NO toISOString: corre por timezone)
const fmtFecha = (d) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

const DIA_MS = 86400000;

// "1.200 g" suelto / "45 unidades" envasado (default unidades)
const stockLabel = (prod) => {
  const c = Number(prod?.cantidad || 0);
  const num = c.toLocaleString("es-AR", { maximumFractionDigits: 0 });
  return prod?.tipo === "suelto" ? `${num} g` : `${num} unidades`;
};

// "~5/día" (>=1 entero) / "~0,3/día" (<1 un decimal)
const velocidadLabel = (v) =>
  v >= 1
    ? `~${Math.round(v)}/día`
    : `~${v.toLocaleString("es-AR", {
        minimumFractionDigits: 1,
        maximumFractionDigits: 1,
      })}/día`;

// Badge días restantes: <3 rojo, 3-7 ámbar, 7-14 amarillo claro. 0 → "Hoy".
const diasBadge = (dias) => {
  const d = Math.floor(dias);
  const txt = d <= 0 ? "Hoy" : `${d} días`;
  if (d < 3)
    return {
      cls: "bg-rose-50 text-rose-700 border-rose-200",
      label: `Crítico — ${txt}`,
    };
  if (d < 7)
    return {
      cls: "bg-amber-50 text-amber-700 border-amber-200",
      label: `Urgente — ${txt}`,
    };
  return {
    cls: "bg-yellow-50 text-yellow-700 border-yellow-200",
    label: `Reponer — ${txt}`,
  };
};

// Devuelve { desde, hasta, desdeAnt, hastaAnt } en strings YYYY-MM-DD.
// Período actual + período inmediatamente anterior para comparativa.
const calcRangos = (periodo, customDesde, customHasta) => {
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  const y = hoy.getFullYear();
  const m = hoy.getMonth();
  const d = hoy.getDate();

  let desde, hasta, desdeAnt, hastaAnt;

  switch (periodo) {
    case "hoy": {
      desde = hoy;
      hasta = hoy;
      const ayer = new Date(y, m, d - 1);
      desdeAnt = ayer;
      hastaAnt = ayer;
      break;
    }
    case "semana": {
      const dow = hoy.getDay(); // 0=dom..6=sab
      const offLun = (dow + 6) % 7; // días desde el lunes
      const lunes = new Date(y, m, d - offLun);
      desde = lunes;
      hasta = hoy;
      desdeAnt = new Date(y, m, d - offLun - 7); // lunes semana previa
      hastaAnt = new Date(y, m, d - offLun - 1); // domingo previo
      break;
    }
    case "mes": {
      desde = new Date(y, m, 1);
      hasta = hoy;
      desdeAnt = new Date(y, m - 1, 1); // 1º mes anterior
      hastaAnt = new Date(y, m, 0); // último día mes anterior
      break;
    }
    case "mes_pasado": {
      desde = new Date(y, m - 1, 1);
      hasta = new Date(y, m, 0);
      desdeAnt = new Date(y, m - 2, 1); // mes antes de ese
      hastaAnt = new Date(y, m - 1, 0);
      break;
    }
    case "custom": {
      const dDesde = new Date(customDesde + "T00:00:00");
      const dHasta = new Date(customHasta + "T00:00:00");
      desde = dDesde;
      hasta = dHasta;
      const dias = Math.round((dHasta - dDesde) / DIA_MS) + 1; // inclusivo
      hastaAnt = new Date(dDesde.getTime() - DIA_MS); // día previo al desde
      desdeAnt = new Date(dDesde.getTime() - dias * DIA_MS); // misma duración
      break;
    }
    default:
      desde = new Date(y, m, 1);
      hasta = hoy;
      desdeAnt = new Date(y, m - 1, 1);
      hastaAnt = new Date(y, m, 0);
  }

  return {
    desde: fmtFecha(desde),
    hasta: fmtFecha(hasta),
    desdeAnt: fmtFecha(desdeAnt),
    hastaAnt: fmtFecha(hastaAnt),
  };
};

// % de variación. anterior===0 → null (nunca ∞ ni NaN).
const variacion = (actual, anterior) =>
  !anterior ? null : ((actual - anterior) / anterior) * 100;

// No renderiza nada si pct es null.
const Comparativa = ({ pct }) => {
  if (pct === null || pct === undefined || Number.isNaN(pct)) return null;
  const sube = pct >= 0;
  const cls = sube ? "text-emerald-600" : "text-rose-600";
  const flecha = sube ? "↑" : "↓";
  const signo = sube ? "+" : "";
  return (
    <p className={`mt-1 text-xs font-medium ${cls}`}>
      {flecha} {signo}
      {pct.toLocaleString("es-AR", {
        minimumFractionDigits: 1,
        maximumFractionDigits: 1,
      })}
      % vs período anterior
    </p>
  );
};

const PERIODOS = [
  { key: "hoy", label: "Hoy" },
  { key: "semana", label: "Esta semana" },
  { key: "mes", label: "Este mes" },
  { key: "mes_pasado", label: "Mes pasado" },
  { key: "custom", label: "Personalizado" },
];

// indigo, emerald, amber, rose, sky, violet, orange, teal (-500). Se cicla.
const PALETA_CAT = [
  "#6366f1",
  "#10b981",
  "#f59e0b",
  "#f43f5e",
  "#0ea5e9",
  "#8b5cf6",
  "#f97316",
  "#14b8a6",
];

const CatTooltip = ({ active, payload, total }) => {
  if (!active || !payload || !payload.length) return null;
  const { nombre, valor } = payload[0].payload;
  const pct = total > 0 ? (valor / total) * 100 : 0;
  return (
    <div className="bg-white border border-slate-200 rounded-lg shadow-md px-3 py-2 text-xs">
      <p className="font-semibold text-slate-800">{nombre}</p>
      <p className="text-slate-600 tabular-nums">
        {fmtMoneyDec(valor)}{" "}
        <span className="text-slate-400">
          (
          {pct.toLocaleString("es-AR", {
            minimumFractionDigits: 1,
            maximumFractionDigits: 1,
          })}
          %)
        </span>
      </p>
    </div>
  );
};

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
    <span
      className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-md border ${cls}`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70" />
      {label}
    </span>
  );
};

const Kpi = ({ label, value, sub, accent, icon, comp }) => (
  <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-shadow">
    <div className="flex items-start justify-between">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
          {label}
        </p>
        <p className="mt-2 text-3xl font-black text-slate-900 leading-none">
          {value}
        </p>
        {comp}
        {sub && <p className="mt-2 text-xs text-slate-500">{sub}</p>}
      </div>
      <div className={`w-10 h-10 rounded-lg grid place-items-center ${accent}`}>
        {icon}
      </div>
    </div>
  </div>
);

const ReportesPage = () => {
  const [productos, setProductos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [ventas, setVentas] = useState([]);
  const [ventasAnterior, setVentasAnterior] = useState([]);
  const [ventasUltimos30, setVentasUltimos30] = useState([]);
  const [periodo, setPeriodo] = useState("mes");
  const [customDesde, setCustomDesde] = useState("");
  const [customHasta, setCustomHasta] = useState("");
  const [cargando, setCargando] = useState(true);
  const [busqueda, setBusqueda] = useState("");
  const [tabTop, setTabTop] = useState("vendidos");
  const [tabCategoria, setTabCategoria] = useState("ganancia");

  const cargarDatos = useCallback(async () => {
    // custom no dispara si falta alguna de las dos fechas
    if (periodo === "custom" && (!customDesde || !customHasta)) return;
    const { desde, hasta, desdeAnt, hastaAnt } = calcRangos(
      periodo,
      customDesde,
      customHasta
    );
    // Ventana FIJA 30 días para rotación (independiente del filtro de período).
    // local-time con fmtFecha, NUNCA toISOString.
    const hoyDate = new Date();
    hoyDate.setHours(0, 0, 0, 0);
    const desde30 = fmtFecha(new Date(hoyDate.getTime() - 30 * DIA_MS));
    const hasta30 = fmtFecha(hoyDate);
    try {
      setCargando(true);
      const [prodRes, catRes, ventasRes, ventasAntRes, ventas30Res] =
        await Promise.all([
          getProductos(),
          getCategorias(),
          getVentas({ desde, hasta }),
          getVentas({ desde: desdeAnt, hasta: hastaAnt }),
          getVentas({ desde: desde30, hasta: hasta30 }),
        ]);
      setProductos(Array.isArray(prodRes) ? prodRes : []);
      setCategorias(Array.isArray(catRes) ? catRes : []);
      setVentas(Array.isArray(ventasRes) ? ventasRes : []);
      setVentasAnterior(Array.isArray(ventasAntRes) ? ventasAntRes : []);
      setVentasUltimos30(Array.isArray(ventas30Res) ? ventas30Res : []);
    } catch (err) {
      console.error("Error al cargar reportes:", err);
      setProductos([]);
      setCategorias([]);
      setVentas([]);
      setVentasAnterior([]);
      setVentasUltimos30([]);
    } finally {
      setCargando(false);
    }
  }, [periodo, customDesde, customHasta]);

  useEffect(() => {
    cargarDatos();
  }, [cargarDatos]);

  const ingresosTotales = useMemo(
    () => ventas.reduce((acc, v) => acc + Number(v?.total || 0), 0),
    [ventas]
  );

  const gananciasTotales = useMemo(() => {
    return ventas.reduce((acc, venta) => {
      const items = Array.isArray(venta?.items) ? venta.items : [];
      return (
        acc +
        items.reduce((sub, it) => {
          const pv = Number(it?.precioUnitario || 0);
          const pc = Number(it?.precioCompraUnitario || 0);
          const desc = Number(it?.descuento || 0);
          const cant = Number(it?.cantidad || 0);
          return sub + (pv - pc) * cant * (1 - desc / 100);
        }, 0)
      );
    }, 0);
  }, [ventas]);

  const margenPct = useMemo(() => {
    if (!ingresosTotales) return 0;
    return (gananciasTotales / ingresosTotales) * 100;
  }, [gananciasTotales, ingresosTotales]);

  const ingresosAnterior = useMemo(
    () => ventasAnterior.reduce((acc, v) => acc + Number(v?.total || 0), 0),
    [ventasAnterior]
  );

  const gananciasAnterior = useMemo(() => {
    return ventasAnterior.reduce((acc, venta) => {
      const items = Array.isArray(venta?.items) ? venta.items : [];
      return (
        acc +
        items.reduce((sub, it) => {
          const pv = Number(it?.precioUnitario || 0);
          const pc = Number(it?.precioCompraUnitario || 0);
          const desc = Number(it?.descuento || 0);
          const cant = Number(it?.cantidad || 0);
          return sub + (pv - pc) * cant * (1 - desc / 100);
        }, 0)
      );
    }, 0);
  }, [ventasAnterior]);

  const valorInventario = useMemo(() => {
    return productos.reduce((acc, p) => {
      const precio = Number(
        p?.precioCompra || p?.precio || p?.precioUnitario || 0
      );
      const cant = Number(p?.cantidad || 0);
      return acc + precio * cant;
    }, 0);
  }, [productos]);

  const productosAgotados = useMemo(
    () => productos.filter((p) => Number(p?.cantidad || 0) === 0).length,
    [productos]
  );

  const productosCriticos = useMemo(
    () =>
      productos.filter((p) => {
        const c = Number(p?.cantidad || 0);
        return c > 0 && c < 10;
      }).length,
    [productos]
  );

  const productosTop = useMemo(() => {
    const ranking = {};
    ventas.forEach((venta) => {
      const items = Array.isArray(venta?.items) ? venta.items : [];
      items.forEach((item) => {
        const key = item?.productoId ?? item?.nombre ?? "Desconocido";
        const cantidad = Number(item?.cantidad) || 0;
        if (!ranking[key]) {
          ranking[key] = {
            nombre: item?.nombre || "Desconocido",
            cantidad: 0,
          };
        }
        ranking[key].cantidad += cantidad;
      });
    });
    return Object.values(ranking)
      .sort((a, b) => b.cantidad - a.cantidad)
      .slice(0, 5);
  }, [ventas]);

  const productosTopGanancia = useMemo(() => {
    const ranking = {};
    ventas.forEach((venta) => {
      const items = Array.isArray(venta?.items) ? venta.items : [];
      items.forEach((item) => {
        const key = item?.productoId ?? item?.nombre ?? "Desconocido";
        const pv = Number(item?.precioUnitario || 0);
        const pc = Number(item?.precioCompraUnitario || 0);
        const desc = Number(item?.descuento || 0);
        const cant = Number(item?.cantidad || 0);
        const ganancia = (pv - pc) * cant * (1 - desc / 100);
        if (!ranking[key]) {
          ranking[key] = {
            nombre: item?.nombre || "Desconocido",
            ganancia: 0,
          };
        }
        ranking[key].ganancia += ganancia;
      });
    });
    return Object.values(ranking)
      .sort((a, b) => b.ganancia - a.ganancia)
      .slice(0, 5);
  }, [ventas]);

  // Resuelve nombre legible de categoría. Cubre: objeto, id, string crudo,
  // producto borrado/inexistente o id no resoluble → "Sin categoría".
  const resolverCategoria = useCallback(
    (prod) => {
      if (!prod) return "Sin categoría";
      const c = prod.categoria;
      if (c && typeof c === "object") return c.nombre || "Sin categoría";
      const catId = prod.categoria ?? prod.categoriaId;
      const found = categorias.find((x) => String(x.id) === String(catId));
      if (found) return found.nombre;
      if (typeof c === "string" && c.trim()) return c;
      return "Sin categoría";
    },
    [categorias]
  );

  const ingresoPorCategoria = useMemo(() => {
    const map = {};
    ventas.forEach((v) => {
      const items = Array.isArray(v?.items) ? v.items : [];
      items.forEach((it) => {
        const prod = productos.find((p) => p.id === it.productoId);
        const cat = resolverCategoria(prod);
        map[cat] = (map[cat] || 0) + Number(it?.subtotal || 0); // subtotal ya con descuento
      });
    });
    return Object.entries(map)
      .map(([nombre, valor]) => ({ nombre, valor }))
      .sort((a, b) => b.valor - a.valor);
  }, [ventas, productos, resolverCategoria]);

  const gananciaPorCategoria = useMemo(() => {
    const map = {};
    ventas.forEach((v) => {
      const items = Array.isArray(v?.items) ? v.items : [];
      items.forEach((it) => {
        const prod = productos.find((p) => p.id === it.productoId);
        const cat = resolverCategoria(prod);
        const pv = Number(it?.precioUnitario || 0);
        const pc = Number(it?.precioCompraUnitario || 0);
        const desc = Number(it?.descuento || 0);
        const cant = Number(it?.cantidad || 0);
        map[cat] = (map[cat] || 0) + (pv - pc) * cant * (1 - desc / 100);
      });
    });
    return Object.entries(map)
      .map(([nombre, valor]) => ({ nombre, valor }))
      .sort((a, b) => b.valor - a.valor);
  }, [ventas, productos, resolverCategoria]);

  const reposicionUrgente = useMemo(() => {
    return productos
      .filter((p) => Number(p?.cantidad || 0) < 10)
      .sort(
        (a, b) => Number(a?.cantidad || 0) - Number(b?.cantidad || 0)
      )
      .slice(0, 8);
  }, [productos]);

  // Cantidad vendida por productoId en la ventana fija de 30 días.
  const cantidadPorProducto30 = useMemo(() => {
    const map = {};
    ventasUltimos30.forEach((v) => {
      const items = Array.isArray(v?.items) ? v.items : [];
      items.forEach((it) => {
        const id = it?.productoId;
        if (id == null) return;
        map[id] = (map[id] || 0) + Number(it?.cantidad || 0);
      });
    });
    return map;
  }, [ventasUltimos30]);

  // Productos con stock>0 y SIN ventas en 30 días. Sort por stock desc.
  const productosDormidos = useMemo(() => {
    return productos
      .filter((p) => {
        const stock = Number(p?.cantidad || 0);
        const vendido = cantidadPorProducto30[p.id] || 0;
        return stock > 0 && vendido === 0;
      })
      .map((p) => {
        const stock = Number(p?.cantidad || 0);
        const pc = Number(p?.precioCompra || 0);
        return { ...p, valorEstancado: stock * pc };
      })
      .sort((a, b) => Number(b?.cantidad || 0) - Number(a?.cantidad || 0));
  }, [productos, cantidadPorProducto30]);

  // Productos con velocidad>0 y <14 días de stock al ritmo actual. Sort asc.
  const reposicionInteligente = useMemo(() => {
    return productos
      .map((p) => {
        const stock = Number(p?.cantidad || 0);
        const vendido = cantidadPorProducto30[p.id] || 0;
        const velocidadDiaria = vendido / 30;
        const diasRestantes =
          velocidadDiaria > 0 ? stock / velocidadDiaria : Infinity;
        return { ...p, velocidadDiaria, diasRestantes };
      })
      .filter((p) => p.velocidadDiaria > 0 && p.diasRestantes < 14)
      .sort((a, b) => a.diasRestantes - b.diasRestantes);
  }, [productos, cantidadPorProducto30]);

  const productosFiltrados = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    if (!q) return productos;
    return productos.filter((p) =>
      p?.nombre?.toLowerCase().includes(q)
    );
  }, [productos, busqueda]);

  // Loader completo SOLO en primera carga real (sin datos previos)
  if (cargando && ventas.length === 0 && productos.length === 0) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-slate-200 border-t-emerald-600 rounded-full animate-spin" />
          <p className="text-sm font-semibold text-slate-600">
            Cargando reportes...
          </p>
        </div>
      </div>
    );
  }

  const hoy = new Date().toLocaleDateString("es-AR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  // stale-while-revalidate: datos viejos atenuados mientras llega lo nuevo
  const atenuado =
    cargando && (ventas.length > 0 || productos.length > 0)
      ? "opacity-60"
      : "opacity-100";

  const dataCat =
    tabCategoria === "ingreso" ? ingresoPorCategoria : gananciaPorCategoria;
  const totalCat = dataCat.reduce((a, d) => a + d.valor, 0);

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      {/* HEADER */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6 py-6 flex items-end justify-between flex-wrap gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-emerald-600">
              Panel de Control
            </p>
            <h1 className="mt-1 text-3xl font-black text-slate-900">
              Reportes &amp; Inventario
            </h1>
            <p className="mt-1 text-sm text-slate-500 capitalize">{hoy}</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-2 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-md">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Datos en vivo
            </span>
            <button
              onClick={cargarDatos}
              className="text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 px-3 py-1.5 rounded-md transition"
            >
              Actualizar
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        {/* FILTRO DE PERÍODO */}
        <div className="flex flex-wrap items-center gap-2">
          {PERIODOS.map((p) => (
            <button
              key={p.key}
              onClick={() => setPeriodo(p.key)}
              disabled={cargando}
              className={`text-sm font-semibold px-4 py-1.5 rounded-full transition ${
                periodo === p.key
                  ? "bg-emerald-600 text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              } ${cargando ? "cursor-not-allowed opacity-70" : ""}`}
            >
              {p.label}
            </button>
          ))}
          {periodo === "custom" && (
            <div className="flex flex-wrap items-center gap-2 ml-1">
              <input
                type="date"
                value={customDesde}
                onChange={(e) => setCustomDesde(e.target.value)}
                className="text-sm border border-slate-200 rounded-lg px-3 py-1.5 bg-white focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 outline-none transition"
              />
              <span className="text-sm text-slate-400">→</span>
              <input
                type="date"
                value={customHasta}
                onChange={(e) => setCustomHasta(e.target.value)}
                className="text-sm border border-slate-200 rounded-lg px-3 py-1.5 bg-white focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 outline-none transition"
              />
            </div>
          )}
        </div>

        {/* KPIs */}
        <div
          className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 transition-opacity duration-200 ${atenuado}`}
        >
          <Kpi
            label="Ingresos Totales"
            value={fmtMoney(ingresosTotales)}
            comp={<Comparativa pct={variacion(ingresosTotales, ingresosAnterior)} />}
            sub={`${ventas.length} ventas registradas`}
            accent="bg-emerald-50 text-emerald-600"
            icon={
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8V6m0 12v-2"
                />
              </svg>
            }
          />
          <Kpi
            label="Ganancia Neta"
            value={fmtMoney(gananciasTotales)}
            comp={<Comparativa pct={variacion(gananciasTotales, gananciasAnterior)} />}
            sub={`Margen ${margenPct.toFixed(1)}%`}
            accent="bg-emerald-50 text-emerald-600"
            icon={
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                />
              </svg>
            }
          />
          <Kpi
            label="Valor de Inventario"
            value={fmtMoney(valorInventario)}
            sub={`${productos.length} productos`}
            accent="bg-sky-50 text-sky-600"
            icon={
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                />
              </svg>
            }
          />
          <Kpi
            label="Alertas de Stock"
            value={productosAgotados + productosCriticos}
            sub={`${productosAgotados} agotados · ${productosCriticos} bajos`}
            accent="bg-rose-50 text-rose-600"
            icon={
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            }
          />
        </div>

        {/* TOP + REPOSICION */}
        <div
          className={`grid grid-cols-1 lg:grid-cols-5 gap-6 transition-opacity duration-200 ${atenuado}`}
        >
          {/* TOP 5 */}
          <div className="lg:col-span-3 bg-white rounded-xl border border-slate-200 shadow-sm">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between gap-4 flex-wrap">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  {tabTop === "vendidos"
                    ? "Productos más vendidos"
                    : "Productos más rentables"}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {tabTop === "vendidos"
                    ? "Top 5 por unidades vendidas"
                    : "Top 5 por ganancia generada"}
                </p>
              </div>
              <div className="inline-flex bg-slate-100 p-1 rounded-lg text-xs font-semibold">
                <button
                  onClick={() => setTabTop("vendidos")}
                  className={`px-3 py-1.5 rounded-md transition ${
                    tabTop === "vendidos"
                      ? "bg-white text-slate-900 shadow-sm"
                      : "text-slate-500 hover:text-slate-700"
                  }`}
                >
                  Más vendidos
                </button>
                <button
                  onClick={() => setTabTop("rentables")}
                  className={`px-3 py-1.5 rounded-md transition ${
                    tabTop === "rentables"
                      ? "bg-white text-slate-900 shadow-sm"
                      : "text-slate-500 hover:text-slate-700"
                  }`}
                >
                  Más rentables
                </button>
              </div>
            </div>
            <div className="p-6 space-y-4">
              {(() => {
                const lista =
                  tabTop === "vendidos" ? productosTop : productosTopGanancia;
                const getValor = (p) =>
                  tabTop === "vendidos" ? p.cantidad : p.ganancia;

                if (lista.length === 0) {
                  return (
                    <div className="text-center py-12 text-sm text-slate-400">
                      Sin ventas registradas todavía
                    </div>
                  );
                }

                const max = getValor(lista[0]) || 1;

                return lista.map((p, i) => {
                  const valor = getValor(p);
                  const pct = max > 0 ? (valor / max) * 100 : 0;
                  return (
                    <div key={i}>
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-3">
                          <span
                            className={`text-xs font-black w-6 h-6 grid place-items-center rounded-md ${
                              i === 0
                                ? "bg-amber-100 text-amber-700"
                                : i === 1
                                ? "bg-slate-200 text-slate-700"
                                : i === 2
                                ? "bg-orange-100 text-orange-700"
                                : "bg-slate-100 text-slate-500"
                            }`}
                          >
                            {i + 1}
                          </span>
                          <span className="text-sm font-semibold text-slate-800">
                            {p.nombre}
                          </span>
                        </div>
                        <span className="text-sm font-bold text-slate-900 tabular-nums">
                          {tabTop === "vendidos" ? (
                            <>
                              {p.cantidad}{" "}
                              <span className="text-xs font-medium text-slate-400">
                                u.
                              </span>
                            </>
                          ) : (
                            fmtMoneyDec(p.ganancia)
                          )}
                        </span>
                      </div>
                      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all bg-gradient-to-r ${
                            tabTop === "vendidos"
                              ? "from-emerald-500 to-emerald-600"
                              : "from-emerald-500 to-emerald-600"
                          }`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                });
              })()}
            </div>
          </div>

          {/* REPOSICION URGENTE */}
          <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Reposición urgente
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Stock por debajo de 10 unidades
                </p>
              </div>
              {reposicionUrgente.length > 0 && (
                <span className="text-[11px] font-bold uppercase tracking-wider text-rose-600 bg-rose-50 px-2.5 py-1 rounded-md">
                  {reposicionUrgente.length}
                </span>
              )}
            </div>
            <div className="divide-y divide-slate-100 max-h-[420px] overflow-y-auto">
              {reposicionUrgente.length > 0 ? (
                reposicionUrgente.map((p) => (
                  <div
                    key={p.id}
                    className="px-6 py-3 flex items-center justify-between hover:bg-slate-50 transition"
                  >
                    <span className="text-sm font-medium text-slate-800 truncate pr-3">
                      {p.nombre}
                    </span>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-sm font-bold text-slate-900 tabular-nums">
                        {Number(p.cantidad || 0)}
                      </span>
                      <StockBadge cantidad={p.cantidad} />
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-12 px-6">
                  <div className="inline-flex w-12 h-12 rounded-full bg-emerald-50 items-center justify-center mb-3">
                    <svg
                      className="w-6 h-6 text-emerald-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  </div>
                  <p className="text-sm font-bold text-slate-800">
                    Stock al día
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    Ningún producto debajo de 10 u.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* GANANCIA/INGRESO POR CATEGORIA */}
        <div
          className={`bg-white rounded-xl border border-slate-200 shadow-sm transition-opacity duration-200 ${atenuado}`}
        >
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between gap-4 flex-wrap">
            <div>
              <h3 className="text-base font-bold text-slate-900">
                {tabCategoria === "ingreso"
                  ? "Ingreso por Categoría"
                  : "Ganancia por Categoría"}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Distribución del período seleccionado
              </p>
            </div>
            <div className="inline-flex bg-slate-100 p-1 rounded-lg text-xs font-semibold">
              <button
                onClick={() => setTabCategoria("ingreso")}
                className={`px-3 py-1.5 rounded-md transition ${
                  tabCategoria === "ingreso"
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                Ingreso
              </button>
              <button
                onClick={() => setTabCategoria("ganancia")}
                className={`px-3 py-1.5 rounded-md transition ${
                  tabCategoria === "ganancia"
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                Ganancia
              </button>
            </div>
          </div>

          <div className="p-6">
            {dataCat.length === 0 ? (
              <div className="text-center py-12 text-sm text-slate-400">
                Sin ventas en el período seleccionado
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                {/* DONA */}
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={dataCat}
                        dataKey="valor"
                        nameKey="nombre"
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={2}
                      >
                        {dataCat.map((_, i) => (
                          <Cell
                            key={i}
                            fill={PALETA_CAT[i % PALETA_CAT.length]}
                          />
                        ))}
                      </Pie>
                      <Tooltip content={<CatTooltip total={totalCat} />} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                {/* LEYENDA */}
                <div className="space-y-2">
                  {dataCat.map((d, i) => {
                    const pct = totalCat > 0 ? (d.valor / totalCat) * 100 : 0;
                    return (
                      <div
                        key={i}
                        className="flex items-center justify-between gap-3"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span
                            className="w-3 h-3 rounded-sm shrink-0"
                            style={{
                              background: PALETA_CAT[i % PALETA_CAT.length],
                            }}
                          />
                          <span className="text-sm font-medium text-slate-700 truncate">
                            {d.nombre}
                          </span>
                        </div>
                        <span className="text-sm tabular-nums shrink-0">
                          <span className="font-bold text-slate-900">
                            {fmtMoneyDec(d.valor)}
                          </span>{" "}
                          <span className="text-xs text-slate-400">
                            (
                            {pct.toLocaleString("es-AR", {
                              minimumFractionDigits: 1,
                              maximumFractionDigits: 1,
                            })}
                            %)
                          </span>
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ROTACIÓN DE INVENTARIO — ventana FIJA 30 días, ignora filtro de período */}
        <div
          className={`bg-white rounded-xl border border-slate-200 shadow-sm transition-opacity duration-200 ${atenuado}`}
        >
          {/* HEADER */}
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between gap-4 flex-wrap">
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Rotación de Inventario
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Análisis sobre los últimos 30 días
              </p>
            </div>
            {/* pill informativo, no clickeable */}
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 bg-slate-100 px-2.5 py-1 rounded-md cursor-default select-none">
              Últimos 30 días
            </span>
          </div>

          {/* BODY — 2 columnas */}
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* IZQUIERDA — Productos dormidos */}
            <div>
              <h4 className="text-sm font-bold text-slate-800">
                Productos dormidos
              </h4>
              <p className="text-xs text-slate-500 mt-0.5 mb-4">
                Sin ventas en los últimos 30 días
              </p>
              {productosDormidos.length === 0 ? (
                <div className="text-center py-10 px-6">
                  <div className="inline-flex w-12 h-12 rounded-full bg-emerald-50 items-center justify-center mb-3">
                    <svg
                      className="w-6 h-6 text-emerald-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  </div>
                  <p className="text-sm font-bold text-slate-800">
                    ¡Todo el inventario rota!
                  </p>
                </div>
              ) : (
                <div className="space-y-1">
                  {productosDormidos.slice(0, 8).map((p) => (
                    <div
                      key={p.id}
                      className="flex items-center justify-between gap-3 py-2 border-b border-slate-50 last:border-0"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-slate-800 truncate">
                          {p.nombre}
                        </p>
                        <p className="text-xs text-slate-500">
                          {stockLabel(p)}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-[11px] uppercase tracking-wider text-slate-400">
                          Valor estancado
                        </p>
                        <p className="text-sm font-bold text-slate-900 tabular-nums">
                          {fmtMoneyDec(p.valorEstancado)}
                        </p>
                      </div>
                    </div>
                  ))}
                  {productosDormidos.length > 8 && (
                    <p className="text-xs text-slate-400 pt-2">
                      +{productosDormidos.length - 8} más
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* DERECHA — Reposición inteligente */}
            <div>
              <h4 className="text-sm font-bold text-slate-800">
                Reposición inteligente
              </h4>
              <p className="text-xs text-slate-500 mt-0.5 mb-4">
                Productos por agotarse al ritmo actual
              </p>
              {reposicionInteligente.length === 0 ? (
                <div className="text-center py-10 px-6">
                  <div className="inline-flex w-12 h-12 rounded-full bg-emerald-50 items-center justify-center mb-3">
                    <svg
                      className="w-6 h-6 text-emerald-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  </div>
                  <p className="text-sm font-bold text-slate-800">
                    Sin reposiciones urgentes
                  </p>
                </div>
              ) : (
                <div className="space-y-1">
                  {reposicionInteligente.slice(0, 8).map((p) => {
                    const b = diasBadge(p.diasRestantes);
                    return (
                      <div
                        key={p.id}
                        className="flex items-center justify-between gap-3 py-2 border-b border-slate-50 last:border-0"
                      >
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-slate-800 truncate">
                            {p.nombre}
                          </p>
                          <p className="text-xs text-slate-400">
                            {velocidadLabel(p.velocidadDiaria)} · {stockLabel(p)}
                          </p>
                        </div>
                        <span
                          className={`text-xs font-semibold px-2.5 py-1 rounded-md border shrink-0 ${b.cls}`}
                        >
                          {b.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* TABLA INVENTARIO */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between gap-4 flex-wrap">
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Inventario general
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Catálogo completo con estado de stock
              </p>
            </div>
            <div className="relative">
              <svg
                className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              <input
                type="text"
                placeholder="Buscar producto..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg bg-slate-50 focus:bg-white focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 outline-none transition w-64"
              />
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50/60 border-b border-slate-200">
                <tr className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  <th className="px-6 py-3 text-left">Producto</th>
                  <th className="px-6 py-3 text-right">Precio</th>
                  <th className="px-6 py-3 text-right">Stock</th>
                  <th className="px-6 py-3 text-right">Valor</th>
                  <th className="px-6 py-3 text-right">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {productosFiltrados.length > 0 ? (
                  productosFiltrados.map((p) => {
                    const precio = Number(
                      p?.precioUnitario ||
                        p?.precioPorGramo ||
                        p?.precio ||
                        0
                    );
                    const precioCompra = Number(
                      p?.precioCompra || precio || 0
                    );
                    const cantidad = Number(p?.cantidad || 0);
                    const valor = precioCompra * cantidad;
                    return (
                      <tr
                        key={p.id}
                        className="hover:bg-slate-50/60 transition"
                      >
                        <td className="px-6 py-3.5">
                          <p className="font-semibold text-slate-800">
                            {p.nombre}
                          </p>
                        </td>
                        <td className="px-6 py-3.5 text-right text-slate-700 tabular-nums">
                          {fmtMoney(precio)}
                        </td>
                        <td className="px-6 py-3.5 text-right">
                          <span
                            className={`font-bold tabular-nums ${
                              cantidad === 0
                                ? "text-rose-600"
                                : cantidad < 10
                                ? "text-amber-600"
                                : "text-slate-800"
                            }`}
                          >
                            {cantidad}
                          </span>
                        </td>
                        <td className="px-6 py-3.5 text-right text-slate-600 tabular-nums">
                          {fmtMoney(valor)}
                        </td>
                        <td className="px-6 py-3.5 text-right">
                          <StockBadge cantidad={cantidad} />
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td
                      colSpan="5"
                      className="px-6 py-16 text-center text-sm text-slate-400"
                    >
                      {busqueda
                        ? "Sin resultados para tu búsqueda"
                        : "No hay productos registrados"}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="px-6 py-3 bg-slate-50/60 border-t border-slate-200 text-xs text-slate-500 flex justify-between">
            <span>
              Mostrando{" "}
              <strong className="text-slate-700">
                {productosFiltrados.length}
              </strong>{" "}
              de{" "}
              <strong className="text-slate-700">{productos.length}</strong>{" "}
              productos
            </span>
            <span>
              Valor total catálogo:{" "}
              <strong className="text-slate-700">
                {fmtMoney(valorInventario)}
              </strong>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportesPage;
