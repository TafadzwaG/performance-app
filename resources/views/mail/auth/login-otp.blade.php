<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{ $companyName }} — Sign-in code</title>
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
                        <td style="padding:40px 36px;text-align:center;">
                            <div style="font-size:10px;letter-spacing:0.22em;text-transform:uppercase;color:#8A8268;font-weight:bold;margin-bottom:10px;">
                                Sign-in verification
                            </div>
                            <h1 style="margin:0 0 12px 0;font-size:26px;font-weight:normal;color:#252627;">
                                Your one-time code
                            </h1>
                            <p style="margin:0 auto 24px auto;max-width:420px;font-size:14px;line-height:1.6;color:#5F5A4A;">
                                Hello {{ explode(' ', trim($user->name))[0] }}, use this code to finish signing in to {{ $companyName }}.
                                It expires in {{ $expiresInMinutes }} minutes.
                            </p>
                            <div style="display:inline-block;padding:18px 32px;background:#fbf9f0;border:1px solid #ece4cf;border-radius:10px;font-size:32px;letter-spacing:0.35em;font-weight:bold;color:#2F4A3F;">
                                {{ $code }}
                            </div>
                            <p style="margin:24px auto 0 auto;max-width:420px;font-size:12px;line-height:1.6;color:#8A8268;">
                                If you did not try to sign in, you can ignore this email. Do not share this code with anyone.
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
