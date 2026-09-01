// Script para mostrar/ocultar el menú lateral en móviles
document.addEventListener('DOMContentLoaded', () => {
    const hamburger = document.getElementById('hamburger');
    const sidebar = document.getElementById('sidebar');

    hamburger.addEventListener('click', () => {
        sidebar.classList.toggle('active');
    });
});

// Espera a que el documento esté listo
document.addEventListener("DOMContentLoaded", () => {

    // Referencias a los elementos
    const form = document.getElementById("formTutorias");
    const emprendedor = document.getElementById("emprendedor");
    const proyecto = document.getElementById("proyecto");
    const fecha = document.getElementById("fecha");
    const hora = document.getElementById("hora");

    const btnRegistrar = document.getElementById("btnRegistrar");
    const btnActualizar = document.getElementById("btnActualizar");
    const btnEliminar = document.getElementById("btnEliminar");

    // Cargar tutorías previas del LocalStorage
    let tutorias = JSON.parse(localStorage.getItem("tutorias")) || [];
    let tutoríaSeleccionada = null;

    // === REGISTRAR ===
    btnRegistrar.addEventListener("click", () => {
        if (!emprendedor.value || !proyecto.value || !fecha.value || !hora.value) {
            alert("Por favor completa todos los campos.");
            return;
        }

        const nuevaTutoria = {
            id: Date.now(),
            emprendedor: emprendedor.value,
            proyecto: proyecto.value,
            fecha: fecha.value,
            hora: hora.value
        };

        tutorias.push(nuevaTutoria);
        localStorage.setItem("tutorias", JSON.stringify(tutorias));

        alert("Tutoría registrada exitosamente ✅");
        form.reset();
    });

    // === ACTUALIZAR ===
    btnActualizar.addEventListener("click", () => {
        if (!tutoríaSeleccionada) {
            alert("Primero selecciona una tutoría a actualizar (usa su ID o búscala).");
            return;
        }

        tutoríaSeleccionada.emprendedor = emprendedor.value;
        tutoríaSeleccionada.proyecto = proyecto.value;
        tutoríaSeleccionada.fecha = fecha.value;
        tutoríaSeleccionada.hora = hora.value;

        localStorage.setItem("tutorias", JSON.stringify(tutorias));
        alert("Tutoría actualizada correctamente 🔄");
        form.reset();
        tutoríaSeleccionada = null;
    });

    // === ELIMINAR ===
    btnEliminar.addEventListener("click", () => {
        const nombre = prompt("Escribe el nombre del emprendedor de la tutoría que deseas eliminar:");

        if (!nombre) return;

        tutorias = tutorias.filter(t => t.emprendedor.toLowerCase() !== nombre.toLowerCase());
        localStorage.setItem("tutorias", JSON.stringify(tutorias));

        alert("Tutoría eliminada correctamente 🗑️");
    });
});
