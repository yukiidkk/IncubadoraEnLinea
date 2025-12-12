
const id_usuario = localStorage.getItem("id_usuario");

export const getProyectosDeUsuario = async () => {
    if (!id_usuario) {
        console.error("No hay id_usuario en localStorage");
        return [];
    }

    const res = await fetch(`${BASE}/proyectos/usuario/${id_usuario}`);
    const data = await res.json();
    return data.data || [];
};


// Obtener un proyecto por ID (filtrado desde lista general)
export const getProyecto = async (id) => {
    const res = await fetch(`${BASE}/proyectos/${id}`);
    const data = await res.json();
    return data.data;  // el backend debe devolver UN proyecto
};



// Obtener avances del proyecto
export const getAvances = (id_proyecto) =>
    fetch(`${BASE}/avances/${id_proyecto}`).then(r => r.json());

// Crear un avance (AÚN NO EXISTE ruta en tu backend)
export const crearAvance = (id, data) =>
    fetch(`${BASE}/crearAvance`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id_proyecto: id, ...data })
    }).then(r => r.json());


// Obtener avances del proyecto como emprendedor
export const getAvancesProyectoEmprendedor = (id_proyecto) =>
    fetch(`${BASE}/admin/proyectos/${id_proyecto}/avances`)
        .then(r => r.json());

// Crear comentario (ruta real en backend)
export const crearComentario = (id, data) =>
    fetch(`${BASE}/proyectos/${id}/comentarios`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
    }).then(r => r.json());


// Descargar Excel
export const descargarExcel = (id) =>
    window.open(`${BASE}/excel/${id}`, "_blank");
