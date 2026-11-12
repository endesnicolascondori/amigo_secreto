const participants = [];

// Configuración opcional de EmailJS
const EMAILJS_CONFIG = {
    enabled: true, // Cambia a true cuando pongas tus claves de EmailJS
    serviceId: "service_7ky7vbo",
    templateId: "template_61vzke4",
    publicKey: "oHQKLmafkyrjLrZNe"
};

// Elementos del DOM
const form = document.getElementById('participant-form');
const nameInput = document.getElementById('p-name');
const emailInput = document.getElementById('p-email');
const errorMsg = document.getElementById('form-error');
const listEl = document.getElementById('participant-list');
const countBadge = document.getElementById('participant-count');
const drawBtn = document.getElementById('draw-btn');
const modal = document.getElementById('success-modal');
const shareLinksList = document.getElementById('share-links-list');
const resetBtn = document.getElementById('reset-btn');

// Indicadores de pasos
const step2Ind = document.getElementById('step-2-indicator');
const step3Ind = document.getElementById('step-3-indicator');

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/* ==========================================
   MOTOR 3D CON THREE.JS (ESCENA ROSA INTERACTIVA)
   ========================================== */
let scene, camera, renderer, giftGroup, participantOrbs = [];
let isSpinningFast = false;
let mouseX = 0, mouseY = 0;

function initThreeJS() {
    const canvas = document.getElementById('bg-canvas');
    if (!window.THREE || !canvas) return;

    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 11;

    renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    // Iluminación cálida rosada y dorada
    const ambientLight = new THREE.AmbientLight(0xffe4e6, 0.85);
    scene.add(ambientLight);

    const pointLight1 = new THREE.PointLight(0xec4899, 1.4, 30);
    pointLight1.position.set(6, 6, 6);
    scene.add(pointLight1);

    const pointLight2 = new THREE.PointLight(0xf43f5e, 1.1, 30);
    pointLight2.position.set(-6, -5, 4);
    scene.add(pointLight2);

    // Grupo central: Regalo 3D / Núcleo mágico
    giftGroup = new THREE.Group();
    scene.add(giftGroup);

    // Caja de regalo estilizada (TorusKnot central brillante + Halo)
    const coreGeo = new THREE.TorusKnotGeometry(1.15, 0.34, 100, 16);
    const coreMat = new THREE.MeshPhysicalMaterial({
        color: 0xec4899,
        emissive: 0x831843,
        emissiveIntensity: 0.25,
        roughness: 0.2,
        metalness: 0.3,
        clearcoat: 1.0
    });
    const coreMesh = new THREE.Mesh(coreGeo, coreMat);
    giftGroup.add(coreMesh);

    // Anillo orbital dorado rosa
    const ringGeo = new THREE.TorusGeometry(2.2, 0.05, 16, 100);
    const ringMat = new THREE.MeshStandardMaterial({ color: 0xf43f5e, roughness: 0.3, metalness: 0.8 });
    const ringMesh = new THREE.Mesh(ringGeo, ringMat);
    ringMesh.rotation.x = Math.PI / 3;
    giftGroup.add(ringMesh);

    // Posicionar el núcleo ligeramente arriba a la derecha en pantallas grandes
    giftGroup.position.set(0, 1.8, -2);

    // Interacción con el mouse / toque
    window.addEventListener('mousemove', (e) => {
        mouseX = (e.clientX / window.innerWidth - 0.5) * 2;
        mouseY = (e.clientY / window.innerHeight - 0.5) * 2;
    });

    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    });

    animateThreeJS();
}

