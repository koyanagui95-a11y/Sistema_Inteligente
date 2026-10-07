const API_URL = 'https://sistema-riego-inteligente.onrender.com/api/v1';


let bombaManual = false;
let humedadChart = null;

async function obtenerEstadoManual() {
    try {
        const respuesta = await fetch(`${API_URL}/bomba/manual`);

        if (!respuesta.ok) {
            throw new Error("No se pudo obtener el estado manual");
        }

        const datos = await respuesta.json();

        bombaManual = datos.bombaManual;

        actualizarBotonManual();

    } catch (error) {
        console.error("Error:", error);

        const estado = document.getElementById("estadoManual");

        if (estado) {
            estado.textContent = "Estado: sin conexión";
        }
    }
}

async function cambiarBombaManual() {
    try {
        const endpoint = bombaManual
            ? "/bomba/manual/apagar"
            : "/bomba/manual/encender";

        const respuesta = await fetch(`${API_URL}${endpoint}`, {
            method: "POST"
        });

        if (!respuesta.ok) {
            throw new Error("No se pudo cambiar el estado de la bomba");
        }

        const datos = await respuesta.json();

        bombaManual = datos.bombaManual;

        actualizarBotonManual();

    } catch (error) {
        console.error("Error:", error);
        alert("No se pudo controlar la bomba");
    }
}

function actualizarBotonManual() {

    const boton = document.getElementById("btnBombaManual");
    const estado = document.getElementById("estadoManual");

    if (!boton || !estado) {
        return;
    }

    if (bombaManual) {

        estado.textContent = "Estado: ENCENDIDA";

        boton.textContent = "APAGAR BOMBA";

        boton.classList.remove("btn-success");
        boton.classList.add("btn-danger");

    } else {

        estado.textContent = "Estado: APAGADA";

        boton.textContent = "ENCENDER BOMBA";

        boton.classList.remove("btn-danger");
        boton.classList.add("btn-success");
    }
}

async function obtenerEstado() {

    try {

        const respuesta = await fetch(`${API_URL}/lecturas/estado`); 

        if (!respuesta.ok) {
            throw new Error("No hay datos disponibles");
        }

        const datos = await respuesta.json();

        actualizarInterfaz(datos);

    } catch (error) {

        console.error("Error:", error);

        const statusBadge =
            document.getElementById("bomba-status");

        statusBadge.className =
            "badge rounded-pill bg-danger px-4 py-2 fs-5";

        statusBadge.innerText =
            "DESCONECTADO";

        document.getElementById("bomba-texto").innerText =
            "Sin comunicación con la API.";

        document.getElementById("humedad-val").innerText =
            "--";

        document.getElementById("humedad-bar").style.width =
            "0%";

        document.getElementById("fecha-val").innerText =
            "--";
    }
}

function actualizarInterfaz(data) {

    const humedad = data.humedad;

    document.getElementById("humedad-val").innerText =
        humedad;

    const humedadBar =
        document.getElementById("humedad-bar");

    humedadBar.style.width =
        `${humedad}%`;

    if (humedad <= 40) {

        humedadBar.className =
            "progress-bar bg-danger progress-bar-striped progress-bar-animated";

    } else {

        humedadBar.className =
            "progress-bar bg-success progress-bar-striped progress-bar-animated";
    }

    const statusBadge =
        document.getElementById("bomba-status");

    const bombaTexto =
        document.getElementById("bomba-texto");

    if (data.bombaActiva) {

        statusBadge.className =
            "badge rounded-pill bg-success px-4 py-2 fs-5";

        statusBadge.innerHTML =
            '<i class="bi bi-water me-1"></i> ENCENDIDA';

        bombaTexto.innerText =
            "Bomba activada.";

    } else {

        statusBadge.className =
            "badge rounded-pill bg-secondary px-4 py-2 fs-5";

        statusBadge.innerHTML =
            '<i class="bi bi-power me-1"></i> APAGADA';

        bombaTexto.innerText =
            "Sistema en espera.";
    }

    if (data.fechaRegistro) {

        const fecha =
            new Date(data.fechaRegistro);

        document.getElementById("fecha-val").innerText =
            fecha.toLocaleString("es-PE");
    }
}

async function obtenerLecturasDelDia() {

    try {
        const respuesta =
            await fetch(`${API_URL}/lecturas`);

        if (!respuesta.ok) {
            throw new Error("No se pudieron obtener las lecturas");
        }

        const lecturas = await respuesta.json();

        const hoy = new Date();

        const año = hoy.getFullYear();
        const mes = hoy.getMonth();
        const dia = hoy.getDate();

        const lecturasHoy = lecturas.filter(lectura => {

            if (!lectura.fechaRegistro) {
                return false;
            }

            const fecha = new Date(lectura.fechaRegistro);

            return (
                fecha.getFullYear() === año &&
                fecha.getMonth() === mes &&
                fecha.getDate() === dia
            );

        });

        actualizarGrafico(lecturasHoy);

        actualizarTabla(lecturasHoy);

        document.getElementById("fecha-dashboard").innerText =
            hoy.toLocaleDateString("es-PE");

    } catch (error) {

        console.error(
            "Error cargando dashboard:",
            error
        );

    }
}

function actualizarGrafico(lecturas) {

    const etiquetas = lecturas.map(lectura => {

        const fecha =
            new Date(lectura.fechaRegistro);

        return fecha.toLocaleTimeString(
            "es-PE",
            {
                hour: "2-digit",
                minute: "2-digit"
            }
        );

    });

    const valores = lecturas.map(lectura => lectura.humedad
    );
    const ctx = document.getElementById("humedadChart");

    if (humedadChart) {
        humedadChart.destroy();
    }
    humedadChart = new Chart(ctx, {
        type: "line",
        data: {
            labels: etiquetas,
            datasets: [
                {
                    label: "Humedad (%)",
                    data: valores,
                    tension: 0.3,
                    fill: true,
                    borderWidth: 2,
                    pointRadius: 4
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    max: 100,
                    title: {
                        display: true,
                        text: "Humedad (%)"
                    }
                },
                x: {
                    title: {
                        display: true,
                        text: "Hora"
                    }
                }
            },
            plugins: {
                legend: {
                    display: true
                }
            }
        }
    });

}


function actualizarTabla(lecturas) {

    const tabla =document.getElementById("tablaLecturas");
    tabla.innerHTML = "";
    if (lecturas.length === 0) {
        tabla.innerHTML = `
            <tr>
                <td colspan="3">
                    No hay lecturas registradas hoy.
                </td>
            </tr> `;
        return;
    }
    lecturas
        .slice()
        .reverse()
        .forEach(lectura => {
            const fecha = new Date(lectura.fechaRegistro);
            const hora =fecha.toLocaleTimeString( "es-PE",
                    {
                        hour: "2-digit",
                        minute: "2-digit"
                    }
                );

            const estadoBomba =lectura.bombaActiva? "ENCENDIDA": "APAGADA";
            const claseBomba =lectura.bombaActiva? "text-success": "text-secondary";
            tabla.innerHTML += `
                <tr>
                    <td>
                        ${hora}
                    </td>
                    <td>
                        <strong>
                            ${lectura.humedad}%
                        </strong>
                    </td>
                    <td class="${claseBomba} fw-bold">
                        ${estadoBomba}
                    </td>
                </tr>`;
        });

}

obtenerEstado();
obtenerEstadoManual();
obtenerLecturasDelDia();

setInterval(obtenerEstado, 10000);
setInterval(obtenerEstadoManual, 10000);
setInterval(obtenerLecturasDelDia,30000);