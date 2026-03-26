<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Too Many Requests — {{ config('app.name') }}</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Fraunces:wght@600&family=DM+Sans:wght@400&display=swap" rel="stylesheet">
    <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #F5F0E8; font-family: 'DM Sans', sans-serif; display: flex; align-items: center; justify-content: center; min-height: 100vh; padding: 24px; }
        .card { background: #fff; border: 1px solid #E8DFD0; border-radius: 12px; padding: 40px 32px; max-width: 380px; width: 100%; text-align: center; }
        h1 { font-family: 'Fraunces', serif; color: #4A7C59; font-size: 32px; margin-bottom: 8px; }
        p { color: #8C7A60; font-size: 15px; line-height: 1.5; margin-bottom: 24px; }
        a { display: inline-block; background: #4A7C59; color: #fff; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-size: 15px; }
    </style>
</head>
<body>
    <div class="card">
        <h1>{{ config('app.name') }}</h1>
        <p>Too many attempts. Please wait a moment and try again.</p>
        <a href="{{ route('login') }}">Back to login</a>
    </div>
</body>
</html>
