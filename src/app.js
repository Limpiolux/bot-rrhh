import { join } from "path";
import {
  createBot,
  createProvider,
  createFlow,
  addKeyword,
  utils,
} from "@builderbot/bot";
import { JsonFileDB as Database } from "@builderbot/database-json";
import { BaileysProvider as Provider } from "@builderbot/provider-baileys";
import nodemailer from "nodemailer";
import axios from "axios";

const transporter = nodemailer.createTransport({
  service: "Office365",
  host: "smtp.office365.com",
  port: 587,
  secure: false,
  auth: {
    user: "pautomate@limpiolux.com.ar",
    pass: "Sard1na.3400",
  },
});

async function sendPostRequest(number, message, urlMedia) {
  const url = "http://localhost:7137/v1/messages";

  try {
    const response = await axios.post(url, {
      number: number,
      message: message,
      urlMedia: urlMedia,
    });

    console.log("Respuesta del servidor:", response.data);
  } catch (error) {
    console.error("Error al enviar la solicitud POST:", error);
  }
}

const phoneNumber = "5491128744118";

let mailOptions = {
  from: "pautomate@limpiolux.com.ar",
  to: "avillaverde@limpiolux.com.ar, ptripodi@limpiolux.com.ar",
  subject: "Nueva consulta Chatbot RRHH",
  text: "Hola! Hay una nueva consulta en el Chabot de RRHH",
  html: "<b>Hola! Hay una nueva consulta en el Chabot de RRHH</b>",
};

const PORT = process.env.PORT ?? 7137;

async function handleExit(ctx, gotoFlow) {
  const response = ctx.body.trim().toLowerCase();

  if (response === "salir") {
    await gotoFlow(salirFlow);
    return true;
  }
  return false;
}

const bienvenidaFlow = addKeyword([
  "hi",
  "hola",
  "saludo",
  "buenos dias",
]).addAnswer(
  `¡Hola, bienvenido/a! Mi nombre es LimpioBot y estoy aquí para ayudarte. Por favor, escribe "Continuar" para comenzar.`,
  { capture: true },
  async (ctx, { gotoFlow, flowDynamic, fallBack }) => {
    const response = ctx.body.trim().toLowerCase();
    if (response === "continuar") {
      return gotoFlow(inicioFlow);
    } else {
      await flowDynamic(
        "No entendí tu respuesta. Por favor, escribe Continuar para comenzar."
      );
    }
  }
);

const inicioFlow = addKeyword(["continuar"]).addAnswer(
  `¡Hola, mi nombre es LimpioBot y estoy para ayudarte! ¿Sos empleado/a de Grupo Limpiolux?
1. Si
2. No, nunca fui empleado de Grupo Limpiolux.
3. Estoy en proceso de ingreso
4. Ya no`,
  { capture: true },
  async (ctx, { gotoFlow, flowDynamic, fallBack }) => {
    const response = ctx.body.trim();
    if (await handleExit(ctx, gotoFlow)) return;
    if (response === "1" || response === "4") {
      return gotoFlow(businessUnitFlow);
    } else if (response === "2") {
      return gotoFlow(CvFlow);
    } else if (response === "3") {
      return gotoFlow(EstudiosFlow);
    } else {
      await fallBack("Por favor selecciona una opción válida.");
    }
  }
);

const obrasSocialesFlow = addKeyword(utils.setEvent("BUSINESS_FLOW")).addAnswer(
  `1. No puedo darme de alta en mi obra social, ¿qué puedo hacer?
2. Quiero saber qué obra social tengo.
3. Quiero cambiarme de obra social.
4. Otra consulta`,
  { capture: true },
  async (ctx, { flowDynamic, gotoFlow }) => {
    if (await handleExit(ctx, gotoFlow)) return;

    await flowDynamic(
      "Estamos procesando tu consulta sobre Obras Sociales. Decinos tu número de DNI (sin puntos) para poder asesorarte"
    );
    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        return console.log("Error al enviar el correo:", error);
      }
      console.log("Correo enviado:", info.response);
    });
    sendPostRequest(
      phoneNumber,
      "Hola! Hay una nueva Consulta del Chatbot RRHH sobre Obra Social",
      ""
    );
  }
);

