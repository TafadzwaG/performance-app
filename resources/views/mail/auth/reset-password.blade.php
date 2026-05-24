<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{ $companyName }} — Reset password</title>
</head>
<body style="margin:0;padding:0;background-color:#f6f1e6;font-family:Helvetica,Arial,sans-serif;color:#252627;">
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color:#f6f1e6;padding:32px 12px;">
        <tr>
            <td align="center">
                <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="max-width:600px;background-color:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #ece4cf;">
                    <tr>
                        <td style="background:linear-gradient(135deg,#252627 0%,#1d1e1f 100%);padding:28px 32px;">
                            @if($logoUrl)
                                <img src="{{ $logoUrl }}" alt="{{ $companyName }}" height="34" style="display:block;max-height:34px;border:0;">
                            @else
                                <div style="font-size:18px;font-weight:bold;color:#ffffff;">{{ $companyName }}</div>
                            @endif
                        </td>
                    </tr>
                    <tr>
                        <td style="padding:40px 36px;">
                            <div style="font-size:10px;letter-spacing:0.22em;text-transform:uppercase;color:#8A8268;font-weight:bold;margin-bottom:10px;">
                                Account recovery
                            </div>
                            <h1 style="margin:0 0 12px 0;font-size:26px;font-weight:normal;color:#252627;">
                                Reset your password
                            </h1>
                            <p style="margin:0 0 24px 0;font-size:14px;line-height:1.6;color:#5F5A4A;">
                                Hello {{ explode(' ', trim($user->name))[0] }}, we received a request to reset the password for your {{ $companyName }} account.
                                Click the button below to choose a new password. This link expires in {{ $expireMinutes }} minutes.
                            </p>
                            <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin:0 auto 24px auto;">
                                <tr>
                                    <td style="border-radius:8px;background:#2F4A3F;">
                                        <a href="{{ $resetUrl }}" style="display:inline-block;padding:14px 28px;font-size:14px;font-weight:bold;color:#ffffff;text-decoration:none;">
                                            Reset password
                                        </a>
                                    </td>
                                </tr>
                            </table>
                            <p style="margin:0 0 12px 0;font-size:12px;line-height:1.6;color:#8A8268;">
                                If the button does not work, copy and paste this link into your browser:
                            </p>
                            <p style="margin:0 0 24px 0;font-size:12px;line-height:1.6;word-break:break-all;color:#5F5A4A;">
                                {{ $resetUrl }}
                            </p>
                            <p style="margin:0;font-size:12px;line-height:1.6;color:#8A8268;">
                                If you did not request a password reset, you can safely ignore this email. Your password will not change.
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
