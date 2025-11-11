import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, message } = body;

    // Validação básica no servidor
    if (!name || !email || !message) {
      return NextResponse.json(
        { error: "Todos os campos são obrigatórios" },
        { status: 400 }
      );
    }

    // Validação de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Email inválido" },
        { status: 400 }
      );
    }

    // Validação de tamanho mínimo
    if (name.trim().length < 2) {
      return NextResponse.json(
        { error: "O nome deve ter pelo menos 2 caracteres" },
        { status: 400 }
      );
    }

    if (message.trim().length < 10) {
      return NextResponse.json(
        { error: "A mensagem deve ter pelo menos 10 caracteres" },
        { status: 400 }
      );
    }

    // Aqui você pode integrar com um serviço de email como:
    // - Resend
    // - SendGrid
    // - Nodemailer
    // - AWS SES
    // Por enquanto, apenas logamos os dados
    console.log("Nova mensagem de contato:", {
      name,
      email,
      message,
      timestamp: new Date().toISOString(),
    });

    // Simulação de envio de email
    // Em produção, substitua por uma chamada real ao serviço de email
    await new Promise((resolve) => setTimeout(resolve, 1000));

    return NextResponse.json(
      { success: true, message: "Mensagem enviada com sucesso!" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Erro ao processar formulário de contato:", error);
    return NextResponse.json(
      { error: "Erro ao processar a mensagem. Tente novamente mais tarde." },
      { status: 500 }
    );
  }
}



