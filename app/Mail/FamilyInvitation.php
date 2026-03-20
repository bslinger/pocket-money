<?php

namespace App\Mail;

use App\Models\Family;
use App\Models\Invitation;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class FamilyInvitation extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public readonly Invitation $invitation,
        public readonly string $inviterName,
    ) {}

    public function envelope(): Envelope
    {
        /** @var Family $family */
        $family = $this->invitation->family;
        return new Envelope(
            subject: "{$this->inviterName} invited you to join {$family->name} on Pocket Money",
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.family-invitation',
        );
    }

    public function attachments(): array
    {
        return [];
    }
}
