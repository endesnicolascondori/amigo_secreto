const participants = [];

/* =========================================================================
   1. CONFIGURACIÓN DE EMAILJS (SOLUCIÓN DEFINITIVA AL ERROR 422)
   =========================================================================
   ¿Por qué ocurre el error 422 (Unprocessable Content) en EmailJS?
   Causas principales:
   A) En tu plantilla dentro de https://dashboard.emailjs.com/admin/templates,
      el campo "To Email" (Destinatario) está vacío o tiene otro nombre de variable.
      -> SOLUCIÓN: Enviamos todas las variantes comunes (to_email, email, user_email, recipient)
         y además debes poner {{to_email}} en el campo "To Email" de tu plantilla en EmailJS.
   B) No se inicializó emailjs.init({ publicKey }) para la versión 4 del SDK.
   ========================================================================= */
const EMAILJS_CONFIG = {
    enabled: true, // Déjalo en true y coloca tus 3 credenciales reales abajo:
    serviceId: "service_7ky7vbo",
    templateId: "template_61vzke4",
    publicKey: "oHQKLmafkyrjLrZNe"
};

/* =========================================================================
   2. SINTETIZADOR DE SONIDO WEB AUDIO API (CERO ARCHIVOS EXTERNOS)
   ========================================================================= */
let soundEnabled = true;
let audioCtx = null;

function getAudioContext() {
    if (!audioCtx) {
        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        if (AudioContextClass) audioCtx = new AudioContextClass();
    }
    if (audioCtx && audioCtx.state === 'suspended') {
        audioCtx.resume();
    }
    return audioCtx;
}

// Sonido mágico cristalino al agregar una esfera
function playPopSound(pitchIndex = 0) {
    if (!soundEnabled) return;
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    // Escala pentatónica alegre según cuántos participantes hay
    const baseFreqs = [523.25, 587.33, 659.25, 783.99, 880.0, 1046.5];
    const freq = baseFreqs[pitchIndex % baseFreqs.length];

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, now);
    osc.frequency.exponentialRampToValueAtTime(freq * 1.4, now + 0.18);

    gain.gain.setValueAtTime(0.18, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.23);
}

// Sonido suave descendente al eliminar una esfera
function playRemoveSound() {
    if (!soundEnabled) return;
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(420, now);
    osc.frequency.exponentialRampToValueAtTime(180, now + 0.16);

    gain.gain.setValueAtTime(0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.17);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.18);
}

// Redoble espacial mientras gira la cápsula 3D
function playSpinSound(durationMs = 1500) {
    if (!soundEnabled) return;
    const ctx = getAudioContext();
    if (!ctx) return;

    const steps = 14;
    const interval = durationMs / steps;
    for (let i = 0; i < steps; i++) {
        setTimeout(() => {
            if (!soundEnabled) return;
            const now = ctx.currentTime;
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(300 + i * 45, now);
            gain.gain.setValueAtTime(0.12, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(now);
            osc.stop(now + 0.09);
        }, i * interval);
    }
}

// Acorde triunfal al completar el sorteo
function playSuccessFanfare() {
    if (!soundEnabled) return;
    const ctx = getAudioContext();
    if (!ctx) return;

    const notes = [523.25, 659.25, 783.99, 1046.5]; // Do Mayor brillante
    notes.forEach((freq, idx) => {
        const now = ctx.currentTime + idx * 0.09;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now);

        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.0008, now + 0.65);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.68);
    });
}

// Elementos del DOM
const soundToggleBtn = document.getElementById('sound-toggle');
const stageContainer = document.getElementById('three-stage');
const stageStatus = document.getElementById('stage-status');
const orbLegend = document.getElementById('orb-legend');
const form = document.getElementById('participant-form');
const nameInput = document.getElementById('p-name');
const emailInput = document.getElementById('p-email');
const errorMsg = document.getElementById('form-error');
const listEl = document.getElementById('participant-list');
const countBadge = document.getElementById('participant-count');
const drawBtn = document.getElementById('draw-btn');
const modal = document.getElementById('success-modal');
const emailStatusMsg = document.getElementById('email-status-msg');
const shareLinksList = document.getElementById('share-links-list');
const resetBtn = document.getElementById('reset-btn');

const step2Ind = document.getElementById('step-2-indicator');
const step3Ind = document.getElementById('step-3-indicator');

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const ORB_PALETTE = ['#EC4899', '#F43F5E', '#A855F7', '#FB7185', '#F59E0B', '#38BDF8', '#34D399'];

