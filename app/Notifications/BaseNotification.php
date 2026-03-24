<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Notification;
use NotificationChannels\Apn\ApnChannel;
use NotificationChannels\Apn\ApnMessage;
use NotificationChannels\Fcm\FcmChannel;
use NotificationChannels\Fcm\FcmMessage;
use NotificationChannels\Fcm\Resources\Notification as FcmNotification;

abstract class BaseNotification extends Notification implements ShouldQueue
{
    use Queueable;

    abstract protected function title(): string;

    abstract protected function body(): string;

    abstract protected function deepLink(): string;

    /** @return array<int, string> */
    public function via(mixed $notifiable): array
    {
        return [FcmChannel::class, ApnChannel::class];
    }

    public function toFcm(mixed $notifiable): FcmMessage
    {
        return FcmMessage::create()
            ->notification(
                FcmNotification::create()
                    ->title($this->title())
                    ->body($this->body())
            )
            ->data(['deep_link' => $this->deepLink()]);
    }

    public function toApn(mixed $notifiable): ApnMessage
    {
        return ApnMessage::create()
            ->title($this->title())
            ->body($this->body())
            ->sound('default')
            ->custom('deep_link', $this->deepLink());
    }
}
