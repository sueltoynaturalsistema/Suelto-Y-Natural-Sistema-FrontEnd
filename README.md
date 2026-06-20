# 🥗 Sistema Dietética – Frontend

Aplicación web desarrollada con React para la gestión de una dietética.
Permite administrar productos, registrar ventas y visualizar reportes.

---

## 🚀 Tecnologías utilizadas

* React
* React Router DOM
* Tailwind CSS
* Axios (preparado para integración con backend)
* Vite

---

## 📦 Funcionalidades

### 🔐 Autenticación

* Login de usuario
* Rutas protegidas
* Manejo de sesión (token)

---

### 📦 Productos

* Listado de productos
* Crear producto
* Editar producto
* Eliminar producto
* Modal para alta/modificación
* Interfaz tipo dashboard

---

### 🛒 Ventas

* Selección de productos
* Carrito dinámico
* Modificación de cantidades
* Cálculo automático del total
* Confirmación de venta (modo mock)

---

### 📊 Reportes

* Productos con stock bajo
* Listado de ventas realizadas
* Visualización en tablas

---

## 🧱 Estructura del proyecto

```
src/
│
├── api/               # Configuración de axios
├── components/        # Componentes reutilizables
│   ├── Navbar.jsx
│   ├── Layout.jsx
│   ├── ProductoForm.jsx
│
├── pages/             # Vistas principales
│   ├── LoginPage.jsx
│   ├── ProductosPage.jsx
│   ├── VentasPage.jsx
│   ├── ReportesPage.jsx
│
├── routes/
│   └── AppRouter.jsx
│
├── context/
│   └── AuthContext.jsx
│
└── main.jsx
```

---

## ⚙️ Instalación y ejecución

1. Clonar el repositorio

```bash
git clone <url-del-repo>
```

2. Instalar dependencias

```bash
npm install
```

3. Ejecutar el proyecto

```bash
npm run dev
```

4. Abrir en el navegador:

```
http://localhost:5173
```

---

## 🔑 Credenciales de prueba

```
Usuario: admin
Contraseña: 1234
```

---

## 🔌 Integración con backend

El proyecto está preparado para conectarse a una API REST.

Ejemplo de configuración:

```js
// src/api/api.js
const API_URL = "http://localhost:8080/api";
```

Endpoints esperados:

* GET /productos
* POST /productos
* PUT /productos/:id
* DELETE /productos/:id
* POST /ventas
* GET /reportes/stock-bajo
* GET /reportes/ventas

---

## ⚠️ Estado actual

* Frontend funcional completo
* Uso de datos mock en algunas secciones
* Listo para integración con backend

---

## 💡 Mejoras futuras

* Conexión completa con backend
* Persistencia real de datos
* Validaciones avanzadas
* Manejo de errores
* Animaciones y mejoras de UI
* Autenticación real con JWT

---

## 👨‍💻 Autor

Proyecto desarrollado como práctica de sistema de gestión.

---

## 📄 Licencia

Uso educativo