soundToggleBtn.addEventListener('click', () => {
    soundEnabled = !soundEnabled;
    soundToggleBtn.textContent = soundEnabled ? '🔊 Sonido ON' : '🔇 Silencio';
    if (soundEnabled) playPopSound(2);
});

/* =========================================================================
   3. ESCENARIO 3D DEDICADO CON THREE.JS (ESFERAS CON ETIQUETAS CLARAS)
   ========================================================================= */
let scene, camera, renderer, giftGroup, participantOrbs = [];
let isSpinningFast = false;
let mouseX = 0, mouseY = 0;

// Crea una textura 2D con las iniciales del participante para envolver la esfera 3D
function createInitialsTexture(initials, bgHex) {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');

    // Fondo degradado de la esfera
    const grad = ctx.createRadialGradient(90, 90, 20, 128, 128, 140);
    grad.addColorStop(0, '#FFFFFF');
    grad.addColorStop(0.25, bgHex);
    grad.addColorStop(1, '#831843');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 256, 256);

    // Texto de iniciales nítido en el frente
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 88px Outfit, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(initials, 128, 132);

    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;
    return texture;
}

function initThreeJS() {
    const canvas = document.getElementById('bg-canvas');
    if (!window.THREE || !canvas || !stageContainer) return;

    const width = stageContainer.clientWidth;
    const height = stageContainer.clientHeight;

    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(48, width / height, 0.1, 1000);
    camera.position.set(0, 0.6, 9.2);
    camera.lookAt(0, 0, 0);

    renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    // Iluminación de estudio para resaltar las esferas
    const ambientLight = new THREE.AmbientLight(0xffe4e6, 1.1);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 1.3);
    dirLight.position.set(5, 8, 7);
    scene.add(dirLight);

    const pinkLight = new THREE.PointLight(0xec4899, 1.6, 25);
    pinkLight.position.set(-5, -4, 5);
    scene.add(pinkLight);

    // Grupo central: Núcleo de Sorteo 3D
    giftGroup = new THREE.Group();
    scene.add(giftGroup);

    const coreGeo = new THREE.OctahedronGeometry(0.95, 2);
    const coreMat = new THREE.MeshPhysicalMaterial({
        color: 0xec4899,
        emissive: 0x9d174d,
        emissiveIntensity: 0.35,
        roughness: 0.15,
        metalness: 0.25,
        clearcoat: 1.0,
        wireframe: false
    });
    const coreMesh = new THREE.Mesh(coreGeo, coreMat);
    giftGroup.add(coreMesh);

    // Anillo ecuatorial brillante
    const ringGeo = new THREE.TorusGeometry(1.5, 0.045, 16, 100);
    const ringMat = new THREE.MeshStandardMaterial({
        color: 0xfbcfe8,
        emissive: 0xf43f5e,
        emissiveIntensity: 0.4,
        roughness: 0.2,
        metalness: 0.8
    });
    const ringMesh = new THREE.Mesh(ringGeo, ringMat);
    ringMesh.rotation.x = Math.PI / 2.3;
    giftGroup.add(ringMesh);

    // Interacción táctil y con mouse sobre el escenario 3D
    stageContainer.addEventListener('mousemove', (e) => {
        const rect = stageContainer.getBoundingClientRect();
        mouseX = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
        mouseY = ((e.clientY - rect.top) / rect.height - 0.5) * 2;
    });

    window.addEventListener('resize', () => {
        if (!stageContainer) return;
        const w = stageContainer.clientWidth;
        const h = stageContainer.clientHeight;
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        renderer.setSize(w, h);
    });

    animateThreeJS();
}

// Reorganiza los ángulos de todas las esferas para que orbiten en un anillo limpio y 100% visible
function redistributeOrbs() {
    const total = participantOrbs.length;
    participantOrbs.forEach((orb, idx) => {
        orb.userData.baseAngle = (idx / Math.max(total, 1)) * Math.PI * 2;
        orb.userData.radius = total > 6 ? 3.35 : 2.95;
    });
}

function addParticipantOrb3D(name, colorHex) {
    if (!scene) return;
    const initials = getInitials(name);
    const texture = createInitialsTexture(initials, colorHex);

    const geo = new THREE.SphereGeometry(0.48, 32, 32);
    const mat = new THREE.MeshPhysicalMaterial({
        map: texture,
        roughness: 0.18,
        metalness: 0.1,
        clearcoat: 0.9
    });
    const orb = new THREE.Mesh(geo, mat);
    orb.userData = {
        baseAngle: 0,
        radius: 2.95,
        bobOffset: Math.random() * Math.PI * 2
    };

    scene.add(orb);
    participantOrbs.push(orb);
    redistributeOrbs();
}

