import nodemailer from "nodemailer";
import formatNumber from "../../utils/formatNumber.js";
import formatDateCorrect from "../../utils/dateUtils.js";

const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
    },
});

transporter.verify().then(() => {
    console.log("Ready for send emails");
});

const emailTemplate = (content) => {
    `
        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); overflow: hidden;">
                <!-- Header -->
                <div style="background-color: #000000; padding: 20px; text-align: center; font-family: Helvetica;">
                    <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 300;">Albornoz & Guerineau</h1>
                    <p style="color: #ffffff; margin: 5px 0 0; font-size: 16px; font-weight: 300;">Servicios Bursátiles</p>
                </div>
                
                
                <!-- Footer -->
                <div style="background-color: #f5f5f5; padding: 20px; text-align: center; font-size: 12px; color: #666666; font-family: Helvetica;">
                    <p style="margin: 0;">© Powered by <a href="https://www.instagram.com/koistudiook" target="_blank">Koi Studio</a> </p>
                </div>
            </div>
        </div>
    `;
};

export const sendResetPasswordEmail = async (email, resetToken) => {
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;
    const content = `
        <div style="max-width: 600px; margin: 0 auto;">
            <div style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); overflow: hidden;">
                <!-- Header -->
                <div style="background-color: #000000; padding: 20px; text-align: center; font-family: Helvetica;">
                    <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 300;">Albornoz & Guerineau</h1>
                    <p style="color: #ffffff; margin: 5px 0 0; font-size: 16px; font-weight: 300;">Servicios Bursátiles</p>
                </div>
                
                <!-- Content -->
                <div style="padding: 30px 20px; font-family: Helvetica; min-height: 300px">
                    <p>Hola,</p>
            <p>Recibimos una solicitud para restablecer tu contraseña en A&G App. Si realizaste esta solicitud, haz clic en el enlace a continuación para crear una nueva contraseña:</p>
            <a href="${resetUrl}">Reestablecer contraseña</a>
            <p>Este enlace expirará en 1 hora. Si no solicitaste este cambio, puedes ignorar este correo.</p>
            <p>Si tienes alguna pregunta o necesitas ayuda, no dudes en contactarnos.</p>
                    <p>Atentamente,</p>
                    <p>A&G App Team</p>
                </div>
                
                <!-- Footer -->
                <div style="background-color: #f5f5f5; padding: 20px; text-align: center; font-size: 12px; color: #666666; font-family: Helvetica;">
                    <p style="margin: 0;">© Powered by <a href="https://www.instagram.com/koistudiook" target="_blank">Koi Studio</a> </p>
                </div>
            </div>
        </div>
    `;

    const mailOptions = {
        from: `A&G <${process.env.EMAIL_USER}>`,
        to: email,
        subject: "🔑 Restablece tu contraseña",
        html: content,
    };

    await transporter.sendMail(mailOptions);
};

//deberia enviar un link a una ruta en el front para activar la cuenta
export const sendActivateAccountEmail = async (email, name) => {
    const activateAccountUrl = `${process.env.FRONTEND_URL}/activate`;

    const mailOptions = {
        from: `A&G <${process.env.EMAIL_USER}>`,
        to: email,
        subject: "Activación de Cuenta - A&G App",
        html: `
            <div>
                <h1>Activación de Cuenta</h1>
                <p>Hola ${name},</p>
                <p>Para activar tu cuenta, por favor haz clic en el siguiente enlace:</p>
                <a href="${activateAccountUrl}">Activar Cuenta</a>
            </div>
        `,
    };

    await transporter.sendMail(mailOptions);
};

