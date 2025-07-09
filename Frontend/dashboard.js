// dashboard.js

document.addEventListener("DOMContentLoaded", async () => {
    const userData = localStorage.getItem("users");

    if (!userData) {
        alert("⚠️ Usuario no autenticado. Redirigiendo al login...");
        window.location.href = "Frontend/login.html";
        return;
    }

    const user = JSON.parse(userData);
    // Mostrar info del usuario
    const userInfo = document.getElementById("userInfo");
    if (userInfo) {
        userInfo.textContent = `Nombre: ${user.name} | Rol: ${user.role}`;
    }

    // Solo si es nutricionista, mostrar clientes
    if (user.role === "nutricionista") {
        try {
            const res = await fetch(`http://localhost:3000/clientes?nutritionist_id=${user.id}`);
            const clients = await res.json();

            const clientList = document.getElementById("clientList");

            if (Array.isArray(clients) && clients.length > 0) {
                clients.forEach(client => {  // ← cambiá aquí 'clients' por 'client'
                    const li = document.createElement("li");

                    const clientInfo = document.createElement("span");
                    clientInfo.textContent = `${client.name} (Email: ${client.email})`;

                    const reportLink = document.createElement("a");
                    reportLink.textContent = " Reports";
                    reportLink.href = `report.html?cliente_id=${client.id}`;

                    reportLink.className = "text-blue-500 hover:underline ml-2";

                    li.appendChild(clientInfo);
                    li.appendChild(reportLink);
                    clientList.appendChild(li);
                });
            } else {
                clientList.innerHTML = "<li>No hay clientes asignados.</li>";
            }

        } catch (error) {
            console.error("Error cargando clientes:", error);
        }
    }
});