function rebuildAllOrbs3D() {
    if (!scene) return;
    participantOrbs.forEach(o => scene.remove(o));
    participantOrbs = [];
    participants.forEach((p) => {
        addParticipantOrb3D(p.name, p.color);
    });
}

let globalOrbitAngle = 0;

function animateThreeJS() {
    requestAnimationFrame(animateThreeJS);

    const spinSpeed = isSpinningFast ? 0.16 : 0.012;
    globalOrbitAngle += isSpinningFast ? 0.12 : 0.014;

    if (giftGroup) {
        giftGroup.rotation.y += spinSpeed;
        giftGroup.rotation.x += spinSpeed * 0.5;
        giftGroup.position.x += (mouseX * 0.55 - giftGroup.position.x) * 0.08;
        giftGroup.position.y += (-mouseY * 0.35 - giftGroup.position.y) * 0.08;
    }

    participantOrbs.forEach((orb, idx) => {
        const currentAngle = orb.userData.baseAngle + globalOrbitAngle;
        const r = orb.userData.radius;
        orb.position.x = Math.cos(currentAngle) * r;
        orb.position.z = Math.sin(currentAngle) * (r * 0.65);
        orb.position.y = Math.sin(globalOrbitAngle * 2 + orb.userData.bobOffset) * 0.42;

        // Mantener las iniciales mirando hacia la cámara
        orb.rotation.y = -currentAngle + Math.PI / 2;
    });

    renderer.render(scene, camera);
}

/* =========================================================================
   4. FLUJO UX Y ENVÍO DE CORREOS VALIDADO
   ========================================================================= */
window.addEventListener('DOMContentLoaded', () => {
    initThreeJS();

    // Inicializar EmailJS v4 si el usuario ya puso su publicKey real
    if (window.emailjs && EMAILJS_CONFIG.publicKey && EMAILJS_CONFIG.publicKey !== "TU_PUBLIC_KEY") {
        emailjs.init({ publicKey: EMAILJS_CONFIG.publicKey });
    }

    const params = new URLSearchParams(window.location.search);
    const ticket = params.get('ticket');
    if (ticket) {
        try {
            const data = JSON.parse(decodeURIComponent(escape(atob(ticket))));
            document.getElementById('organizer-view').hidden = true;
            const revealView = document.getElementById('reveal-view');
            revealView.hidden = false;
            document.getElementById('reveal-event-title').textContent = data.event;
            document.getElementById('reveal-giver').textContent = data.giver;
            document.getElementById('reveal-receiver').textContent = data.receiver;
            document.getElementById('reveal-budget').textContent = data.budget;
            document.getElementById('reveal-date').textContent = data.date;

            stageStatus.textContent = `Cápsula de ${data.giver} abierta`;
            addParticipantOrb3D(data.giver, '#EC4899');
            addParticipantOrb3D(data.receiver, '#F43F5E');

            setTimeout(() => playSuccessFanfare(), 300);

            if (window.confetti) {
                confetti({
                    particleCount: 100,
                    spread: 75,
                    origin: { y: 0.6 },
                    colors: ['#EC4899', '#F43F5E', '#FBCFE8', '#DB2777']
                });
            }
        } catch (e) {
            console.error("Enlace inválido", e);
        }
    }
});

form.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = nameInput.value.trim();
    const email = emailInput.value.trim().toLowerCase();

    if (!name || !email) {
        showError('Por favor, ingresa tanto el nombre como el correo.');
        return;
    }
    if (!emailRegex.test(email)) {
        showError('Ingresa un correo electrónico válido (ej. nombre@correo.com).');
        return;
    }
    if (participants.some(p => p.email === email)) {
        showError('Este correo ya está registrado en la lista.');
        return;
    }

    const color = ORB_PALETTE[participants.length % ORB_PALETTE.length];
    participants.push({ id: crypto.randomUUID(), name, email, color });

    addParticipantOrb3D(name, color);
    playPopSound(participants.length - 1);

    nameInput.value = '';
    emailInput.value = '';
    nameInput.focus();
    hideError();
    updateUI();
});

