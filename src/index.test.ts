import Mailer from '.';

Mailer.initialize({
  sendGridAPIKey: '',
  templatePath: 'src/templates',
  defaultFromAddress: 'no-reply@test.com'
});

describe('Sending messages', () => {
  it('can send a message', async () => {
    const message = await Mailer.send('test', 'test@test.com', 'Test subject', { format: 'html' });

    expect(message.to).toBe('test@test.com');
    expect(message.from).toBe('no-reply@test.com');
    expect(message.subject).toBe('Test subject');
  });
});

describe('Templates', () => {
  it('can render HTML', async () => {
    const message = await Mailer.test('test@test.com', 'Test subject', { format: 'html' });
    expect(message.html).toContain('html test');
  });

  it('can render Text', async () => {
    const message = await Mailer.test('test@test.com', 'Test subject', { format: 'text' });
    expect(message.text).toContain('text test');
  });
});