const cuentaBancariaFlow = addKeyword("b", { sensitive: true }).addAnswer(
  `5. No me llegó mi tarjeta de débito, ¿qué hago?
6. Desde el banco no me contestan los mensajes.
7. Quiero cambiar mi cuenta sueldo por otro banco.
8. Otra consulta`,
  { capture: true },
  async (ctx, { flowDynamic, gotoFlow }) => {
    if (await handleExit(ctx, gotoFlow)) return;

    await flowDynamic(
      "Estamos procesando tu consulta sobre Cuenta Bancaria. Decinos tu número de DNI (sin puntos) para poder asesorarte"
    );
    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        return console.log("Error al enviar el correo:", error);
      }
      console.log("Correo enviado:", info.response);
    });
    sendPostRequest(
      phoneNumber,
      "Hola! Hay una nueva Consulta del Chatbot RRHH sobre Cuenta Bancaria",
      ""
    );
  }
);

const licenciasFlow = addKeyword("c", { sensitive: true }).addAnswer(
  `9. Estoy embarazada, ¿qué pasos tengo que seguir para gozar de mi licencia?
10. Falleció un familiar, ¿cuántos días me corresponden?
11. Otra consulta`,
  { capture: true },
  async (ctx, { flowDynamic, gotoFlow }) => {
    if (await handleExit(ctx, gotoFlow)) return;

    await flowDynamic(
      "Estamos procesando tu consulta sobre Licencias. Decinos tu número de DNI (sin puntos) para poder asesorarte"
    );
    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        return console.log("Error al enviar el correo:", error);
      }
      console.log("Correo enviado:", info.response);
    });
    sendPostRequest(
      phoneNumber,
      "Hola! Hay una nueva Consulta del Chatbot RRHH sobre Licencias",
      ""
    );
  }
);

const sueldoFlow = addKeyword("d", { sensitive: true }).addAnswer(
  `12. No puedo ingresar para ver mi recibo, lo tengo bloqueado.
13. Me descontaron días en mi recibo y yo no falté/ lo justifiqué. Mi supervisor/a ya está enterado/a.
14. Faltan horas extras en mi recibo de sueldo. Mi supervisor/a ya está enterado/a.
15. Otra consulta`,
  { capture: true },
  async (ctx, { flowDynamic, gotoFlow }) => {
    if (await handleExit(ctx, gotoFlow)) return;

    await flowDynamic(
      "Estamos procesando tu consulta sobre Sueldo. Decinos tu número de DNI (sin puntos) para poder asesorarte"
    );
    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        return console.log("Error al enviar el correo:", error);
      }
      console.log("Correo enviado:", info.response);
    });
    sendPostRequest(
      phoneNumber,
      "Hola! Hay una nueva Consulta del Chatbot RRHH sobre Sueldo",
      ""
    );
  }
);

const certificadosFlow = addKeyword("e", { sensitive: true }).addAnswer(
  `16. Tengo a mi hijo/a enfermo/a, ¿a dónde tengo que llevar el certificado?
17. Tengo a mi hijo/a enfermo/a, ¿tengo los días cubiertos?
18. Otra consulta`,
  { capture: true },
  async (ctx, { flowDynamic, gotoFlow }) => {
    if (await handleExit(ctx, gotoFlow)) return;

    await flowDynamic(
      "Estamos procesando tu consulta sobre Certificados. Decinos tu número de DNI (sin puntos) para poder asesorarte"
    );
    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        return console.log("Error al enviar el correo:", error);
      }
      console.log("Correo enviado:", info.response);
    });
    sendPostRequest(
      phoneNumber,
      "Hola! Hay una nueva Consulta del Chatbot RRHH sobre Certificados",
      ""
    );
  }
);

const saludFlow = addKeyword("f", { sensitive: true }).addAnswer(
  `19. ¿Dónde debo entregar el certificado con reposo por 24hs?
20. ¿Dónde debo entregar el certificado con reposo por 48hs o más?
21. Otra consulta`,
  { capture: true },
  async (ctx, { flowDynamic, gotoFlow }) => {
    if (await handleExit(ctx, gotoFlow)) return;

    await flowDynamic(
      "Estamos procesando tu consulta sobre Salud. Decinos tu número de DNI (sin puntos) para poder asesorarte"
    );
    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        return console.log("Error al enviar el correo:", error);
      }
      console.log("Correo enviado:", info.response);
    });
    sendPostRequest(
      phoneNumber,
      "Hola! Hay una nueva Consulta del Chatbot RRHH sobre Salud",
      ""
    );
  }
);