window.removeParticipant = function(id) {
    const index = participants.findIndex(p => p.id === id);
    if (index !== -1) {
        participants.splice(index, 1);
        playRemoveSound();
        rebuildAllOrbs3D();
        updateUI();
    }
};

function getInitials(name) {
    return name.split(' ').filter(Boolean).map(n => n[0]).join('').substring(0, 2).toUpperCase();
}

function updateUI() {
    // Actualizar leyenda bajo el escenario 3D
    orbLegend.innerHTML = participants.map(p => `
        <span class="orb-pill">
            <span class="orb-dot" style="background:${p.color}"></span>
            ${escapeHTML(p.name)}
        </span>
    `).join('');

    stageStatus.textContent = participants.length === 0
        ? 'Cápsula 3D Activa — Agrega participantes para crear esferas'
        : `${participants.length} esfera(s) orbitando en la cápsula 3D`;

    listEl.innerHTML = participants.map(p => `
        <li class="participant-item">
            <div class="participant-left">
                <div class="avatar-circle" style="background:${p.color}">${escapeHTML(getInitials(p.name))}</div>
                <div class="participant-info">
                    <strong>${escapeHTML(p.name)}</strong>
                    <span>${escapeHTML(p.email)}</span>
                </div>
            </div>
            <button class="btn-remove" onclick="removeParticipant('${p.id}')" aria-label="Eliminar">&times;</button>
        </li>
    `).join('');

    const total = participants.length;
    countBadge.textContent = `${total} / 3 mín.`;

    if (total > 0) step2Ind.classList.add('active');
    else step2Ind.classList.remove('active');

    if (total < 3) {
        step3Ind.classList.remove('active');
        drawBtn.disabled = true;
        drawBtn.textContent = `✨ Agrega ${3 - total} más para activar el Sorteo 3D`;
    } else {
        step3Ind.classList.add('active');
        drawBtn.disabled = false;
        drawBtn.textContent = `💖 ¡Girar Cápsula 3D y Sortear (${total})!`;
    }
}

function escapeHTML(str) {
    return str.replace(/[&<>'"]/g, tag => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
    }[tag]));
}

function showError(msg) {
    errorMsg.textContent = msg;
    errorMsg.hidden = false;
}

function hideError() {
    errorMsg.hidden = true;
}

/**
 * Algoritmo de Ciclo Hamiltoniano (Fisher-Yates + Desplazamiento Circular).
 * Garantiza 0 auto-asignaciones y 0 sub-ciclos cerrados.
 */
function generarSorteoCiclico(listaParticipantes) {
    if (!Array.isArray(listaParticipantes) || listaParticipantes.length < 3) {
        throw new Error("Se requieren al menos 3 participantes.");
    }

    const mezclados = [...listaParticipantes];
    for (let i = mezclados.length - 1; i > 0; i--) {
        const randomBuffer = new Uint32Array(1);
        window.crypto.getRandomValues(randomBuffer);
        const j = randomBuffer[0] % (i + 1);
        [mezclados[i], mezclados[j]] = [mezclados[j], mezclados[i]];
    }

    return mezclados.map((participanteActual, indice) => {
        const indiceReceptor = (indice + 1) % mezclados.length;
        return {
            giver: participanteActual,
            receiver: mezclados[indiceReceptor]
        };
    });
}

function crearEnlaceMagico(payload) {
    const jsonStr = JSON.stringify(payload);
    const encoded = btoa(unescape(encodeURIComponent(jsonStr)));
    const baseUrl = window.location.origin + window.location.pathname;
    return `${baseUrl}?ticket=${encoded}`;
}

window.copyMagicLink = function(btn, url) {
    navigator.clipboard.writeText(url).then(() => {
        playPopSound(4);
        const original = btn.textContent;
        btn.textContent = '¡Copiado!';
        setTimeout(() => btn.textContent = original, 1800);
    });
};

