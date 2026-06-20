import client from "./client";

// --- PRODUCTOS ---
export const getProductos = async () => {
  const response = await client.get("/productos");
  return response.data;
};

export const crearProducto = async (producto) => {
  // Redirecciona al endpoint correspondiente según el tipo ('suelto' o 'envasado')
  const response = await client.post(`/productos/${producto.tipo.toLowerCase()}`, producto);
  return response.data;
};

export const editarProducto = async (id, producto) => {
  const response = await client.put(`/productos/${id}`, producto);
  return response.data;
};

export const eliminarProducto = async (id) => {
  const response = await client.delete(`/productos/${id}`);
  return response.data;
};

export const actualizarOferta = async (id, estado) => {
  const response = await client.patch(`/productos/${id}/oferta`, { estado });
  return response.data;
};

// --- CATEGORÍAS ---
export const getCategorias = async () => {
  const response = await client.get("/categorias");
  return response.data;
};

export const guardarCategoria = async (categoria) => {
  const url = categoria.id ? `/categorias/${categoria.id}` : "/categorias";
  const response = await client({
    method: categoria.id ? "PUT" : "POST",
    url,
    data: categoria
  });
  return response.data;
};

// Agregalo en la sección --- CATEGORÍAS ---
export const eliminarCategoria = async (id) => {
  const response = await client.delete(`/categorias/${id}`);
  return response.data;
};


// --- PROVEEDORES ---
export const getProveedores = async () => {
  const response = await client.get("/proveedores");
  return response.data;
};

export const guardarProveedor = async (proveedor) => {
  const url = proveedor.id ? `/proveedores/${proveedor.id}` : "/proveedores";
  const response = await client({
    method: proveedor.id ? "PUT" : "POST",
    url,
    data: proveedor
  });
  return response.data;
};

// Agregalo en la sección --- PROVEEDORES ---
export const eliminarProveedor = async (id) => {
  const response = await client.delete(`/proveedores/${id}`);
  return response.data;
};

// --- VENTAS ---
export const crearVenta = async (venta) => {
  const response = await client.post("/ventas", venta);
  return response.data;
};

export const getVentas = async ({ desde, hasta } = {}) => {
  const params = {};
  if (desde) params.desde = desde;
  if (hasta) params.hasta = hasta;
  const response = await client.get("/ventas", { params });
  return response.data;
};
