<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Billing Transfer Request</title>
</head>
<body style="font-family: sans-serif; max-width: 520px; margin: 40px auto; color: #111;">
    <h2>Billing transfer request</h2>

    <p><strong>{{ $invitation->fromUser->display_name ?? $invitation->fromUser->name }}</strong>
        wants to transfer billing responsibility for
        <strong>{{ $invitation->family->name }}</strong> on Quiddo to you.</p>

    <p>If you accept, you'll become the billing owner for this family. You'll be responsible
        for the subscription payments going forward.</p>

    <p style="margin: 24px 0;">
        <a href="{{ url('/billing-transfers/' . $invitation->token . '/accept') }}"
           style="background:#2D6A4F; color:white; padding:12px 24px; border-radius:6px; text-decoration:none; font-weight:600;">
            Accept Billing Transfer
        </a>
    </p>

    <p style="color:#6b7280; font-size:0.875rem;">
        This request expires in 7 days. You must be logged in to accept.
    </p>

    <hr style="border:none; border-top:1px solid #e5e7eb; margin: 24px 0;">
    <p style="color:#9ca3af; font-size:0.75rem;">Quiddo · You received this because {{ $invitation->to_email }} was requested to take over billing.</p>
</body>
</html>
