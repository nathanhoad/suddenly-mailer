import * as Path from 'path';
import * as FS from 'fs-extra';
import * as Mail from '@sendgrid/mail';
import * as guessRootPath from 'guess-root-path';
import * as EJS from 'ejs';

interface MailerConfig {
  sendGridAPIKey: string;
  defaultFromAddress: string;
  templatePath: string;
}

interface Dictionary<TValue> {
  [key: string]: TValue;
}

export class Mailer {
  [name: string]: any; // Any method is proxied to send

  fromAddress: string;
  templatePath: string;

  public initialize(config: MailerConfig) {
    Mail.setApiKey(config.sendGridAPIKey);
    this.templatePath = Path.join(guessRootPath(), config.templatePath);
    this.fromAddress = config.defaultFromAddress;
  }

  private async renderTemplate(format: string, template: string, templateLocals: Dictionary<any>): Promise<string> {
    let filename = Path.join(this.templatePath, template + '.' + format + '.ejs');
    if (!FS.existsSync(filename)) throw new Error(filename + ' does not exist');
    let t = await FS.readFile(filename, 'utf8');
    return EJS.render(t, templateLocals);
  }

  public async send(template: string, to: string, subject: string, templateLocals: Dictionary<any>): Promise<any> {
    const from = this.fromAddress;

    const html = await this.renderTemplate('html', template, templateLocals);
    const text = await this.renderTemplate('text', template, templateLocals);

    const message = { to, from, subject, html, text };

    if (process.env.NODE_ENV === 'test') return message;

    return Mail.send(message);
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
