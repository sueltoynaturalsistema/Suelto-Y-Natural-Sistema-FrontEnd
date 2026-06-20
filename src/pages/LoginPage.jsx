import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const LoginPage = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [verPass, setVerPass] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await login(email, password);
      navigate("/");
    } catch (err) {
      if (err?.response?.status === 401) {
        setError("Email o contraseña incorrectos");
      } else {
        setError("Error al iniciar sesión");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const inputClass =
    "w-full text-sm border border-slate-200 rounded-lg pl-10 pr-3 py-2.5 bg-slate-50 text-slate-800 outline-none focus:bg-white focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 transition";

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-sans">
      <div className="w-full max-w-4xl grid md:grid-cols-2 rounded-2xl overflow-hidden shadow-xl border border-slate-200 bg-white">

        {/* ---------- PANEL MARCA ---------- */}
        <div className="relative hidden md:flex flex-col justify-between p-10 text-white bg-emerald-700 overflow-hidden">
          {/* orbes decorativos */}
          <div className="absolute -top-16 -right-16 w-56 h-56 rounded-full bg-white/10 blur-2xl" />
          <div className="absolute bottom-0 -left-20 w-64 h-64 rounded-full bg-emerald-400/20 blur-3xl animate-pulse" />
          <div className="absolute top-1/3 right-8 w-24 h-24 rounded-full bg-white/5 blur-xl" />

          {/* marca */}
          <div className="relative flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-white text-emerald-700 grid place-items-center shadow-lg">
              <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.52-4.48 10-10 10Z" />
                <path d="M2 21c0-3 1.85-5.36 5.08-6" />
              </svg>
            </div>
            <h1 className="text-lg font-black tracking-tight">Dietética</h1>
          </div>

          {/* claim + features */}
          <div className="relative space-y-5">
            <h2 className="text-3xl font-black leading-tight">
              Tu negocio,
              <br />
              bajo control.
            </h2>
            <p className="text-sm text-emerald-100 max-w-xs">
              Inventario, ventas y reportes en un solo lugar. Rápido, claro y a tu medida.
            </p>

            <ul className="space-y-2.5 pt-2">
              {["Control de stock en vivo", "Ventas y tickets al instante", "Reportes de ganancias"].map(
                (f) => (
                  <li key={f} className="flex items-center gap-2.5 text-sm text-emerald-50">
                    <span className="w-5 h-5 rounded-full bg-white/15 grid place-items-center shrink-0">
                      <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
                        <path d="M20 6L9 17l-5-5" />
                      </svg>
                    </span>
                    {f}
                  </li>
                )
              )}
            </ul>
          </div>

          <p className="relative text-[11px] text-emerald-200/80">
            © {new Date().getFullYear()} Dietética · Sistema de Gestión
          </p>
        </div>

        {/* ---------- PANEL FORM ---------- */}
        <div className="p-8 sm:p-10 flex flex-col justify-center">
          {/* marca compacta solo mobile */}
          <div className="flex md:hidden items-center gap-2.5 mb-8">
            <div className="w-9 h-9 rounded-lg bg-emerald-600 grid place-items-center text-white shadow-sm">
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.52-4.48 10-10 10Z" />
                <path d="M2 21c0-3 1.85-5.36 5.08-6" />
              </svg>
            </div>
            <h1 className="text-base font-black text-slate-900">Dietética</h1>
          </div>

          <div className="mb-6">
            <h2 className="text-2xl font-black text-slate-900">Bienvenido de nuevo</h2>
            <p className="text-sm text-slate-500 mt-1">
              Ingresá a tu panel de gestión.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* email */}
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">Email</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="5" width="18" height="14" rx="2" />
                    <path d="M3 7l9 6 9-6" />
                  </svg>
                </span>
                <input
                  type="email"
                  className={inputClass}
                  placeholder="tucorreo@dietetica.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="username"
                  required
                />
              </div>
            </div>

            {/* password */}
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">Contraseña</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
                    <rect x="4" y="11" width="16" height="9" rx="2" />
                    <path d="M8 11V7a4 4 0 018 0v4" />
                  </svg>
                </span>
                <input
                  type={verPass ? "text" : "password"}
                  className={`${inputClass} pr-10`}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setVerPass((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition"
                  title={verPass ? "Ocultar" : "Mostrar"}
                >
                  {verPass ? (
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17.94 17.94A10 10 0 0112 20c-7 0-11-8-11-8a18 18 0 015.06-5.94M9.9 4.24A9 9 0 0112 4c7 0 11 8 11 8a18 18 0 01-2.16 3.19M1 1l22 22" />
                      <path d="M9.5 9.5a3 3 0 004.24 4.24" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* error */}
            {error && (
              <div role="alert" className="flex items-center gap-2 bg-rose-50 border border-rose-200 text-rose-700 text-sm px-3 py-2.5 rounded-lg">
                <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M12 8v4M12 16h.01" />
                </svg>
                {error}
              </div>
            )}

            {/* submit */}
            <button
              type="submit"
              disabled={submitting}
              className="group w-full inline-flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-2.5 rounded-lg shadow-sm transition active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {submitting ? (
                <>
                  <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.4 0 0 5.4 0 12h4z" />
                  </svg>
                  Ingresando…
                </>
              ) : (
                <>
                  Entrar
                  <svg className="w-4 h-4 transition-transform group-hover:translate-x-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 12h14M13 6l6 6-6 6" />
                  </svg>
                </>
              )}
            </button>
          </form>

          <p className="text-center text-xs text-slate-400 mt-6">
            Acceso exclusivo para personal autorizado.
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