// Función auxiliar que envía cada correo con todos los alias de destinatario para evitar el Error 422
async function enviarCorreosEmailJS(pairs, eventName, budget, date) {
    const hasRealKeys =
        EMAILJS_CONFIG.enabled &&
        EMAILJS_CONFIG.serviceId !== "TU_SERVICE_ID" &&
        EMAILJS_CONFIG.templateId !== "TU_TEMPLATE_ID" &&
        EMAILJS_CONFIG.publicKey !== "TU_PUBLIC_KEY";

    if (!hasRealKeys || !window.emailjs) {
        return { sent: false, reason: "Credenciales de prueba (modo enlaces WhatsApp activo)." };
    }

    // Asegurar inicialización de EmailJS v4
    emailjs.init({ publicKey: EMAILJS_CONFIG.publicKey });

    for (const par of pairs) {
        const magicLink = crearEnlaceMagico({
            event: eventName,
            giver: par.giver.name,
            receiver: par.receiver.name,
            budget,
            date
        });

        // Enviamos todos los nombres de variable estándar para que nunca falle por destinatario vacío (422)
        const templateParams = {
            to_name: par.giver.name,
            user_name: par.giver.name,
            name: par.giver.name,
            to_email: par.giver.email.trim(),
            email: par.giver.email.trim(),
            user_email: par.giver.email.trim(),
            recipient: par.giver.email.trim(),
            reply_to: par.giver.email.trim(),
            secret_friend: par.receiver.name,
            event_name: eventName,
            budget: budget,
            date: date,
            magic_link: magicLink
        };

        await emailjs.send(
            EMAILJS_CONFIG.serviceId.trim(),
            EMAILJS_CONFIG.templateId.trim(),
            templateParams,
            { publicKey: EMAILJS_CONFIG.publicKey.trim() }
        );
    }

    return { sent: true };
}

drawBtn.addEventListener('click', async () => {
    const eventName = document.getElementById('event-name').value.trim() || 'Pink Secret Santa';
    const budget = document.getElementById('event-budget').value.trim() || 'Libre';
    const date = document.getElementById('event-date').value || 'Por definir';

    drawBtn.disabled = true;
    drawBtn.textContent = '🌀 Girando cápsula 3D...';
    isSpinningFast = true;
    hideError();

    playSpinSound(1500);
    await new Promise(r => setTimeout(r, 1500));

    try {
        const pairs = generarSorteoCiclico(participants);

        // Generar siempre las tarjetas privadas de WhatsApp / Link como respaldo inmediato
        shareLinksList.innerHTML = pairs.map(par => {
            const link = crearEnlaceMagico({
                event: eventName,
                giver: par.giver.name,
                receiver: par.receiver.name,
                budget: budget,
                date: date
            });
            const msg = encodeURIComponent(`💝 ¡Hola ${par.giver.name}! Ya hicimos el sorteo de "${eventName}". Abre tu cápsula 3D privada para descubrir quién es tu Amigo Secreto: ${link}`);
            return `
                <li class="share-item">
                    <span><strong>${escapeHTML(par.giver.name)}</strong></span>
                    <div class="share-actions">
                        <button type="button" class="btn-copy" onclick="copyMagicLink(this, '${link}')">Copiar link</button>
                        <a href="https://wa.me/?text=${msg}" target="_blank" rel="noopener" class="btn-wa">WhatsApp</a>
                    </div>
                </li>
            `;
        }).join('');

        // Intentar el envío por EmailJS sin bloquear el sorteo si hay un error de configuración en la plantilla
        try {
            const mailResult = await enviarCorreosEmailJS(pairs, eventName, budget, date);
            if (mailResult.sent) {
                emailStatusMsg.textContent = "✅ ¡Correos enviados con éxito! También puedes compartir los enlaces directos por WhatsApp:";
            } else {
                emailStatusMsg.textContent = "Las esferas se han emparejado. Comparte su enlace secreto por WhatsApp con cada participante:";
            }
        } catch (mailErr) {
            console.error("Detalle del error de EmailJS:", mailErr);
            const errText = mailErr?.text || mailErr?.message || "Error 422";
            emailStatusMsg.innerHTML = `<span style="color:#E11D48;font-weight:700;">⚠️ Nota de EmailJS (${escapeHTML(errText)}):</span> Revisa que en tu plantilla de EmailJS el campo <b>"To Email"</b> tenga escrito <code>{{to_email}}</code>. Mientras tanto, usa los botones de WhatsApp abajo:`;
        }

        playSuccessFanfare();

        if (window.confetti) {
            confetti({
                particleCount: 130,
                spread: 85,
                origin: { y: 0.6 },
                colors: ['#EC4899', '#F43F5E', '#FBCFE8', '#DB2777']
            });
        }

        modal.hidden = false;
    } catch (err) {
        showError(err.message);
    } finally {
        isSpinningFast = false;
        updateUI();
    }
});

resetBtn.addEventListener('click', () => {
    participants.length = 0;
    rebuildAllOrbs3D();
    document.getElementById('event-name').value = '';
    modal.hidden = true;
    updateUI();
});
