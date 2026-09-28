const API_URL = 'https://sistema-riego-inteligente-production.up.railway.app/api/v1/lecturas/estado';

async function obtenerEstado() {
    try {
        const respuesta = await fetch(API_URL);

        if (!respuesta.ok) {
            throw new Error('No hay datos disponibles');
        }

        const datos = await respuesta.json();

        actualizarInterfaz(datos);

    } catch (error) {

        console.error('Error:', error);

        const statusBadge = document.getElementById('bomba-status');

        statusBadge.className =
            'badge rounded-pill bg-danger px-4 py-2 fs-5';

        statusBadge.innerText = 'DESCONECTADO';

        document.getElementById('bomba-texto').innerText =
            'Sin comunicación con la API.';

        document.getElementById('humedad-val').innerText = '--';

        document.getElementById('humedad-bar').style.width = '0%';

        document.getElementById('fecha-val').innerText = '--';
    }
}


function actualizarInterfaz(data) {

    const humedad = data.humedad;

    // Mostrar humedad
    document.getElementById('humedad-val').innerText =
        humedad;

    // Barra de humedad
    const humedadBar =
        document.getElementById('humedad-bar');

    humedadBar.style.width = `${humedad}%`;

    // Cambiar color según humedad
    if (humedad <= 40) {

        humedadBar.className =
            'progress-bar bg-danger progress-bar-striped progress-bar-animated';

    } else {

        humedadBar.className =
            'progress-bar bg-success progress-bar-striped progress-bar-animated';
    }


    // Estado de la bomba
    const statusBadge =
        document.getElementById('bomba-status');

    const bombaTexto =
        document.getElementById('bomba-texto');


    if (data.bombaActiva) {

        statusBadge.className =
            'badge rounded-pill bg-success px-4 py-2 fs-5';

        statusBadge.innerHTML =
            '<i class="bi bi-water me-1"></i> ENCENDIDA';

        bombaTexto.innerText =
            'Humedad ≤ 40%. Bomba activada.';

    } else {

        statusBadge.className =
            'badge rounded-pill bg-secondary px-4 py-2 fs-5';

        statusBadge.innerHTML =
            '<i class="bi bi-power me-1"></i> APAGADA';

        bombaTexto.innerText =
            'Humedad óptima (> 40%). Sistema en espera.';
    }


    // Fecha
    if (data.fechaRegistro) {

        const fecha =
            new Date(data.fechaRegistro);

        document.getElementById('fecha-val').innerText =
            fecha.toLocaleString('es-PE');
    }
}


// Primera consulta
obtenerEstado();

// Actualizar cada 3 segundos
setInterval(obtenerEstado, 3000);