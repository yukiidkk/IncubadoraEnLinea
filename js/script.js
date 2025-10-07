// script.js
document.addEventListener('DOMContentLoaded', function() {
    // Llenar selectores de fecha
    fillDateSelectors();
    
    // Configurar autocompletado de Código Postal
    setupPostalCodeAutocomplete();
    
    // Manejar envío del formulario
    setupFormSubmission();
});

function fillDateSelectors() {
    // Llenar días (1-31)
    const diaSelect = document.getElementById('dia');
    for (let i = 1; i <= 31; i++) {
        const option = document.createElement('option');
        option.value = i;
        option.textContent = i;
        diaSelect.appendChild(option);
    }

    // Llenar meses
    const meses = [
        'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
        'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];
    const mesSelect = document.getElementById('mes');
    meses.forEach((mes, index) => {
        const option = document.createElement('option');
        option.value = index + 1;
        option.textContent = mes;
        mesSelect.appendChild(option);
    });

    // Llenar años (desde 1950 hasta el actual)
    const anioSelect = document.getElementById('anio');
    const currentYear = new Date().getFullYear();
    for (let i = currentYear; i >= 1950; i--) {
        const option = document.createElement('option');
        option.value = i;
        option.textContent = i;
        anioSelect.appendChild(option);
    }
}

function setupPostalCodeAutocomplete() {
    const cpInput = document.getElementById('cp');
    const cpSuggestions = document.getElementById('cp-suggestions');
    const coloniaInput = document.getElementById('colonia');
    const municipioInput = document.getElementById('municipio');
    const estadoInput = document.getElementById('estado');
    
    // Crear elemento de carga
    const loadingIndicator = document.createElement('span');
    loadingIndicator.className = 'loading';
    loadingIndicator.style.display = 'none';
    cpInput.parentNode.appendChild(loadingIndicator);

    cpInput.addEventListener('input', function() {
        const cp = this.value.replace(/\D/g, ''); // Solo números
        
        // Actualizar el valor sin caracteres no numéricos
        this.value = cp;
        
        if (cp.length === 5) {
            loadingIndicator.style.display = 'inline-block';
            
            // Usar API de códigos postales de México
            fetchPostalCodeData(cp)
                .then(data => {
                    loadingIndicator.style.display = 'none';
                    displayPostalCodeSuggestions(data, cpSuggestions, coloniaInput, municipioInput, estadoInput);
                })
                .catch(error => {
                    loadingIndicator.style.display = 'none';
                    console.error('Error al consultar el código postal:', error);
                    cpSuggestions.style.display = 'none';
                });
        } else {
            cpSuggestions.style.display = 'none';
        }
    });

    // Ocultar sugerencias al hacer clic fuera
    document.addEventListener('click', function(e) {
        if (e.target !== cpInput) {
            cpSuggestions.style.display = 'none';
        }
    });
}

function fetchPostalCodeData(postalCode) {
    // En un entorno real, aquí usarías una API real de códigos postales
    // Por ahora, simulamos una respuesta con datos de ejemplo
    
    return new Promise((resolve) => {
        // Simular delay de red
        setTimeout(() => {
            // Datos de ejemplo para códigos postales en Saltillo, Coahuila
            const sampleData = {
                '25000': [
                    { colonia: 'Centro', municipio: 'Saltillo', estado: 'Coahuila' },
                    { colonia: 'Zona Centro', municipio: 'Saltillo', estado: 'Coahuila' }
                ],
                '25010': [
                    { colonia: 'Guayulera', municipio: 'Saltillo', estado: 'Coahuila' },
                    { colonia: 'Guayulera Norte', municipio: 'Saltillo', estado: 'Coahuila' }
                ],
                '25015': [
                    { colonia: 'Bellavista', municipio: 'Saltillo', estado: 'Coahuila' },
                    { colonia: 'Bellavista Sector 2', municipio: 'Saltillo', estado: 'Coahuila' }
                ],
                '25016': [
                    { colonia: 'Lomas de Lourdes', municipio: 'Saltillo', estado: 'Coahuila' },
                    { colonia: 'Lomas de Lourdes 2a Sección', municipio: 'Saltillo', estado: 'Coahuila' }
                ],
                '25019': [
                    { colonia: 'Lomas de la Aurora', municipio: 'Saltillo', estado: 'Coahuila' },
                    { colonia: 'Lomas de la Aurora 2a Sección', municipio: 'Saltillo', estado: 'Coahuila' }
                ]
            };
            
            if (sampleData[postalCode]) {
                resolve(sampleData[postalCode]);
            } else {
                // Para otros códigos postales, devolver datos genéricos
                resolve([
                    { colonia: 'Colonia Ejemplo', municipio: 'Municipio Ejemplo', estado: 'Estado Ejemplo' }
                ]);
            }
        }, 800); // Simular tiempo de respuesta de la API
    });
}

function displayPostalCodeSuggestions(data, suggestionsContainer, coloniaInput, municipioInput, estadoInput) {
    suggestionsContainer.innerHTML = '';
    
    if (data && data.length > 0) {
        data.forEach(location => {
            const suggestionItem = document.createElement('div');
            suggestionItem.className = 'suggestion-item';
            suggestionItem.textContent = `${location.colonia}, ${location.municipio}, ${location.estado}`;
            
            suggestionItem.addEventListener('click', function() {
                coloniaInput.value = location.colonia || '';
                municipioInput.value = location.municipio || '';
                estadoInput.value = location.estado || '';
                suggestionsContainer.style.display = 'none';
            });
            
            suggestionsContainer.appendChild(suggestionItem);
        });
        
        suggestionsContainer.style.display = 'block';
    } else {
        suggestionsContainer.style.display = 'none';
    }
}

function setupFormSubmission() {
    document.getElementById('registrationForm').addEventListener('submit', function(e) {
        e.preventDefault();
        
        // Validar formulario
        if (validateForm()) {
            // Mostrar mensaje de éxito
            showSuccessMessage();
            
            // En un entorno real, aquí enviarías los datos al servidor
            // const formData = new FormData(this);
            // fetch('/registro', { method: 'POST', body: formData })
            //   .then(response => response.json())
            //   .then(data => { ... })
        }
    });
}

function validateForm() {
    // Validaciones básicas
    const requiredFields = document.querySelectorAll('#registrationForm [required]');
    let isValid = true;
    
    requiredFields.forEach(field => {
        if (!field.value.trim()) {
            field.style.borderColor = '#e74c3c';
            isValid = false;
        } else {
            field.style.borderColor = '#ddd';
        }
    });
    
    // Validación específica para RFC (13 o 12 caracteres)
    const rfc = document.getElementById('rfc').value.trim();
    if (rfc && (rfc.length < 12 || rfc.length > 13)) {
        document.getElementById('rfc').style.borderColor = '#e74c3c';
        alert('El RFC debe tener 12 o 13 caracteres');
        isValid = false;
    }
    
    // Validación específica para CURP (18 caracteres)
    const curp = document.getElementById('curp').value.trim();
    if (curp && curp.length !== 18) {
        document.getElementById('curp').style.borderColor = '#e74c3c';
        alert('La CURP debe tener exactamente 18 caracteres');
        isValid = false;
    }
    
    return isValid;
}

function showSuccessMessage() {
    // Crear y mostrar mensaje de éxito
    const successMessage = document.createElement('div');
    successMessage.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background-color: #2ecc71;
        color: white;
        padding: 15px 20px;
        border-radius: 4px;
        box-shadow: 0 2px 10px rgba(0,0,0,0.2);
        z-index: 10000;
        animation: fadeIn 0.3s;
    `;
    successMessage.textContent = '¡Cuenta creada exitosamente!';
    
    document.body.appendChild(successMessage);
    
    // Eliminar mensaje después de 5 segundos
    setTimeout(() => {
        successMessage.style.animation = 'fadeOut 0.3s';
        setTimeout(() => {
            document.body.removeChild(successMessage);
        }, 300);
    }, 5000);
    
    // Reiniciar formulario después de éxito
    document.getElementById('registrationForm').reset();
}

// Agregar estilos de animación para el mensaje de éxito
const style = document.createElement('style');
style.textContent = `
    @keyframes fadeIn {
        from { opacity: 0; transform: translateY(-20px); }
        to { opacity: 1; transform: translateY(0); }
    }
    
    @keyframes fadeOut {
        from { opacity: 1; transform: translateY(0); }
        to { opacity: 0; transform: translateY(-20px); }
    }
`;
document.head.appendChild(style);