export const sendWelcomeEmail = async (email, name, password) => {
    const content = `
            <div style="max-width: 600px; margin: 0 auto;">
            <div style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); overflow: hidden;">
                <!-- Header -->
                <div style="background-color: #000000; padding: 20px; text-align: center; font-family: Helvetica;">
                    <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 300;">Albornoz & Guerineau</h1>
                    <p style="color: #ffffff; margin: 5px 0 0; font-size: 16px; font-weight: 300;">Servicios Bursátiles</p>
                </div>
                
                <!-- Content -->
                <div style="padding: 30px 20px; font-family: Helvetica; min-height: 300px">
                    <p>Hola ${name},</p>
            <p>¡Nos alegra darte la bienvenida a A&G App! Ahora tienes acceso a una plataforma diseñada para facilitar la gestión y el seguimiento de tu portafolio de inversiones.</p>
            <ul>
                <li>Explora tu dashboard personalizado.</li>
                <li>Consulta reportes y rendimiento de tu portafolio.</li>
                <li>Solicita transacciones y recibe confirmaciones instantáneas.</li>
            </ul>
            <p>Tus credenciales de acceso son:</p>
            <p>Email: <strong>${email}</strong></p>
            <p>Contraseña: <strong>${password}</strong></p>
            <p>Para comenzar a utilizar A&G App, por favor haz clic en el siguiente enlace:</p>
            <a href="${process.env.FRONTEND_URL}/login">Iniciar Ahora</a>
            <p>Si tienes alguna pregunta o necesitas ayuda, no dudes en contactarnos.</p>
            <p>¡Que tengas una excelente experiencia con A&G App!</p>
                    <p>Atentamente,</p>
                    <p>A&G App Team</p>
                </div>
                
                <!-- Footer -->
                <div style="background-color: #f5f5f5; padding: 20px; text-align: center; font-size: 12px; color: #666666; font-family: Helvetica;">
                    <p style="margin: 0;">© Powered by <a href="https://www.instagram.com/koistudiook" target="_blank">Koi Studio</a> </p>
                </div>
            </div>
        </div>
        `;
    const mailOptions = {
        from: `A&G <${process.env.EMAIL_USER}>`,
        to: email,
        subject: "🎉 ¡Bienvenido a A&G App! Empieza a gestionar tu cuenta hoy",
        html: content,
    };

    await transporter.sendMail(mailOptions);
};

export const sendReportEmail = async (email, name) => {
    const mailOptions = {
        from: `A&G <${process.env.EMAIL_USER}>`,
        to: email,
        subject: "📊 Tu reporte mensual está listo para revisar",
        html: `
            <div style="max-width: 600px; margin: 0 auto;">
            <div style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); overflow: hidden;">
                <!-- Header -->
                <div style="background-color: #000000; padding: 20px; text-align: center; font-family: Helvetica;">
                    <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 300;">Albornoz & Guerineau</h1>
                    <p style="color: #ffffff; margin: 5px 0 0; font-size: 16px; font-weight: 300;">Servicios Bursátiles</p>
                </div>
                
                <!-- Content -->
                <div style="padding: 30px 20px; font-family: Helvetica; min-height: 300px">
            <p>Hola ${name},</p>
            <p>Ya tienes disponible tu nuevo reporte mensual.
            <p>Para acceder a él, por favor haz clic en el siguiente enlace:</p>
            <a href="${process.env.FRONTEND_URL}">Ver Reporte</a>
            <p>Si tienes alguna pregunta o necesitas ayuda, no dudes en contactarnos.</p>
            <p>¡Que tengas una excelente experiencia con A&G App!</p>
                    <p>Atentamente,</p>
                    <p>A&G App Team</p>
                </div>
                
                <!-- Footer -->
                <div style="background-color: #f5f5f5; padding: 20px; text-align: center; font-size: 12px; color: #666666; font-family: Helvetica;">
                    <p style="margin: 0;">© Powered by <a href="https://www.instagram.com/koistudiook" target="_blank">Koi Studio</a> </p>
                </div>
            </div>
        </div>
        `,
    };

    await transporter.sendMail(mailOptions);
};

export const sendTransactionRequestEmail = async (
    email,
    name,
    type,
    amount,
    date,
    currency
) => {
    const mailOptions = {
        from: `A&G <${process.env.EMAIL_USER}>`,
        to: `${process.env.EMAIL_USER}, albornozyguerineau@gmail.com`,
        subject: "⚠️ Nueva solicitud de transacción pendiente de aprobación",
        html: `
        <div style="max-width: 600px; margin: 0 auto;">
            <div style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); overflow: hidden;">
                <!-- Header -->
                <div style="background-color: #000000; padding: 20px; text-align: center; font-family: Helvetica;">
                    <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 300;">Albornoz & Guerineau</h1>
                    <p style="color: #ffffff; margin: 5px 0 0; font-size: 16px; font-weight: 300;">Servicios Bursátiles</p>
                </div>
                <div style="padding: 30px 20px; font-family: Helvetica; min-height: 300px">
                <p>Hola administrador,</p>
                <p>Hemos recibido una solicitud de transacción pendiente de aprobación.</p>
                <h2>📌Detalles de la solicitud:</h2>
                <ul>
                    <li>Usuario: <strong>${name}</strong> (${email})</li>
                    <li>Tipo de transacción: <strong>${type}</strong></li>
                    <li>Monto: <strong>${formatNumber(amount)}</strong></li>
                    <li>Fecha: <strong>${date}</strong></li>
                    <li>Moneda: <strong>${currency}</strong></li>
                </ul>
                <p>Para aprobar la transacción, por favor ingrese a la siguiente ruta: </p>
                <a href="${
                    process.env.FRONTEND_URL
                }/admin/transactions">Revisar transacción</a>
                <p>Si tienes alguna pregunta o necesitas ayuda, no dudes en contactarnos.</p>
                </div>
                
                <!-- Footer -->
                <div style="background-color: #f5f5f5; padding: 20px; text-align: center; font-size: 12px; color: #666666; font-family: Helvetica;">
                    <p style="margin: 0;">© Powered by <a href="https://www.instagram.com/koistudiook" target="_blank">Koi Studio</a> </p>
                </div>
            </div>
        </div>
    `,
    };

    await transporter.sendMail(mailOptions);
};

