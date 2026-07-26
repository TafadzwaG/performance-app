<?php

return [
    'authentication' => [
        // Per-account limits stop targeted attacks. The larger IP limits allow
        // legitimate offices, hotels, VPNs, and reverse proxies to share an IP.
        'login_per_account' => (int) env('AUTH_LOGIN_PER_ACCOUNT', 10),
        'login_per_ip' => (int) env('AUTH_LOGIN_PER_IP', 150),
        'mfa_verify_per_account' => (int) env('AUTH_MFA_VERIFY_PER_ACCOUNT', 10),
        'mfa_verify_per_ip' => (int) env('AUTH_MFA_VERIFY_PER_IP', 150),
        'mfa_resend_per_account' => (int) env('AUTH_MFA_RESEND_PER_ACCOUNT', 3),
        'mfa_resend_per_ip' => (int) env('AUTH_MFA_RESEND_PER_IP', 60),
        'password_per_account' => (int) env('AUTH_PASSWORD_PER_ACCOUNT', 5),
        'password_per_ip' => (int) env('AUTH_PASSWORD_PER_IP', 60),
        'verification_per_account' => (int) env('AUTH_VERIFICATION_PER_ACCOUNT', 6),
        'verification_per_ip' => (int) env('AUTH_VERIFICATION_PER_IP', 60),
    ],
];
