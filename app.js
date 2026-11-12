const participants = [];

// Configuración opcional de EmailJS (Reemplaza con tus credenciales si deseas envío directo por email)
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

// Expresión regular estándar para validar emails
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Verificar si la URL contiene un ticket mágico de revelación (?ticket=...)
window.addEventListener('DOMContentLoaded', () => {
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
            if (window.confetti) {
                confetti({ particleCount: 90, spread: 70, origin: { y: 0.6 } });
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
        showError('Por favor, completa tanto el nombre como el correo.');
        return;
    }
    if (!emailRegex.test(email)) {
        showError('Ingresa un formato de correo electrónico válido.');
        return;
    }
    if (participants.some(p => p.email === email)) {
        showError('Este correo ya fue agregado a la lista.');
        return;
    }

    participants.push({ id: crypto.randomUUID(), name, email });
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
        updateUI();
    }
};

function updateUI() {
    listEl.innerHTML = participants.map(p => `
        <li class="participant-item">
            <div class="participant-info">
                <strong>${escapeHTML(p.name)}</strong>
                <span>${escapeHTML(p.email)}</span>
            </div>
            <button class="btn-remove" onclick="removeParticipant('${p.id}')" aria-label="Eliminar">&times;</button>
        </li>
    `).join('');

    const total = participants.length;
    countBadge.textContent = `${total} agregados (Mín. 3)`;

    if (total < 3) {
        drawBtn.disabled = true;
        drawBtn.textContent = `Realizar Sorteo (Faltan ${3 - total})`;
    } else {
        drawBtn.disabled = false;
        drawBtn.textContent = `¡Realizar Sorteo entre ${total}!`;
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
 * Genera un emparejamiento de un solo ciclo cerrado (Ciclo Hamiltoniano).
 * Garantiza 0 auto-asignaciones y 0 sub-bucles aislados.
 */
function generarSorteoCiclico(listaParticipantes) {
    if (!Array.isArray(listaParticipantes) || listaParticipantes.length < 3) {
        throw new Error("Se requieren al menos 3 participantes para evitar bucles directos.");
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

drawBtn.addEventListener('click', async () => {
    const eventName = document.getElementById('event-name').value.trim() || 'Amigo Secreto';
    const budget = document.getElementById('event-budget').value.trim() || 'Libre';
    const date = document.getElementById('event-date').value || 'Por definir';

    drawBtn.disabled = true;
    drawBtn.textContent = 'Sorteando...';

    try {
        const pairs = generarSorteoCiclico(participants);

        // Si EmailJS está habilitado, envía los correos automáticamente
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

        // Generar enlaces mágicos para compartir por WhatsApp o correo sin revelar al organizador
        shareLinksList.innerHTML = pairs.map(par => {
            const link = crearEnlaceMagico({
                event: eventName,
                giver: par.giver.name,
                receiver: par.receiver.name,
                budget: budget,
                date: date
            });
            const msg = encodeURIComponent(`🎁 ¡Hola ${par.giver.name}! Ya se hizo el sorteo de "${eventName}". Descubre quién es tu Amigo Secreto en tu enlace privado: ${link}`);
            return `
                <li class="share-item">
                    <span><strong>${escapeHTML(par.giver.name)}</strong></span>
                    <a href="https://wa.me/?text=${msg}" target="_blank" rel="noopener" class="btn-wa">Enviar por WhatsApp</a>
                </li>
            `;
        }).join('');

        if (window.confetti) {
            confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
        }

        modal.hidden = false;
    } catch (err) {
        showError(err.message);
    } finally {
        updateUI();
    }
});

resetBtn.addEventListener('click', () => {
    participants.length = 0;
    document.getElementById('event-name').value = '';
    modal.hidden = true;
    updateUI();
});
