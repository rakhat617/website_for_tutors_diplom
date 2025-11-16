from celery import shared_task
from django.core.mail import send_mail
from django.template.loader import render_to_string
from django.conf import settings
from datetime import timedelta
from django.utils import timezone
from lessons.models import Booking, Lesson

@shared_task
def send_booking_email(subject, template_name, context, recipient_list):
    """
    Универсальная задача для отправки email-уведомлений о заявках и уроках.
    context ожидает ключ 'booking_id', чтобы достать актуальные данные из базы.
    """
    try:
        booking_id = context.get("booking_id")
        booking = Booking.objects.select_related(
            "student", "timeslot__tutor", "subject"
        ).get(id=booking_id)
    except Booking.DoesNotExist:
        print(f"[send_booking_email] Booking с id={booking_id} не найден.")
        return

    # Подготовка контекста для шаблона письма
    context_data = {
        "student": booking.student,
        "tutor": booking.timeslot.tutor,
        "timeslot": booking.timeslot,
        "subject_name": booking.subject.name if booking.subject else "—",
        "status": booking.status,
    }

    # Рендерим тело письма
    message = render_to_string(template_name, context_data)

    # Отправляем письмо
    send_mail(
        subject=subject,
        message=message,
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient_list=recipient_list,
        fail_silently=False,
    )

    print(f"📨 Email отправлен → {recipient_list}: {subject}")

@shared_task
def send_upcoming_lesson_reminders():
    """
    Проверяет уроки, которые начнутся через ~1 час, и рассылает письма.
    """
    now = timezone.now()
    upcoming = Booking.objects.filter(
        status="accepted",
        timeslot__start_time__gte=now + timedelta(minutes=55),
        timeslot__start_time__lte=now + timedelta(minutes=65),
    ).select_related("student", "timeslot__tutor")

    for booking in upcoming:
        # Передаем только ID букинга
        send_booking_reminder_to_tutor.delay(booking.id)
        send_booking_reminder_to_student.delay(booking.id)


@shared_task
def send_booking_reminder_to_tutor(booking_id):
    """Отправляет напоминание репетитору"""
    from .models import Booking
    booking = Booking.objects.select_related("student", "timeslot__tutor", "subject").get(id=booking_id)
    ctx = {"booking": booking}
    send_booking_email(
        subject="Напоминание: урок через час",
        template_name="emails/hour_reminder_for_tutor.txt",
        context=ctx,
        recipient_list=[booking.timeslot.tutor.email],
    )


@shared_task
def send_booking_reminder_to_student(booking_id):
    """Отправляет напоминание студенту"""
    from .models import Booking
    booking = Booking.objects.select_related("student", "timeslot__tutor", "subject").get(id=booking_id)
    ctx = {"booking": booking}
    send_booking_email(
        subject="Напоминание: урок через час",
        template_name="emails/hour_reminder_for_student.txt",
        context=ctx,
        recipient_list=[booking.student.email],
    )


@shared_task
def auto_start_lessons():
    """
    Автоматически переводит уроки в статус 'in_progress',
    когда начинается время урока.
    """
    now = timezone.now()

    # Уроки, у которых ещё status = scheduled, но время уже наступило
    lessons_to_start = Lesson.objects.filter(
        status=Lesson.STATUS_SCHEDULED,
        booking__timeslot__start_time__lte=now
    )

    lessons_to_start.update(status=Lesson.STATUS_IN_PROGRESS)


@shared_task
def reject_expired_pending_bookings():
    now = timezone.now()
    expired_bookings = Booking.objects.filter(
        status="pending",
        timeslot__start_time__lt=now
    )

    count = expired_bookings.update(status="rejected")
    return f"{count} заявок автоматически отклонено"
