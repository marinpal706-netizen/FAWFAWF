<!-- SCRIPT DIRECTO DE ANIMACIÓN Y SERPENTINAS -->
<script>
document.addEventListener("DOMContentLoaded", () => {
    console.log("¡Efectos de agradecimiento listos para la acción! 🎬🎉");

    // 1. INYECTAR ESTILOS PARA LAS ANIMACIONES Y EL TEXTO 3D
    const estilosAnimacion = document.createElement("style");
    estilosAnimacion.innerHTML = `
        .animar-imagen {
            animation: aparecerImagen 1s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
            opacity: 0;
            transform: scale(0.5);
        }
        @keyframes aparecerImagen {
            to { opacity: 1; transform: scale(1); }
        }
        .cartel-procesando {
            position: fixed;
            top: 45%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: linear-gradient(135deg, #e50914, #9b0007);
            color: white;
            font-family: 'Arial Black', sans-serif;
            font-size: 2rem;
            padding: 20px 40px;
            border-radius: 10px;
            box-shadow: 0 10px 0 #600003, 0 20px 30px rgba(0,0,0,0.5);
            text-shadow: 2px 2px 0px #600003;
            z-index: 9999;
            text-transform: uppercase;
            letter-spacing: 2px;
            animation: latido3d 0.6s infinite alternate;
        }
        @keyframes latido3d {
            to { transform: translate(-50%, -42%) scale(1.05); }
        }
        .serpentina {
            position: fixed;
            top: -20px;
            width: 8px;
            height: 25px;
            border-radius: 4px;
            z-index: 9998;
            pointer-events: none;
            animation: caerSerpentina 3s linear forwards;
        }
        @keyframes caerSerpentina {
            0% { transform: translateY(0) rotate(0deg); opacity: 1; }
            100% { transform: translateY(105vh) rotate(720deg); opacity: 0; }
        }
    `;
    document.head.appendChild(estilosAnimacion);

    // 2. ANIMAR LA IMAGEN DEL HOMBRE
    const imagenHombre = document.querySelector("img[src*='hombrepulgar']");
    if (imagenHombre) {
        imagenHombre.classList.add("animar-imagen");
    }

    // 3. CREAR CARTEL "PROCESANDO COMPRA"
    const cartel = document.createElement("div");
    cartel.className = "cartel-procesando";
    cartel.innerText = "⏳ Procesando compra...";
    document.body.appendChild(cartel);

    // 4. DISPARAR LA CELEBRACIÓN A LOS 2 SEGUNDOS
    setTimeout(() => {
        cartel.style.transition = "opacity 0.5s";
        cartel.style.opacity = "0";
        setTimeout(() => cartel.remove(), 500);

        const titulo = document.querySelector("h1");
        if (titulo) titulo.innerHTML = "<strong><center>🎉 ¡COMPRA COMPLETADA CON ÉXITO! 🎉</center></strong>";

        const colores = ['#e50914', '#4fa9ff', '#ffeb3b', '#e91e63', '#2ecc71', '#9b59b6'];
        
        for (let i = 0; i < 120; i++) {
            const pieza = document.createElement("div");
            pieza.className = "serpentina";
            pieza.style.left = Math.random() * 100 + "vw";
            pieza.style.backgroundColor = colores[Math.floor(Math.random() * colores.length)];
            pieza.style.animationDelay = Math.random() * 2 + "s";
            
            const escala = Math.random() * 1.2 + 0.5;
            pieza.style.transform = `scale(${escala})`;

            document.body.appendChild(pieza);
            pieza.addEventListener("animationend", () => pieza.remove());
        }
    }, 2000);
});
</script>