// Añade una esfera 3D brillante cada vez que se agrega un participante
function addParticipantOrb3D() {
    if (!scene) return;
    const colors = [0xec4899, 0xf43f5e, 0xdb2777, 0xf472b6, 0xfb7185];
    const color = colors[participantOrbs.length % colors.length];

    const geo = new THREE.SphereGeometry(0.38, 32, 32);
    const mat = new THREE.MeshPhysicalMaterial({
        color,
        roughness: 0.15,
        metalness: 0.2,
        clearcoat: 1
    });
    const orb = new THREE.Mesh(geo, mat);

    const angle = participantOrbs.length * 1.2;
    const radius = 3.6 + (participantOrbs.length % 3) * 0.7;
    orb.userData = { angle, radius, speed: 0.01 + Math.random() * 0.01, yOffset: (Math.random() - 0.5) * 3 };

    scene.add(orb);
    participantOrbs.push(orb);
}

function removeParticipantOrb3D() {
    if (!scene || participantOrbs.length === 0) return;
    const orb = participantOrbs.pop();
    scene.remove(orb);
}

function clearParticipantOrbs3D() {
    while (participantOrbs.length > 0) {
        removeParticipantOrb3D();
    }
}

function animateThreeJS() {
    requestAnimationFrame(animateThreeJS);

    const spinSpeed = isSpinningFast ? 0.18 : 0.008;
    if (giftGroup) {
        giftGroup.rotation.y += spinSpeed;
        giftGroup.rotation.x += spinSpeed * 0.6;
        giftGroup.position.x += (mouseX * 1.2 - giftGroup.position.x) * 0.05;
        giftGroup.position.y += (-mouseY * 0.8 + 1.2 - giftGroup.position.y) * 0.05;
    }

    participantOrbs.forEach((orb, idx) => {
        orb.userData.angle += isSpinningFast ? 0.14 : orb.userData.speed;
        orb.position.x = Math.cos(orb.userData.angle) * orb.userData.radius;
        orb.position.z = Math.sin(orb.userData.angle) * orb.userData.radius - 2;
        orb.position.y = orb.userData.yOffset + Math.sin(orb.userData.angle * 2 + idx) * 0.6;
    });

    renderer.render(scene, camera);
}

/* ==========================================
   LÓGICA DE NEGOCIO Y FLUJO UX
   ========================================== */
window.addEventListener('DOMContentLoaded', () => {
    initThreeJS();

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

            // Añadir esferas decorativas para la vista de revelación
            for (let i = 0; i < 6; i++) addParticipantOrb3D();

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

    participants.push({ id: crypto.randomUUID(), name, email });
    addParticipantOrb3D();

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
        removeParticipantOrb3D();
        updateUI();
    }
};

function getInitials(name) {
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
}

function updateUI() {
    listEl.innerHTML = participants.map(p => `
        <li class="participant-item">
            <div class="participant-left">
                <div class="avatar-circle">${escapeHTML(getInitials(p.name))}</div>
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
        const original = btn.textContent;
        btn.textContent = '¡Copiado!';
        setTimeout(() => btn.textContent = original, 1800);
    });
};

drawBtn.addEventListener('click', async () => {
    const eventName = document.getElementById('event-name').value.trim() || 'Pink Secret Santa';
    const budget = document.getElementById('event-budget').value.trim() || 'Libre';
    const date = document.getElementById('event-date').value || 'Por definir';

    drawBtn.disabled = true;
    drawBtn.textContent = '🌀 Mezclando esferas en 3D...';
    isSpinningFast = true;

    // Pausa dramática para disfrutar la animación 3D de Three.js
    await new Promise(r => setTimeout(r, 1400));

    try {
        const pairs = generarSorteoCiclico(participants);

        if (EMAILJS_CONFIG.enabled && window.emailjs) {
            const envios = pairs.map(par => {
                return emailjs.send(EMAILJS_CONFIG.serviceId, EMAILJS_CONFIG.templateId, {
                    to_name: par.giver.name,
                    to_email: par.giver.email,
                    secret_friend: par.receiver.name,
                    event_name: eventName,
                    budget: budget,
                    date: date
                }, EMAILJS_CONFIG.publicKey);
            });
            await Promise.all(envios);
        }

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

        if (window.confetti) {
            confetti({
                particleCount: 120,
                spread: 80,
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
    clearParticipantOrbs3D();
    document.getElementById('event-name').value = '';
    modal.hidden = true;
    updateUI();
});
