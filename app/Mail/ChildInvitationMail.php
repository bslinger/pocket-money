<?php

namespace App\Mail;

use App\Models\ChildInvitation;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class ChildInvitationMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public readonly ChildInvitation $invitation,
        public readonly string $inviterName,
    ) {}

    public function envelope(): Envelope
    {
        /** @var \App\Models\Spender $spender */
        $spender = $this->invitation->spender;
        return new Envelope(
            subject: "{$this->inviterName} invited you to view {$spender->name}'s Quiddo account",
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.child-invitation',
        );
    }

    public function attachments(): array
    {
        return [];
    }
}
