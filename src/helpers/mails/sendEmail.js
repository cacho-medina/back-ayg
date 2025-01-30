import nodemailer from "nodemailer";

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

export const sendResetPasswordEmail = async (email, resetToken) => {
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;

    const mailOptions = {
        from: `A&G <${process.env.EMAIL_USER}>`,
        to: email,
        subject: "Recuperación de Contraseña - A&G App",
        html: `
            <div style="background-color: #f6f6f6; padding: 20px;">
                <h1>Recuperación de Contraseña</h1>
                <p>Has solicitado restablecer tu contraseña.</p>
                <div style="margin: 20px 0;">
                    <a href="${resetUrl}" 
                       style="background-color: #4CAF50; color: white; padding: 15px 25px; text-decoration: none; border-radius: 4px;">
                        Restablecer Contraseña
                    </a>
                </div>
                <p><strong>Este enlace expirará en 1 hora.</strong></p>
                <p>Si no solicitaste este cambio, ignora este correo.</p>
            </div>
        `,
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

export const sendWelcomeEmail = async (email, name) => {
    const mailOptions = {
        from: `A&G <${process.env.EMAIL_USER}>`,
        to: email,
        subject: "Bienvenido a A&G App",
        html: `
            <div>
                <h1>Bienvenido a A&G App</h1>
                <p>Hola ${name},</p>
                <p>Te damos la bienvenida a A&G App. Esperamos que encuentres lo que buscas.</p>
            </div>
        `,
    };

    await transporter.sendMail(mailOptions);
};

export const sendReportEmail = async (email, name, reportUrl) => {
    const mailOptions = {
        from: `A&G <${process.env.EMAIL_USER}>`,
        to: email,
        subject: "Información de A&G App",
        html: `
            <div>
                <h1>Información de A&G App</h1>
                <p>Hola ${name},</p>
                <p>Ya tienes disponible tu nuevo reporte mensual. Haz clic en el siguiente enlace para verlo:</p>
                <a href="${reportUrl}">Ver Reporte</a>
            </div>
        `,
    };

    await transporter.sendMail(mailOptions);
};
