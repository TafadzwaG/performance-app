<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{ $companyName }} — Signup pending approval</title>
</head>
<body style="margin:0;padding:0;background-color:#f6f1e6;font-family:Helvetica,Arial,sans-serif;color:#252627;">
    {{-- Pre-header (hidden but used by inbox previews) --}}
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;font-size:1px;color:#f6f1e6;">
        {{ $applicant->name }} just submitted a registration request and is waiting on your decision.
    </div>

    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color:#f6f1e6;padding:32px 12px;">
        <tr>
            <td align="center">
                <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="max-width:600px;background-color:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #ece4cf;">
                    {{-- ===================================================== HEADER --}}
                    <tr>
                        <td style="background-color:#252627;padding:28px 32px;">
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
                                            § Pending review
                                        </div>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>

                    {{-- ===================================================== HERO --}}
                    <tr>
                        <td style="padding:36px 36px 12px 36px;">
                            <div style="font-size:10px;letter-spacing:0.22em;text-transform:uppercase;color:#8A8268;font-weight:bold;margin-bottom:10px;">
                                <span style="display:inline-block;width:24px;height:1px;background:#BFB48F;vertical-align:middle;margin-right:8px;"></span>
                                New signup awaiting approval
                            </div>
                            <h1 style="margin:0 0 8px 0;font-size:28px;line-height:1.15;font-weight:normal;letter-spacing:-0.02em;color:#252627;">
                                {{ $applicant->name }} <span style="color:#2F4A3F;font-style:italic;">is waiting</span> to join.
                            </h1>
                            <p style="margin:0;font-size:14px;line-height:1.55;color:#5F5A4A;">
                                A new user just submitted a registration request. Their account is currently locked and they
                                can't sign in until a Super Admin reviews and approves it.
                            </p>
                        </td>
                    </tr>

                    {{-- ===================================================== DETAILS --}}
                    <tr>
                        <td style="padding:20px 36px;">
                            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color:#fbf9f0;border:1px solid #ece4cf;border-radius:10px;">
                                <tr>
                                    <td style="padding:18px 22px;">
                                        <div style="font-size:9.5px;letter-spacing:0.22em;text-transform:uppercase;color:#8A8268;font-weight:bold;margin-bottom:14px;">
                                            § Applicant details
                                        </div>
                                        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="font-size:13px;">
                                            <tr>
                                                <td style="width:130px;padding:5px 0;color:#8A8268;font-size:10px;letter-spacing:0.18em;text-transform:uppercase;font-weight:bold;">Full name</td>
                                                <td style="padding:5px 0;color:#252627;">{{ $applicant->name }}</td>
                                            </tr>
                                            <tr>
                                                <td style="padding:5px 0;color:#8A8268;font-size:10px;letter-spacing:0.18em;text-transform:uppercase;font-weight:bold;">Email</td>
                                                <td style="padding:5px 0;color:#252627;"><a href="mailto:{{ $applicant->email }}" style="color:#2F4A3F;text-decoration:none;">{{ $applicant->email }}</a></td>
                                            </tr>
                                            <tr>
                                                <td style="padding:5px 0;color:#8A8268;font-size:10px;letter-spacing:0.18em;text-transform:uppercase;font-weight:bold;">Submitted</td>
                                                <td style="padding:5px 0;color:#252627;">{{ optional($submittedAt)->format('d M Y · H:i') ?? now()->format('d M Y · H:i') }}</td>
                                            </tr>
                                            <tr>
                                                <td style="padding:5px 0;color:#8A8268;font-size:10px;letter-spacing:0.18em;text-transform:uppercase;font-weight:bold;">Status</td>
                                                <td style="padding:5px 0;">
                                                    <span style="display:inline-block;padding:2px 10px;border:1px solid #BFB48F;background:#f3eedd;border-radius:999px;font-size:11px;font-weight:bold;color:#252627;letter-spacing:0.04em;">
                                                        Awaiting approval
                                                    </span>
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>

                    {{-- ===================================================== CTA --}}
                    <tr>
                        <td style="padding:8px 36px 20px 36px;">
                            <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                                <tr>
                                    <td style="background-color:#252627;border-radius:8px;">
                                        <a href="{{ $approvalUrl }}" style="display:inline-block;padding:12px 22px;font-size:13px;font-weight:bold;letter-spacing:0.04em;color:#ffffff;text-decoration:none;">
                                            Open the approval queue &nbsp;→
                                        </a>
                                    </td>
                                </tr>
                            </table>
                            <p style="margin:14px 0 0 0;font-size:12px;color:#8A8268;">
                                Reviewing this request only takes a moment — pick the right role and approve, or reject if
                                it's not a fit.
                            </p>
                        </td>
                    </tr>

                    {{-- ===================================================== NOTE --}}
                    <tr>
                        <td style="padding:0 36px 28px 36px;">
                            <div style="border-top:1px solid #ece4cf;padding-top:18px;font-size:12px;color:#5F5A4A;line-height:1.55;">
                                <strong style="color:#252627;">FYI: </strong>
                                {{ $applicant->name }} is CC'd on this email so they know their request reached you. They'll
                                receive a separate confirmation once you approve.
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
