/**
 * FICHIER: email-verification.template.ts
 *
 * DESCRIPTION:
 * Template HTML pour l'email de vérification d'adresse email.
 * Design responsive et simple avec branding SecondLife Exchange.
 */

export function getEmailVerificationTemplate(
  verificationUrl: string,
  displayName: string,
): string {
  return `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Vérifiez votre adresse email - SecondLife Exchange</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
  <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #f5f5f5;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" style="max-width: 600px; width: 100%; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="padding: 40px 40px 20px; text-align: center; background: linear-gradient(135deg, #2d5a45 0%, #1a3d2e 100%); border-radius: 8px 8px 0 0;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 600;">SecondLife Exchange</h1>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              <h2 style="margin: 0 0 20px; color: #1a1a1a; font-size: 24px; font-weight: 600;">Bonjour ${displayName} 👋</h2>

              <p style="margin: 0 0 20px; color: #4a4a4a; font-size: 16px; line-height: 1.6;">
                Merci de vous être inscrit sur <strong>SecondLife Exchange</strong> !
              </p>

              <p style="margin: 0 0 30px; color: #4a4a4a; font-size: 16px; line-height: 1.6;">
                Pour finaliser votre inscription et commencer à échanger des objets, veuillez vérifier votre adresse email en cliquant sur le bouton ci-dessous :
              </p>

              <!-- CTA Button -->
              <table role="presentation" style="width: 100%; margin: 30px 0;">
                <tr>
                  <td align="center">
                    <a href="${verificationUrl}" style="display: inline-block; padding: 16px 32px; background-color: #2d5a45; color: #ffffff; text-decoration: none; border-radius: 6px; font-size: 16px; font-weight: 600; text-align: center;">
                      Vérifier mon email
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin: 30px 0 0; color: #6a6a6a; font-size: 14px; line-height: 1.6;">
                Si le bouton ne fonctionne pas, copiez et collez ce lien dans votre navigateur :<br>
                <a href="${verificationUrl}" style="color: #2d5a45; word-break: break-all;">${verificationUrl}</a>
              </p>

              <hr style="margin: 30px 0; border: none; border-top: 1px solid #e0e0e0;">

              <p style="margin: 0; color: #6a6a6a; font-size: 14px; line-height: 1.6;">
                <strong>⏰ Ce lien expire dans 24 heures.</strong><br>
                Si vous n'avez pas créé de compte, vous pouvez ignorer cet email.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 30px 40px; background-color: #f9f9f9; border-radius: 0 0 8px 8px; text-align: center;">
              <p style="margin: 0 0 10px; color: #6a6a6a; font-size: 14px;">
                <strong>SecondLife Exchange</strong><br>
                Donnez une seconde vie à vos objets
              </p>
              <p style="margin: 0; color: #9a9a9a; font-size: 12px;">
                Cet email a été envoyé automatiquement, merci de ne pas y répondre.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}
