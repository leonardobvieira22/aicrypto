import { type NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/config/database';
import crypto from 'node:crypto';

// Definir tipos de EmailStatus localmente (baseado no schema Prisma)
type EmailStatus = 'PENDING' | 'SENT' | 'FAILED' | 'DELIVERED' | 'OPENED' | 'CLICKED' | 'BOUNCED' | 'SPAM' | 'BLOCKED';

const EmailStatus = {
  PENDING: 'PENDING' as const,
  SENT: 'SENT' as const,
  FAILED: 'FAILED' as const,
  DELIVERED: 'DELIVERED' as const,
  OPENED: 'OPENED' as const,
  CLICKED: 'CLICKED' as const,
  BOUNCED: 'BOUNCED' as const,
  SPAM: 'SPAM' as const,
  BLOCKED: 'BLOCKED' as const
};

// MailerSend webhook secret - deve ser configurado no painel do MailerSend
// Você deve copiar esta chave no painel do MailerSend ao configurar o webhook
const WEBHOOK_SECRET = process.env.MAILERSEND_WEBHOOK_SECRET || 'your-webhook-secret';

// Função para verificar a assinatura do webhook
function verifyWebhookSignature(payload: string, signature: string): boolean {
  if (!WEBHOOK_SECRET) return false;

  try {
    const expectedSignature = crypto
      .createHmac('sha256', WEBHOOK_SECRET)
      .update(payload)
      .digest('hex');

    return crypto.timingSafeEqual(
      Buffer.from(expectedSignature),
      Buffer.from(signature)
    );
  } catch (error) {
    console.error('Erro ao verificar assinatura do webhook:', error);
    return false;
  }
}

export async function POST(req: NextRequest) {
  try {
    // Obter o corpo da requisição
    const payload = await req.text();

    // Obter a assinatura do webhook do cabeçalho
    const signature = req.headers.get('X-Mailersend-Signature') || '';

    // Verificar a assinatura se estiver em produção
    if (process.env.NODE_ENV === 'production' && !verifyWebhookSignature(payload, signature)) {
      console.error('Assinatura de webhook inválida');
      return NextResponse.json(
        { message: 'Assinatura de webhook inválida' },
        { status: 401 }
      );
    }

    // Processar o evento
    const event = JSON.parse(payload);
    console.log('Webhook recebido:', event.type);

    // Extrair dados relevantes
    const { type, data } = event;
    const messageId = data.message_id;

    if (!messageId) {
      console.error('MessageID não encontrado no webhook');
      return NextResponse.json(
        { message: 'MessageID não encontrado' },
        { status: 400 }
      );
    }

    // Mapear o tipo de evento para o status do email
    let emailStatus: EmailStatus | undefined;
    let statusDetails = '';

    switch (type) {
      case 'activity.sent':
        emailStatus = EmailStatus.SENT;
        break;
      case 'activity.delivered':
        emailStatus = EmailStatus.DELIVERED;
        break;
      case 'activity.soft_bounced':
      case 'activity.hard_bounced':
        emailStatus = EmailStatus.BOUNCED;
        statusDetails = `Tipo: ${type === 'activity.soft_bounced' ? 'Soft' : 'Hard'}, Razão: ${data.reason || 'Desconhecida'}`;
        break;
      case 'activity.opened':
        emailStatus = EmailStatus.OPENED;
        break;
      case 'activity.clicked':
        emailStatus = EmailStatus.CLICKED;
        statusDetails = `URL: ${data.url || 'N/A'}`;
        break;
      case 'activity.spam_complaint':
        emailStatus = EmailStatus.SPAM;
        break;
      case 'activity.unsubscribed':
        // Para eventos não suportados, apenas ignore
        emailStatus = undefined;
        break;
      default:
        // Para eventos não suportados, defina como undefined
        emailStatus = undefined;
    }

    // Atualizar o log do email no banco de dados
    // Precisamos encontrar o log pelo message_id, que deve ter sido armazenado nos statusDetails
    const logs = await prisma.emailLog.findMany({
      where: {
        statusDetails: {
          contains: messageId
        }
      }
    });

    if (logs.length === 0) {
      console.warn(`Log de email não encontrado para messageId: ${messageId}`);
      return NextResponse.json(
        { message: 'Log de email não encontrado' },
        { status: 404 }
      );
    }

    // Atualizar todos os logs encontrados com o messageId
    for (const log of logs) {
      if (emailStatus) {
        await prisma.emailLog.update({
          where: { id: log.id },
          data: {
            status: emailStatus,
            statusDetails: statusDetails || log.statusDetails,
            updatedAt: new Date()
          }
        });

        console.log(`Status do email atualizado: ${log.id} -> ${emailStatus}`);
      }
    }

    return NextResponse.json({ message: 'Webhook processado com sucesso' });
  } catch (error) {
    console.error('Erro ao processar webhook:', error);
    return NextResponse.json(
      { message: 'Erro ao processar webhook' },
      { status: 500 }
    );
  }
}
