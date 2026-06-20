import { useState, useEffect } from "react";
import { getCategorias, getProveedores } from "../api/api";

const ProductoForm = ({ onSave, productoInicial, onClose }) => {
  const [nombre, setNombre] = useState("");
  const [precioCompra, setPrecioCompra] = useState("");
  const [precioVenta, setPrecioVenta] = useState("");
  const [cantidad, setCantidad] = useState("");
  const [tipo, setTipo] = useState("envasado");

  const [categoriaId, setCategoriaId] = useState("");
  const [proveedorId, setProveedorId] = useState("");
  const [fechaVencimiento, setFechaVencimiento] = useState("");

  const [categorias, setCategorias] = useState([]);
  const [proveedores, setProveedores] = useState([]);

  useEffect(() => {
    const cargarSelectores = async () => {
      try {
        const [dataCats, dataProvs] = await Promise.all([
          getCategorias(),
          getProveedores(),
        ]);

        setCategorias(dataCats);
        setProveedores(dataProvs);
      } catch (error) {
        console.error("Error al cargar selectores:", error);
      }
    };

    cargarSelectores();
  }, []);

  useEffect(() => {
    if (productoInicial) {
      setNombre(productoInicial.nombre || "");
      setPrecioCompra(productoInicial.precioCompra || "");
      setPrecioVenta(
        productoInicial.precioVenta ||
        productoInicial.precioUnitario ||
        productoInicial.precioPorGramo ||
        ""
      );
      setCantidad(productoInicial.cantidad || 0);
      setTipo(productoInicial.tipo?.toLowerCase() || "envasado");

      setCategoriaId(
        productoInicial.categoria?.id ||
        productoInicial.categoria ||
        productoInicial.categoriaId ||
        ""
      );

      setProveedorId(
        productoInicial.proveedor?.id ||
        productoInicial.proveedorId ||
        ""
      );

  setFechaVencimiento(
  productoInicial.fechaVencimiento
    ? new Date(productoInicial.fechaVencimiento).toISOString().split("T")[0]
    : ""
);
    } else {
      setNombre("");
      setPrecioCompra("");
      setPrecioVenta("");
      setCantidad("");
      setTipo("envasado");
      setCategoriaId("");
      setProveedorId("");
      setFechaVencimiento("");
    }
  }, [productoInicial]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const hoy = new Date();
hoy.setHours(0, 0, 0, 0);

if (fechaVencimiento) {
  const fecha = new Date(fechaVencimiento);

  if (fecha < hoy) {
    alert("La fecha de vencimiento no puede ser anterior al día de hoy.");
    return;
  }
}

    if (
      !nombre.trim() ||
      precioCompra === "" ||
      precioVenta === "" ||
      !categoriaId ||
      !proveedorId
    ) {
      alert("Error: completá los campos obligatorios.");
      return;
    }

    onSave({
      id: productoInicial?.id || null,
      nombre: nombre.trim(),
      precioCompra: Number(precioCompra),
      precioVenta: Number(precioVenta),
      cantidad: Number(cantidad),
      categoriaId,
      proveedorId,
      tipo,
      fechaVencimiento: fechaVencimiento
  ? new Date(fechaVencimiento).toISOString()
  : null,
      oferta: productoInicial?.oferta || false,
    });
  };

  const esSuelto = tipo === "suelto";
  const ganancia =
    Number(precioVenta || 0) - Number(precioCompra || 0);

  const inputClass =
    "w-full text-sm border border-slate-200 rounded-lg px-3 py-2.5 bg-slate-50 text-slate-800 outline-none focus:bg-white focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 transition";

  const labelClass =
    "block text-sm font-medium text-slate-600 mb-1";

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md max-h-[95vh] overflow-y-auto">

        {/* HEADER */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h3 className="text-lg font-bold text-slate-900">
            {productoInicial ? "Editar producto" : "Nuevo producto"}
          </h3>

          <button onClick={onClose} className="text-slate-500">
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">

          {!productoInicial && (
            <div>
              <label className={labelClass}>Tipo de venta</label>

              <div className="grid grid-cols-2 gap-2">
                {["envasado", "suelto"].map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setTipo(t)}
                    className={`rounded-lg border px-3 py-2 text-sm font-semibold capitalize ${
                      tipo === t
                        ? "border-emerald-400 bg-emerald-50 text-emerald-700"
                        : "border-slate-200"
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div>
            <label className={labelClass}>Nombre</label>
            <input
              className={inputClass}
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>
                {esSuelto ? "Costo / gramo" : "Compra"}
              </label>
              <input
                type="number"
                className={inputClass}
                value={precioCompra}
                onChange={(e) => setPrecioCompra(e.target.value)}
              />
            </div>

            <div>
              <label className={labelClass}>
                {esSuelto ? "Venta / gramo" : "Venta"}
              </label>
              <input
                type="number"
                className={inputClass}
                value={precioVenta}
                onChange={(e) => setPrecioVenta(e.target.value)}
              />
            </div>
          </div>

          {/* GANANCIA */}
          <div className="text-sm">
            Ganancia: ${ganancia}
          </div>

          <div>
            <label className={labelClass}>Stock</label>
            <input
              type="number"
              className={inputClass}
              value={cantidad}
              onChange={(e) => setCantidad(e.target.value)}
            />
          </div>

          <div>
  <label className={labelClass}>
    Fecha de vencimiento (opcional)
  </label>

  <input
    type="date"
    className={inputClass}
    min={new Date().toISOString().split("T")[0]}
    value={fechaVencimiento}
    onChange={(e) => setFechaVencimiento(e.target.value)}
  />
</div>

          <div className="grid grid-cols-2 gap-3">
            <select
              value={categoriaId}
              onChange={(e) => setCategoriaId(e.target.value)}
              className={inputClass}
            >
              <option value="">Categoría</option>
              {categorias.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nombre}
                </option>
              ))}
            </select>

            <select
              value={proveedorId}
              onChange={(e) => setProveedorId(e.target.value)}
              className={inputClass}
            >
              <option value="">Proveedor</option>
              {proveedores.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nombre}
                </option>
              ))}
            </select>
          </div>

          <button
            type="submit"
            className="w-full bg-emerald-600 text-white py-2 rounded-lg"
          >
            Guardar
          </button>
        </form>
      </div>
    </div>
  );
};

export default ProductoForm;