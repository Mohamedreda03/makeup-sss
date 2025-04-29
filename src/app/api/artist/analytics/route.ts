import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { AppointmentStatus } from "@/generated/prisma";

export async function GET(req: NextRequest) {
  try {
    // Verify user is authenticated and is an artist
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized. You must be signed in." },
        { status: 401 }
      );
    }

    const user = await db.user.findUnique({
      where: { id: session.user.id },
    });

    if (!user || user.role !== "ARTIST") {
      return NextResponse.json(
        { error: "Unauthorized. Only artists can access this data." },
        { status: 403 }
      );
    }

    // Get query parameters for date range
    const url = new URL(req.url);
    const startDateParam = url.searchParams.get("startDate");
    const endDateParam = url.searchParams.get("endDate");

    const startDate = startDateParam
      ? new Date(startDateParam)
      : new Date(new Date().setMonth(new Date().getMonth() - 6));
    const endDate = endDateParam ? new Date(endDateParam) : new Date();

    // Ensure valid date range
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return NextResponse.json(
        { error: "Invalid date range provided." },
        { status: 400 }
      );
    }

    // Get all appointments for this artist
    const appointments = await db.appointment.findMany({
      where: {
        artistId: user.id,
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        artist: true,
        user: true,
      },
      orderBy: {
        datetime: "asc",
      },
    });

    // Get all appointments for revenue calculation (including those outside the date range)
    const allAppointments = await db.appointment.findMany({
      where: {
        artistId: user.id,
        status: AppointmentStatus.COMPLETED,
      },
    });

    // Calculate current month metrics
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    const previousMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const previousMonthYear =
      currentMonth === 0 ? currentYear - 1 : currentYear;

    const currentMonthAppointments = appointments.filter(
      (app: (typeof appointments)[0]) =>
        new Date(app.datetime).getMonth() === currentMonth &&
        new Date(app.datetime).getFullYear() === currentYear &&
        app.status === AppointmentStatus.COMPLETED
    );

    const previousMonthAppointments = appointments.filter(
      (app: (typeof appointments)[0]) =>
        new Date(app.datetime).getMonth() === previousMonth &&
        new Date(app.datetime).getFullYear() === previousMonthYear &&
        app.status === AppointmentStatus.COMPLETED
    );

    // Calculate revenue metrics
    const currentMonthRevenue = currentMonthAppointments.reduce(
      (sum: number, app: (typeof appointments)[0]) => sum + app.totalPrice,
      0
    );

    const previousMonthRevenue = previousMonthAppointments.reduce(
      (sum: number, app: (typeof appointments)[0]) => sum + app.totalPrice,
      0
    );

    const totalRevenue = allAppointments.reduce(
      (sum: number, app) => sum + app.totalPrice,
      0
    );

    // Count unique clients
    const uniqueClientIds = new Set(
      appointments.map((app: (typeof appointments)[0]) => app.userId)
    );
    const totalClients = uniqueClientIds.size;

    // New clients this month
    const currentMonthClientIds = new Set(
      appointments
        .filter(
          (app: (typeof appointments)[0]) =>
            new Date(app.createdAt).getMonth() === currentMonth &&
            new Date(app.createdAt).getFullYear() === currentYear
        )
        .map((app: (typeof appointments)[0]) => app.userId)
    );
    const newClientsThisMonth = currentMonthClientIds.size;

    // Calculate appointment statistics
    const appointmentStats = {
      total: appointments.length,
      completed: appointments.filter(
        (app: (typeof appointments)[0]) =>
          app.status === AppointmentStatus.COMPLETED
      ).length,
      confirmed: appointments.filter(
        (app: (typeof appointments)[0]) =>
          app.status === AppointmentStatus.CONFIRMED
      ).length,
      pending: appointments.filter(
        (app: (typeof appointments)[0]) =>
          app.status === AppointmentStatus.PENDING
      ).length,
      cancelled: appointments.filter(
        (app: (typeof appointments)[0]) =>
          app.status === AppointmentStatus.CANCELLED
      ).length,
      completionRate: appointments.length
        ? (appointments.filter(
            (app: (typeof appointments)[0]) =>
              app.status === AppointmentStatus.COMPLETED
          ).length /
            appointments.length) *
          100
        : 0,
    };

    // Generate monthly data
    const months = new Map<
      string,
      {
        month: string;
        year: number;
        revenue: number;
        appointments: number;
        completedAppointments: number;
        cancelledAppointments: number;
        newClients: number;
      }
    >();
    const monthlyData: {
      month: string;
      year: number;
      revenue: number;
      appointments: number;
      completedAppointments: number;
      cancelledAppointments: number;
      newClients: number;
    }[] = [];

    for (const appointment of appointments) {
      const appDate = new Date(appointment.datetime);
      const month = appDate.getMonth() + 1; // 1-12
      const year = appDate.getFullYear();
      const key = `${year}-${month}`;

      if (!months.has(key)) {
        months.set(key, {
          month: month.toString(),
          year,
          revenue: 0,
          appointments: 0,
          completedAppointments: 0,
          cancelledAppointments: 0,
          newClients: 0,
        });
      }

      const monthData = months.get(key);
      if (monthData) {
        monthData.appointments++;

        if (appointment.status === AppointmentStatus.COMPLETED) {
          monthData.completedAppointments++;
          monthData.revenue += appointment.totalPrice;
        } else if (appointment.status === AppointmentStatus.CANCELLED) {
          monthData.cancelledAppointments++;
        }

        // Check if this client is new this month
        const clientCreatedAt = new Date(appointment.user.createdAt);
        if (
          clientCreatedAt.getMonth() + 1 === month &&
          clientCreatedAt.getFullYear() === year
        ) {
          monthData.newClients++;
        }
      }
    }

    // Sort months chronologically
    Array.from(months.entries()).forEach(([_, data]) => {
      monthlyData.push(data);
    });

    monthlyData.sort((a, b) => {
      if (a.year !== b.year) return a.year - b.year;
      return parseInt(a.month) - parseInt(b.month);
    });

    // Calculate popular services
    const serviceMap = new Map();

    for (const appointment of appointments) {
      if (appointment.status !== AppointmentStatus.COMPLETED) continue;

      const serviceName = appointment.serviceType || "Unknown";
      const servicePrice = appointment.totalPrice || 0;

      if (!serviceMap.has(serviceName)) {
        serviceMap.set(serviceName, {
          name: serviceName,
          count: 0,
          revenue: 0,
        });
      }

      const serviceData = serviceMap.get(serviceName);
      serviceData.count++;
      serviceData.revenue += servicePrice;
    }

    const popularServices = Array.from(serviceMap.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Return analytics data
    return NextResponse.json({
      currentMonthRevenue,
      previousMonthRevenue,
      totalRevenue,
      totalClients,
      newClientsThisMonth,
      appointmentStats,
      monthlyData,
      popularServices,
    });
  } catch (error) {
    console.error("Error fetching analytics:", error);
    return NextResponse.json(
      { error: "Failed to fetch analytics data" },
      { status: 500 }
    );
  }
}
