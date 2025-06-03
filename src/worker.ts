import { EmailOptions, WorkerMailer } from 'worker-mailer';
import { emailOptionsSchema } from './z-valid';
import { otpTemplate } from './template/otp';

export interface Env {
  // Thêm các khai báo biến môi trường của bạn vào đây
  // Ví dụ: SENDGRID_API_KEY: string;
  // Ví dụ: MY_KV: KVNamespace;
  USERNAME: string;
  PASSWORD: string;
}
export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    if (request.method !== 'POST') {
      return new Response('Bad request', { status: 405 })
    }
    try {
      const body = await request.json()
      const email = emailOptionsSchema.parse(body) as EmailOptions; 
      if(request.url.includes('otp')){
        const otpMail = otpTemplate(email)
        Object.assign(email, otpMail)
      }
      const mailer = await WorkerMailer.connect({
        credentials: {
          username: env.USERNAME,
          password: env.PASSWORD,
        },
        authType: ['plain', 'login'],
        host: 'smtp.gmail.com',
        port: 587,
      })
      await mailer.send({
        ...email,
        from: env.USERNAME
      })
      await mailer.close()

      return new Response('Email sent successfully', { status: 200,
         headers: {
          'Content-Type': 'application/json',
          'X-Powered-By': 'cloudflare-worker',
        },
       })
    } catch (error) {
      if (error instanceof Error) {
        return new Response(`Error: ${error.message}`, { status: 400 })
      }
      return new Response(`Internal server error`, { status: 500 })
    }
  },
} 