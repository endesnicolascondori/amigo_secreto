# 🎁 Amigo Secreto — Web App Sin Fricción

Aplicación web minimalista y **Mobile-First** para organizar sorteos de Amigo Secreto sin necesidad de registro ni contraseñas.

## ✨ Características Principales
- **Cero Fricción (UX):** El organizador ingresa a los participantes y realiza el sorteo en segundos.
- **Algoritmo de Ciclo Hamiltoniano (`Fisher-Yates` + Desplazamiento Circular):** Garantiza matemáticamente que nadie se saque a sí mismo y evita sub-bucles cerrados aislados.
- **Enlaces Mágicos para WhatsApp:** Genera enlaces cifrados en Base64 para que cada participante descubra su asignación desde su celular sin que el organizador vea el resultado.
- **Soporte para EmailJS:** Listo para conectar con EmailJS y disparar correos automáticos.

## 🚀 Cómo publicar en GitHub Pages
1. Sube todos los archivos de este proyecto a un nuevo repositorio en tu cuenta de **GitHub**.
2. Ve a **Settings > Pages** dentro de tu repositorio.
3. En **Branch**, selecciona `main` (o `master`) y la carpeta `/ (root)`, luego presiona **Save**.
4. ¡Listo! En unos segundos tendrás tu URL pública para compartir.

## 📧 Configurar envío automático de correos (Opcional)
1. Crea una cuenta gratuita en [EmailJS](https://www.emailjs.com/).
2. Abre `app.js` y cambia `enabled: true` dentro del objeto `EMAILJS_CONFIG`, colocando tu `serviceId`, `templateId` y `publicKey`.
