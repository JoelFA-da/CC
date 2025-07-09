// Login form submission handler
// This assumes you have a form with id="loginForm" and inputs with ids "email" and "password"
document.getElementById("loginForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const FormData = {
     email: document.getElementById("email").value,
     password: document.getElementById("password").value,
    
};
       

    try {

        // Show loading state
        const submitBtn = e.target.querySelector('button[type="submit"]');
        submitBtn.disabled = true;
        submitBtn.innerHTML = `<span class="inline-block animate-spin">↻</span> Authentificando...`;
        
        // Send request to server
        const response = await fetch("http://localhost:3000/login", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(FormData)
        });

        const result = await response.json();

        if (response.ok) {
            // alert("Login exitoso ✅");
            // Aquí podés guardar info o redirigir
            // localStorage.setItem("user", JSON.stringify(result.user));          
            // Redirigir según el rol

            localStorage.setItem("users", JSON.stringify(result.user)); // Guardar el usuario en localStorage
            if (result.user.role === "admin") {
                window.location.href = "/frontend/admin/dashboard.html";
            } else if (result.user.role === "nutricionista") {
                window.location.href = "/frontend/nutri/dashboard.html";
            } else {
                alert("Rol desconocido. Contactá al administrador.");
            }

        } else {
            alert("❌ " + result.message);
        }
    } catch (error) {
        alert("Error al conectar con el servidor");
    }
});