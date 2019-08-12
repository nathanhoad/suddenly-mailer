import Mailer from '.';

describe('When not configured', () => {
  it('fails to initialize', () => {
    expect(() => {
      Mailer.initialize({
        templatePath: 'src/templates',
        defaultFromAddress: 'no-reply@test.com'
      });
    }).toThrow();
  });
});

describe('When configured', () => {
  beforeAll(() => {
    Mailer.initialize({
      sendGridAPIKey: 'testing',
      templatePath: 'src/templates',
      defaultFromAddress: 'no-reply@test.com'
    });
  });

  describe('Sending messages', () => {
    it('can send a message', async () => {
      const message = await Mailer.send('test', 'test@test.com', 'Test subject', { adjective: 'great' });

      expect(message).toContain('to: test@test.com');
      expect(message).toContain('from: no-reply@test.com');
      expect(message).toContain('subject: Test subject');
      expect(message).toContain('<p>This is a great html test.</p>');
      expect(message).toContain('This is a great text test.');
    });
  });

  describe('Templates', () => {
    it('can render HTML', async () => {
      const message = await Mailer.test('test@test.com', 'Test subject', { adjective: 'great' });
      expect(message).toContain('great html test');
    });

    it('can render Text', async () => {
      const message = await Mailer.test('test@test.com', 'Test subject', { adjective: 'great' });
      expect(message).toContain('great text test');
    });
  });
});
