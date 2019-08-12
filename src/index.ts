import * as Path from 'path';
import * as FS from 'fs-extra';
import * as SendGrid from '@sendgrid/mail';
import { createClient } from 'node-ses';
import * as guessRootPath from 'guess-root-path';
import * as EJS from 'ejs';

interface MailerConfig {
  sendGridAPIKey?: string;
  sesKey?: string;
  sesSecret?: string;
  defaultFromAddress: string;
  templatePath: string;
}

interface Dictionary<TValue> {
  [key: string]: TValue;
}

interface Message {
  to: string;
  from: string;
  subject: string;
  html: string;
  text: string;
}

interface Handler {
  send: (message: Message) => Promise<any>;
}

class SESHandler implements Handler {
  client: any;

  constructor(key: string, secret: string) {
    this.client = createClient({ key, secret });
  }

  /**
   * Send an email with SES
   * @param message
   */
  public send(message: Message) {
    return new Promise((resolve, reject) => {
      this.client.sendEmail(
        {
          to: message.to,
          from: message.from,
          subject: message.subject,
          message: message.html,
          altText: message.text
        },
        (err, data, response) => {
          if (err) return reject(err);

          return resolve();
        }
      );
    });
  }
}

class SendGridHandler implements Handler {
  constructor(apiKey: string) {
    SendGrid.setApiKey(apiKey);
  }

  /**
   * Send an email with SendGrid
   * @param message
   */
  public send(message: Message) {
    return SendGrid.send(message);
  }
}

export class Mailer {
  [name: string]: any; // Any method is proxied to send

  handler: Handler;

  fromAddress: string;
  templatePath: string;

  public initialize(config: MailerConfig) {
    if (config.sesKey && config.sesSecret) {
      this.handler = new SESHandler(config.sesKey, config.sesSecret);
    } else if (config.sendGridAPIKey) {
      this.handler = new SendGridHandler(config.sendGridAPIKey);
    } else {
      throw new Error('You need to specify either a SendGrid API key or AWS SES credentials');
    }
    this.templatePath = Path.join(guessRootPath(), config.templatePath);
    this.fromAddress = config.defaultFromAddress;
  }

  private async renderTemplate(format: string, template: string, templateLocals: Dictionary<any>): Promise<string> {
    let filename = Path.join(this.templatePath, template + '.' + format + '.ejs');
    if (!FS.existsSync(filename)) throw new Error(filename + ' does not exist');
    let t = await FS.readFile(filename, 'utf8');
    return EJS.render(t, templateLocals);
  }

  public async send(template: string, to: string, subject: string, templateLocals: Dictionary<any>): Promise<string> {
    const from = this.fromAddress;

    const html = await this.renderTemplate('html', template, templateLocals);
    const text = await this.renderTemplate('text', template, templateLocals);

    const message = { to, from, subject, html, text };

    const output = `to: ${message.to}\nfrom: ${message.from}\nsubject: ${
      message.subject
    }\n\n----\n\n${html}\n\n----\n\n${text}`;

    if (process.env.NODE_ENV === 'test') return output;

    return this.handler.send(message).then(() => {
      return output;
    });
  }
}

export default new Proxy(new Mailer(), {
  get(mailer: Mailer, method: string) {
    // It might be the initializer
    if (method in mailer) return mailer[method];

    // otherwise assume its an email
    const template = method;
    return (to, subject, templateLocals) => {
      return mailer.send(template, to, subject, templateLocals);
    };
  }
});