const vacacionesFlow = addKeyword("g", { sensitive: true }).addAnswer(
  `22. Quiero saber cuántos días de vacaciones me quedan.
23. Otra consulta`,
  { capture: true },
  async (ctx, { flowDynamic, gotoFlow }) => {
    if (await handleExit(ctx, gotoFlow)) return;

    await flowDynamic(
      "Estamos procesando tu consulta sobre Vacaciones. Decinos tu número de DNI (sin puntos) para poder asesorarte"
    );
    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        return console.log("Error al enviar el correo:", error);
      }
      console.log("Correo enviado:", info.response);
    });
    sendPostRequest(
      phoneNumber,
      "Hola! Hay una nueva Consulta del Chatbot RRHH sobre Vacaciones",
      ""
    );
  }
);

const beneficiosFlow = addKeyword("h", { sensitive: true }).addAnswer(
  `24. Quiero consultar por los beneficios actuales
25. Otra consulta`,
  { capture: true },
  async (ctx, { flowDynamic, gotoFlow }) => {
    if (await handleExit(ctx, gotoFlow)) return;

    await flowDynamic(
      "Estamos procesando tu consulta sobre Beneficios. Decinos tu número de DNI (sin puntos) para poder asesorarte"
    );
    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        return console.log("Error al enviar el correo:", error);
      }
      console.log("Correo enviado:", info.response);
    });
    sendPostRequest(
      phoneNumber,
      "Hola! Hay una nueva Consulta del Chatbot RRHH sobre Beneficios",
      ""
    );
  }
);

const documentacionFlow = addKeyword("i", { sensitive: true }).addAnswer(
  `26. Ya no trabajo más en la empresa, ¿dónde debo entregar el uniforme?
27. Quiero enviar el telegrama de renuncia, pero no tengo los datos de la empresa.
28. No recibí el telegrama.
29. Necesito mis certificados de servicio y art 80.
30. Otra consulta`,
  { capture: true },
  async (ctx, { flowDynamic, gotoFlow }) => {
    if (await handleExit(ctx, gotoFlow)) return;

    await flowDynamic(
      "Estamos procesando tu consulta sobre Documentacion. Decinos tu número de DNI (sin puntos) para poder asesorarte"
    );
    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        return console.log("Error al enviar el correo:", error);
      }
      console.log("Correo enviado:", info.response);
    });
    sendPostRequest(
      phoneNumber,
      "Hola! Hay una nueva Consulta del Chatbot RRHH sobre Documentación",
      ""
    );
  }
);

const otrasConsultasFlow = addKeyword("j", { sensitive: true }).addAnswer(
  `31. Me mudé y tengo que actualizar la dirección, ¿dónde completo el nuevo formulario?
32. Quisiera hablar con Recursos Humanos`,
  { capture: true },
  async (ctx, { flowDynamic, gotoFlow }) => {
    if (await handleExit(ctx, gotoFlow)) return;

    await flowDynamic(
      "Estamos procesando tu consulta sobre Otras Consultas. Decinos tu número de DNI (sin puntos) para poder asesorarte"
    );
    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        return console.log("Error al enviar el correo:", error);
      }
      console.log("Correo enviado:", info.response);
    });
    sendPostRequest(
      phoneNumber,
      "Hola! Hay una nueva Consulta del Chatbot RRHH sobre Otras Consultas",
      ""
    );
  }
);

const assistanceFlow = addKeyword(utils.setEvent("ASSISTANCE_FLOW")).addAnswer(
  `¿En qué podemos ayudarte?
1. Obras sociales
2. Cuenta bancaria
3. Licencias
4. Sueldo
5. Certificados
6. Salud 
7. Vacaciones
8. Beneficios
9. Documentación de baja
10. Otras consultas`,
  { capture: true },
  async (ctx, { gotoFlow, flowDynamic }) => {
    const response = ctx.body.trim().toLowerCase();

    if (response === "salir") {
      await flowDynamic("Hasta luego! 😁");
      return;
    }

    switch (response) {
      case "1":
        return gotoFlow(obrasSocialesFlow);
      case "2":
        return gotoFlow(cuentaBancariaFlow);
      case "3":
        return gotoFlow(licenciasFlow);
      case "4":
        return gotoFlow(sueldoFlow);
      case "5":
        return gotoFlow(certificadosFlow);
      case "6":
        return gotoFlow(saludFlow);
      case "7":
        return gotoFlow(vacacionesFlow);
      case "8":
        return gotoFlow(beneficiosFlow);
      case "9":
        return gotoFlow(documentacionFlow);
      case "10":
        return gotoFlow(otrasConsultasFlow);
      default:
        await flowDynamic("Selecciona una opción válida.");
    }
  }
);

