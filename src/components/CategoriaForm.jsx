import { useState, useEffect } from "react";

const CategoriaForm = ({ onSave, categoriaInicial, onClose }) => {
  const [nombre, setNombre] = useState("");

  useEffect(() => {
    if (categoriaInicial) {
      setNombre(categoriaInicial.nombre || "");
    } else {
      setNombre("");
    }
  }, [categoriaInicial]);

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!nombre.trim()) {
      alert("El nombre de la categoría es obligatorio");
      return;
    }

    onSave({
      id: categoriaInicial?.id || null,
      nombre: nombre.trim(),
    });
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md max-h-[95vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h3 className="text-lg font-bold text-slate-900">
            {categoriaInicial ? "Editar categoría" : "Nueva categoría"}
          </h3>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
            aria-label="Cerrar"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">
              Nombre de la categoría
            </label>
            <input
              type="text"
              className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2.5 bg-slate-50 text-slate-800 outline-none focus:bg-white focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 transition"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Ej: Frutos secos"
              autoFocus
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-lg border border-slate-200 text-slate-600 text-sm font-semibold hover:bg-slate-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2.5 rounded-lg bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 transition-colors shadow-sm"
            >
              Guardar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CategoriaForm;
