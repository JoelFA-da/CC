// dashboard.js

document.addEventListener("DOMContentLoaded", async () => {
    const userData = localStorage.getItem("users");

    const user = JSON.parse(userData);

            try {
                const res = await fetch(`http://localhost:3000/report?client_id=${user.id}`);
                const clients = await res.json();
        
                const userReport = document.getElementById("clientList");
        
                if (Array.isArray(clients) && clients.length > 0) {
                    clients.forEach(client => {
                        const li = document.createElement("li");
        
                        const clientInfo = document.createElement("span");
                        clientInfo.textContent = `${client.weight} (Altura: ${client.height})`;
                        li.appendChild(clientInfo);
        
                        userReport.appendChild(li);
                    });
                } else {
                    userReport.innerHTML = "<li>No hay clientes asignados.</li>";
                }
            } catch (error) {
                console.error("Error cargando clientes:", error);
            }
        });
  