const businessUnitFlow = addKeyword("BUSINESS_FLUJO").addAnswer(
  `¿En qué unidad de negocio de Grupo Limpiolux trabajas o trabajaste?
1.	Limpiolux
2.	FBM
3.	T&T
4.	Distmaster
5.	Ceiling`,
  { capture: true },
  async (ctx, { gotoFlow, flowDynamic }) => {
    const response = ctx.body.trim().toLowerCase();

    switch (response) {
      case "1":
        return gotoFlow(assistanceFlow);
      case "2":
        return gotoFlow(assistanceFlow);
      case "3":
        return gotoFlow(assistanceFlow);
      case "4":
        return gotoFlow(assistanceFlow);
      case "5":
        return gotoFlow(assistanceFlow);
      default:
        await flowDynamic("Selecciona una opción válida.");
    }
  }
);

const CvFlow = addKeyword("CV_FLUJO", { sensitive: true }).addAnswer(
  `¡Gracias por escribirnos! Si queres ser parte de nuestro equipo, ingresá en https://limpiolux.com.ar/postulacion/ y dejanos tu CV.`,
  { capture: true },
  async (ctx, { flowDynamic, gotoFlow }) => {
    if (await handleExit(ctx, gotoFlow)) return;
  }
);

const EstudiosFlow = addKeyword("ESTUDIOS_FLUJO", {
  sensitive: true,
}).addAnswer(
  `Si ya te realizaste los estudios preocupacionales, te pedimos que aguardes ya que te citaremos por este medio.`,
  { capture: true },
  async (ctx, { flowDynamic, gotoFlow }) => {
    if (await handleExit(ctx, gotoFlow)) return;
  }
);

const salirFlow = addKeyword(["salir"]).addAnswer(
  `Escribe de vuelta un saludo para volver al principio 😁`
);

const main = async () => {
  const adapterFlow = createFlow([
    inicioFlow,
    bienvenidaFlow,
    assistanceFlow,
    obrasSocialesFlow,
    cuentaBancariaFlow,
    licenciasFlow,
    sueldoFlow,
    certificadosFlow,
    vacacionesFlow,
    beneficiosFlow,
    documentacionFlow,
    otrasConsultasFlow,
    CvFlow,
    EstudiosFlow,
    businessUnitFlow,
  ]);

  const adapterProvider = createProvider(Provider);

  const adapterDB = new Database({ filename: "db.json" });

  const { handleCtx, httpServer } = await createBot({
    flow: adapterFlow,
    provider: adapterProvider,
    database: adapterDB,
  });

  adapterProvider.server.post(
    "/v1/messages",
    handleCtx(async (bot, req, res) => {
      const { number, message, urlMedia } = req.body;
      await bot.sendMessage(number, message, { media: urlMedia ?? null });
      return res.end("sended");
    })
  );

  adapterProvider.server.post(
    "/v1/register",
    handleCtx(async (bot, req, res) => {
      const { number, name } = req.body;
      await bot.dispatch("REGISTER_FLOW", { from: number, name });
      return res.end("trigger");
    })
  );

  adapterProvider.server.post(
    "/v1/samples",
    handleCtx(async (bot, req, res) => {
      const { number, name } = req.body;
      await bot.dispatch("SAMPLES", { from: number, name });
      return res.end("trigger");
    })
  );

  adapterProvider.server.post(
    "/v1/blacklist",
    handleCtx(async (bot, req, res) => {
      const { number, intent } = req.body;
      if (intent === "remove") bot.blacklist.remove(number);
      if (intent === "add") bot.blacklist.add(number);

      res.writeHead(200, { "Content-Type": "application/json" });
      return res.end(JSON.stringify({ status: "ok", number, intent }));
    })
  );

  httpServer(+PORT);
};

main();
