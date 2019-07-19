# @suddenly/mailer

A simple templated email sender powered by SendGrid.

## Usage

First up, you'll need a [SendGrid API Key](https://app.sendgrid.com/settings/api_keys).

Then you can use it like this:

```js
import Mailer from '../lib/mailer';

Mailer.initialize({
  sendGridAPIKey: process.env.SENDGRID_API_KEY,
  defaultFromAddress: 'no-reply@your-domain.com',
  templatePath: 'src/server/notifications'
});

// Any other method called on the Mailer will be treated as an email.
// The name of the method will be used as the template name.
// eg. This will look in the `templatePath` directory for files named `requestSignIn.html.ejs` and `requestSignIn.text.ejs`
Mailer.requestSignIn('someone@test.com', 'Subject', {
  someTemplateVariable: 'some value',
  anotherTemplateVariable: 'some other value'
});
```

## Contributors

- Nathan Hoad - [nathan@nathanhoad.net](mailto:nathan@nathanhoad.net)
