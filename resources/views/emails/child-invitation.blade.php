<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Child Account Invitation</title>
</head>
<body style="font-family: sans-serif; max-width: 520px; margin: 40px auto; color: #111;">
    <h2>You've been invited to Quiddo!</h2>

    <p><strong>{{ $inviterName }}</strong> has invited you to view
        <strong>{{ $invitation->spender->name }}</strong>'s Quiddo account —
        a family finance app to track pocket money, chores, and savings goals.</p>

    <p style="margin: 24px 0;">
        <a href="{{ url('/child-invitations/' . $invitation->token . '/accept') }}"
           style="background:#6366f1; color:white; padding:12px 24px; border-radius:6px; text-decoration:none; font-weight:600;">
            Accept Invitation
        </a>
    </p>

    <p style="color:#6b7280; font-size:0.875rem;">
        This invitation expires in 7 days. If you don't have an account yet,
        you'll be asked to register first.
    </p>

    <hr style="border:none; border-top:1px solid #e5e7eb; margin: 24px 0;">
    <p style="color:#9ca3af; font-size:0.75rem;">Quiddo · You received this because {{ $invitation->email }} was invited.</p>
</body>
</html>