export const sendTransactionConfirmationEmail = async (
    email,
    name,
    status,
    type,
    amount,
    date
) => {
    const mailOptions = {
        from: `A&G <${process.env.EMAIL_USER}>`,
        to: email,
        subject: `${
            status === "completado" ? "✅" : "❌"
        } Tu transacción ha sido ${status}`,
        html: `
        <div style="max-width: 600px; margin: 0 auto;">
            <div style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); overflow: hidden;">
                <!-- Header -->
                <div style="background-color: #000000; padding: 20px; text-align: center; font-family: Helvetica;">
                    <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 300;">Albornoz & Guerineau</h1>
                    <p style="color: #ffffff; margin: 5px 0 0; font-size: 16px; font-weight: 300;">Servicios Bursátiles</p>
                </div>
                <div style="padding: 30px 20px; font-family: Helvetica; min-height: 300px">
                <p>Hola ${name},</p>
        <p>Queremos informarte que tu ${type} ha sido ${status}.</p>
        <h2>📌Detalles de ${type}:</h2>
                <ul>
                    <li>Usuario: <strong>${name}</strong> (${email})</li>
                    <li>Tipo de transacción: <strong>${type}</strong></li>
                    <li>Monto: <strong>${formatNumber(amount)}</strong></li>
                    <li>Fecha de solicitud: <strong>${formatDateCorrect(
                        date
                    )}</strong></li>
                </ul>
        <p>Puedes verificar los detalles en tu cuenta aquí:</p>
        <a href="${
            process.env.FRONTEND_URL
        }/panel/transactions">Ver transacciones</a>
        <p>Si tienes alguna pregunta o necesitas ayuda, no dudes en contactarnos.</p>
                </div>
                <!-- Footer -->
                <div style="background-color: #f5f5f5; padding: 20px; text-align: center; font-size: 12px; color: #666666; font-family: Helvetica;">
                    <p style="margin: 0;">© Powered by <a href="https://www.instagram.com/koistudiook" target="_blank">Koi Studio</a> </p>
                </div>
            </div>
        </div>
    `,
    };

    await transporter.sendMail(mailOptions);
};

export const sendCustomEmail = async (email, name, subject, message) => {
    const mailOptions = {
        from: `A&G <${process.env.EMAIL_USER}>`,
        to: `${process.env.EMAIL_USER}, albornozyguerineau@gmail.com`,
        subject: subject,
        html: `
        <div style="max-width: 600px; margin: 0 auto;">
            <div style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); overflow: hidden;">
                <!-- Header -->
                <div style="background-color: #000000; padding: 20px; text-align: center; font-family: Helvetica;">
                    <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 300;">Albornoz & Guerineau</h1>
                    <p style="color: #ffffff; margin: 5px 0 0; font-size: 16px; font-weight: 300;">Servicios Bursátiles</p>
                </div>
                <div style="padding: 30px 20px; font-family: Helvetica; min-height: 300px;">
                    <p>Mensaje enviado por: <strong>${name}</strong>.</p>
                    <p>${message}</p>
                    <p>Responda a este correo: <strong>${email}</strong></p>
                </div>
                
                <!-- Footer -->
                <div style="background-color: #f5f5f5; padding: 20px; text-align: center; font-size: 12px; color: #666666; font-family: Helvetica;">
                    <p style="margin: 0;">© Powered by <a href="https://www.instagram.com/koistudiook" target="_blank">Koi Studio</a> </p>
                </div>
            </div>
        </div>
    `,
    };

    await transporter.sendMail(mailOptions);
};
