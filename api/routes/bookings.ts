import { NextRequest, NextResponse } from 'next/server';
import { BookingService } from '../services/booking.service';
import { GeoService } from '../services/geo.service';
import { EmailService } from '../services/email.service';

/**
 * POST /api/bookings
 * Create a new booking
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      userId,
      serviceId,
      serviceDate,
      serviceTime,
      country,
      totalAmount,
      currency,
      notes,
    } = body;

    // Validate required fields
    if (
      !userId ||
      !serviceId ||
      !serviceDate ||
      !serviceTime ||
      !country ||
      totalAmount === undefined
    ) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Create booking
    const booking = await BookingService.createBooking({
      userId,
      serviceId,
      serviceDate,
      serviceTime,
      country,
      totalAmount,
      currency,
      notes,
      status: 'pending',
    });

    // Send confirmation email
    try {
      await EmailService.sendBookingConfirmation(userId, {
        service: serviceId,
        date: serviceDate,
        time: serviceTime,
        currency,
        amount: totalAmount,
        bookingId: booking.id,
      });
    } catch (emailError) {
      console.error('Failed to send confirmation email:', emailError);
      // Don't fail the request if email fails
    }

    return NextResponse.json(booking, { status: 201 });
  } catch (error: any) {
    console.error('Booking creation error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create booking' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/bookings?userId=xxx
 * Get user's bookings
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId');
    const bookingId = searchParams.get('id');

    if (bookingId) {
      const booking = await BookingService.getBooking(bookingId);
      return NextResponse.json(booking);
    }

    if (!userId) {
      return NextResponse.json(
        { error: 'Missing userId parameter' },
        { status: 400 }
      );
    }

    const bookings = await BookingService.getUserBookings(userId);
    return NextResponse.json(bookings);
  } catch (error: any) {
    console.error('Booking retrieval error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to retrieve bookings' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/bookings
 * Update booking
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { bookingId, status, notes } = body;

    if (!bookingId) {
      return NextResponse.json(
        { error: 'Missing bookingId' },
        { status: 400 }
      );
    }

    if (status) {
      const updated = await BookingService.updateBookingStatus(
        bookingId,
        status
      );
      return NextResponse.json(updated);
    }

    return NextResponse.json(
      { error: 'No update fields provided' },
      { status: 400 }
    );
  } catch (error: any) {
    console.error('Booking update error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update booking' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/bookings?bookingId=xxx
 * Cancel booking
 */
export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const bookingId = searchParams.get('bookingId');
    const reason = searchParams.get('reason');

    if (!bookingId) {
      return NextResponse.json(
        { error: 'Missing bookingId parameter' },
        { status: 400 }
      );
    }

    const cancelled = await BookingService.cancelBooking(bookingId, reason || undefined);
    return NextResponse.json(cancelled);
  } catch (error: any) {
    console.error('Booking cancellation error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to cancel booking' },
      { status: 500 }
    );
  }
}
