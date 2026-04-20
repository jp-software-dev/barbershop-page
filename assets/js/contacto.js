// CONTACT FORM: Handle form submission with WhatsApp redirect
document.addEventListener('DOMContentLoaded', function() {
    const contactForm = document.getElementById('contactForm');
    if (contactForm) {
        contactForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // FORM DATA: Get values from inputs
            const nombre = document.getElementById('contactNombre').value.trim();
            const email = document.getElementById('contactEmail').value.trim();
            const mensaje = document.getElementById('contactMensaje').value.trim();
            
            // VALIDATION: Check empty fields
            if (!nombre || !email || !mensaje) {
                alert('Por favor completa todos los campos.');
                return;
            }
            
            // EMAIL VALIDATION: Basic email format check
            const emailPattern = /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/i;
            if (!emailPattern.test(email)) {
                alert('Por favor ingresa un correo electrónico válido.');
                return;
            }
            
            // WHATSAPP: Send message to barber number
            const whatsappNumber = '527299635417';
            const message = `Hola, soy ${nombre}%0A%0ACorreo: ${email}%0A%0AMensaje: ${mensaje}%0A%0A Mi teléfono: +52 ${whatsappNumber}`;
            const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${message}`;
            
            // REDIRECT: Open WhatsApp chat
            window.open(whatsappUrl, '_blank');
            
            // FEEDBACK: Show success message and reset form
            alert('Mensaje enviado. Te contactaremos pronto por WhatsApp.');
            contactForm.reset();
        });
    }
});