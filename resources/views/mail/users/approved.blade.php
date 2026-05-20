<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{ $companyName }} — Account approved</title>
</head>
<body style="margin:0;padding:0;background-color:#f6f1e6;font-family:Helvetica,Arial,sans-serif;color:#252627;">
    {{-- Pre-header --}}
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;font-size:1px;color:#f6f1e6;">
        Good news, {{ $user->name }} — your {{ $companyName }} account is now approved and ready.
    </div>

    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color:#f6f1e6;padding:32px 12px;">
        <tr>
            <td align="center">
                <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="max-width:600px;background-color:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #ece4cf;">
                    {{-- ===================================================== HEADER --}}
                    <tr>
                        <td style="background:linear-gradient(135deg,#252627 0%,#1d1e1f 100%);padding:28px 32px;">
                            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                                <tr>
                                    <td style="vertical-align:middle;">
                                        @if($logoUrl)
                                            <img src="{{ $logoUrl }}" alt="{{ $companyName }}" height="34" style="display:block;max-height:34px;border:0;">
                                        @else
                                            <div style="font-size:18px;font-weight:bold;color:#ffffff;letter-spacing:-0.01em;">{{ $companyName }}</div>
                                        @endif
                                    </td>
                                    <td align="right" style="vertical-align:middle;">
                                        <div style="font-size:10px;letter-spacing:0.22em;text-transform:uppercase;color:#BFB48F;font-weight:bold;">
                                            § Welcome
                                        </div>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>

                    {{-- ===================================================== HERO --}}
                    <tr>
                        <td style="padding:40px 36px 12px 36px;text-align:center;">
                            <div style="display:inline-block;width:64px;height:64px;border-radius:50%;background:#f3eedd;border:1px solid #BFB48F;line-height:64px;margin-bottom:20px;">
                                <span style="font-size:30px;color:#2F4A3F;">✓</span>
                            </div>
                            <div style="font-size:10px;letter-spacing:0.22em;text-transform:uppercase;color:#8A8268;font-weight:bold;margin-bottom:10px;">
                                Your account is approved
                            </div>
                            <h1 style="margin:0 0 12px 0;font-size:30px;line-height:1.1;font-weight:normal;letter-spacing:-0.02em;color:#252627;">
                                Welcome to <span style="color:#2F4A3F;font-style:italic;">{{ $companyName }}</span>,<br>
                                {{ explode(' ', trim($user->name))[0] }}.
                            </h1>
                            <p style="margin:14px auto 0 auto;max-width:440px;font-size:14px;line-height:1.6;color:#5F5A4A;">
                                @if($approvedBy)
                                    {{ $approvedBy->name }} just approved your registration. You can now sign in and start
                                    using the platform.
                                @else
                                    Your registration has been approved. You can now sign in and start using the platform.
                                @endif
                            </p>
                        </td>
                    </tr>

                    {{-- ===================================================== ACCOUNT SUMMARY --}}
                    <tr>
                        <td style="padding:24px 36px;">
                            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color:#fbf9f0;border:1px solid #ece4cf;border-radius:10px;">
                                <tr>
                                    <td style="padding:18px 22px;">
                                        <div style="font-size:9.5px;letter-spacing:0.22em;text-transform:uppercase;color:#8A8268;font-weight:bold;margin-bottom:14px;">
                                            § Your account
                                        </div>
                                        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="font-size:13px;">
                                            <tr>
                                                <td style="width:130px;padding:5px 0;color:#8A8268;font-size:10px;letter-spacing:0.18em;text-transform:uppercase;font-weight:bold;">Name</td>
                                                <td style="padding:5px 0;color:#252627;">{{ $user->name }}</td>
                                            </tr>
                                            <tr>
                                                <td style="padding:5px 0;color:#8A8268;font-size:10px;letter-spacing:0.18em;text-transform:uppercase;font-weight:bold;">Email</td>
                                                <td style="padding:5px 0;color:#252627;">{{ $user->email }}</td>
                                            </tr>
                                            @if(!empty($roles))
                                                <tr>
                                                    <td style="padding:5px 0;color:#8A8268;font-size:10px;letter-spacing:0.18em;text-transform:uppercase;font-weight:bold;vertical-align:top;">Roles</td>
                                                    <td style="padding:5px 0;color:#252627;">
                                                        @foreach($roles as $role)
                                                            <span style="display:inline-block;padding:2px 9px;margin:1px 4px 1px 0;border:1px solid #BFB48F;background:#f3eedd;border-radius:999px;font-size:11px;font-weight:bold;color:#252627;letter-spacing:0.04em;">{{ $role }}</span>
                                                        @endforeach
                                                    </td>
                                                </tr>
                                            @endif
                                            <tr>
                                                <td style="padding:5px 0;color:#8A8268;font-size:10px;letter-spacing:0.18em;text-transform:uppercase;font-weight:bold;">Approved</td>
                                                <td style="padding:5px 0;color:#252627;">{{ optional($approvedAt)->format('d M Y · H:i') }}</td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>

                    {{-- ===================================================== CTA --}}
                    <tr>
                        <td style="padding:8px 36px 28px 36px;text-align:center;">
                            <table role="presentation" cellspacing="0" cellpadding="0" border="0" align="center">
                                <tr>
                                    <td style="background-color:#252627;border-radius:8px;">
                                        <a href="{{ $loginUrl }}" style="display:inline-block;padding:14px 28px;font-size:13px;font-weight:bold;letter-spacing:0.04em;color:#ffffff;text-decoration:none;">
                                            Sign in to your workspace &nbsp;→
                                        </a>
                                    </td>
                                </tr>
                            </table>
                            <p style="margin:18px 0 0 0;font-size:12px;color:#8A8268;">
                                Use the email on this account and the password you set during registration.
                            </p>
                        </td>
                    </tr>

                    {{-- ===================================================== NEXT STEPS --}}
                    <tr>
                        <td style="padding:0 36px 28px 36px;">
                            <div style="border-top:1px solid #ece4cf;padding-top:22px;">
                                <div style="font-size:9.5px;letter-spacing:0.22em;text-transform:uppercase;color:#8A8268;font-weight:bold;margin-bottom:14px;">
                                    § What's next
                                </div>
                                <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="font-size:13px;color:#252627;">
                                    <tr>
                                        <td style="padding:6px 0;width:24px;color:#BFB48F;font-weight:bold;">01</td>
                                        <td style="padding:6px 0;line-height:1.55;">
                                            <strong>Complete your profile</strong> — fill in your role, department, and reporting line so reviews route correctly.
                                        </td>
                                    </tr>
                                    <tr>
                                        <td style="padding:6px 0;color:#BFB48F;font-weight:bold;">02</td>
                                        <td style="padding:6px 0;line-height:1.55;">
                                            <strong>Set your goals</strong> for the current review cycle — your manager will help calibrate weights.
                                        </td>
                                    </tr>
                                    <tr>
                                        <td style="padding:6px 0;color:#BFB48F;font-weight:bold;">03</td>
                                        <td style="padding:6px 0;line-height:1.55;">
                                            <strong>Capture evidence as you go</strong> — small notes through the cycle make self-assessment painless.
                                        </td>
                                    </tr>
                                </table>
                            </div>
                        </td>
                    </tr>

                    {{-- ===================================================== FOOTER --}}
                    <tr>
                        <td style="background-color:#252627;padding:18px 36px;">
                            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                                <tr>
                                    <td style="font-size:10px;letter-spacing:0.18em;text-transform:uppercase;color:#BFB48F;">
                                        {{ $companyName }}
                                    </td>
                                    <td align="right" style="font-size:10px;color:rgba(255,255,255,0.55);">
                                        Sent automatically · do not reply
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                </table>

                <div style="margin-top:14px;font-size:11px;color:#8A8268;">
                    © {{ now()->year }} {{ $companyName }} · Performance Appraisal Studio
                </div>
            </td>
        </tr>
    </table>
</body>
</html>
