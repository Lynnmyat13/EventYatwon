import { Types } from "mongoose";
import {
  Event,
  Registration,
  Ticket,
  User,
  type RegistrationStatus,
  type ITicketType,
  type TicketStatus,
  type UserRole,
} from "../models";
import { HttpError } from "../utils/http";

export interface ManagementListOptions {
  page: number;
  limit: number;
  search?: string;
  status?: string;
  ticketType?: string;
  checkedIn?: boolean;
}

const escapeRegex = (value: string): string =>
  value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const pagination = (page: number, limit: number, total: number) => ({
  page,
  limit,
  total,
  pages: Math.ceil(total / limit),
});

const managedEvent = async (
  eventId: string,
  userId: string,
  role: UserRole,
) => {
  if (!Types.ObjectId.isValid(eventId))
    throw new HttpError(404, "Event not found");
  const event = await Event.findById(eventId);
  if (!event) throw new HttpError(404, "Event not found");
  if (role !== "admin" && event.organizer.toString() !== userId) {
    throw new HttpError(403, "You do not have permission to manage this event");
  }
  return event;
};

const matchingUsers = async (search?: string) => {
  if (!search) return undefined;
  const pattern = { $regex: escapeRegex(search), $options: "i" };
  return User.find({ $or: [{ name: pattern }, { email: pattern }] }).distinct(
    "_id",
  );
};

const activeTicketQuantities = (eventId: Types.ObjectId) =>
  Registration.aggregate<{ _id: string; quantity: number }>([
    {
      $match: {
        event: eventId,
        status: { $in: ["pending", "confirmed"] },
      },
    },
    { $group: { _id: "$ticketType", quantity: { $sum: "$quantity" } } },
  ]);

export const getManagementOverview = async (
  eventId: string,
  userId: string,
  role: UserRole,
) => {
  const event = await managedEvent(eventId, userId, role);
  const activeRegistrationStatuses: RegistrationStatus[] = [
    "pending",
    "confirmed",
  ];
  const activeTicketStatuses: TicketStatus[] = ["active", "used"];
  const [totalRegistrations, ticketQuantities, ticketsIssued, checkedInUsers] =
    await Promise.all([
      Registration.countDocuments({
        event: event._id,
        status: { $in: activeRegistrationStatuses },
      }),
      activeTicketQuantities(event._id),
      Ticket.countDocuments({
        event: event._id,
        status: { $in: activeTicketStatuses },
      }),
      Ticket.distinct("user", { event: event._id, checkedIn: true }),
    ]);
  const quantities = new Map(
    ticketQuantities.map((item) => [item._id, item.quantity]),
  );
  const ticketBreakdown = event.ticketTypes.map((ticketType: ITicketType) => ({
    name: ticketType.name,
    price: ticketType.price,
    quantity: ticketType.quantity,
    sold: quantities.get(ticketType.name) ?? 0,
    revenue: ticketType.price * (quantities.get(ticketType.name) ?? 0),
  }));
  const registeredCount = ticketQuantities.reduce(
    (total, ticket) => total + ticket.quantity,
    0,
  );
  const eventData = event.toObject({ versionKey: false });
  eventData.registeredCount = registeredCount;
  eventData.ticketTypes = eventData.ticketTypes.map((ticket: ITicketType) => ({
    ...ticket,
    sold: quantities.get(ticket.name) ?? 0,
  }));

  return {
    event: eventData,
    metrics: {
      capacity: event.capacity,
      totalRegistrations,
      registeredCount,
      ticketsIssued,
      checkedInAttendees: checkedInUsers.length,
      remainingCapacity: Math.max(0, event.capacity - registeredCount),
      revenue: ticketBreakdown.reduce(
        (total: number, ticket: { revenue: number }) => total + ticket.revenue,
        0,
      ),
    },
    ticketBreakdown,
  };
};

export const getManagementAnalytics = async (
  eventId: string,
  userId: string,
  role: UserRole,
) => {
  const event = await managedEvent(eventId, userId, role);
  const activeRegistrationStatuses: RegistrationStatus[] = [
    "pending",
    "confirmed",
  ];
  const activeTicketStatuses: TicketStatus[] = ["active", "used"];
  const [
    registrationTimeline,
    totalRegistrations,
    ticketQuantities,
    cancelledRegistrations,
    ticketsIssued,
    totalCheckIns,
  ] = await Promise.all([
    Registration.aggregate<{ date: string; registrations: number }>([
      {
        $match: {
          event: event._id,
          status: { $in: activeRegistrationStatuses },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$registeredAt" },
          },
          registrations: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
      { $project: { _id: 0, date: "$_id", registrations: 1 } },
    ]),
    Registration.countDocuments({
      event: event._id,
      status: { $in: activeRegistrationStatuses },
    }),
    activeTicketQuantities(event._id),
    Registration.countDocuments({
      event: event._id,
      status: { $in: ["cancelled", "refunded"] },
    }),
    Ticket.countDocuments({
      event: event._id,
      status: { $in: activeTicketStatuses },
    }),
    Ticket.countDocuments({ event: event._id, checkedIn: true }),
  ]);
  const quantities = new Map(
    ticketQuantities.map((item) => [item._id, item.quantity]),
  );
  const registeredCount = ticketQuantities.reduce(
    (total, ticket) => total + ticket.quantity,
    0,
  );
  const ticketTypes = event.ticketTypes.map((ticketType: ITicketType) => ({
    name: ticketType.name,
    value: quantities.get(ticketType.name) ?? 0,
  }));
  const revenue = event.ticketTypes.reduce(
    (total: number, ticketType: ITicketType) =>
      total + ticketType.price * (quantities.get(ticketType.name) ?? 0),
    0,
  );

  return {
    summary: {
      totalRegistrations,
      capacityUsedPercent: event.capacity
        ? Number(((registeredCount / event.capacity) * 100).toFixed(1))
        : 0,
      ticketsIssued,
      totalCheckIns,
      checkInRatePercent: ticketsIssued
        ? Number(((totalCheckIns / ticketsIssued) * 100).toFixed(1))
        : 0,
      revenue,
    },
    registrationsOverTime: registrationTimeline,
    ticketTypes,
    checkIns: [
      { name: "Checked in", value: totalCheckIns },
      {
        name: "Not checked in",
        value: Math.max(0, ticketsIssued - totalCheckIns),
      },
    ],
    statistics: {
      cancelledRegistrations,
      averageTicketsPerRegistration: totalRegistrations
        ? Number((registeredCount / totalRegistrations).toFixed(1))
        : 0,
    },
  };
};

export const getManagementAttendees = async (
  eventId: string,
  userId: string,
  role: UserRole,
  options: ManagementListOptions,
) => {
  const event = await managedEvent(eventId, userId, role);
  const userIds = await matchingUsers(options.search);
  const filter: Record<string, unknown> = { event: event._id };
  if (userIds) filter.user = { $in: userIds };
  if (options.status) filter.status = options.status;
  if (options.ticketType) filter.ticketType = options.ticketType;

  const [registrations, total] = await Promise.all([
    Registration.find(filter)
      .select("user ticketType quantity status registeredAt")
      .populate("user", "name email avatar")
      .sort({ registeredAt: -1 })
      .skip((options.page - 1) * options.limit)
      .limit(options.limit)
      .lean(),
    Registration.countDocuments(filter),
  ]);
  const registrationIds = registrations.map((registration) => registration._id);
  const checkIns = await Ticket.aggregate<{
    _id: Types.ObjectId;
    checkedIn: number;
  }>([
    { $match: { registration: { $in: registrationIds }, checkedIn: true } },
    { $group: { _id: "$registration", checkedIn: { $sum: 1 } } },
  ]);
  const checkInCounts = new Map(
    checkIns.map((item) => [item._id.toString(), item.checkedIn]),
  );

  return {
    attendees: registrations.map((registration) => ({
      registrationId: registration._id,
      attendee: registration.user,
      ticketType: registration.ticketType,
      quantity: registration.quantity,
      status: registration.status,
      registeredAt: registration.registeredAt,
      checkedInCount: checkInCounts.get(registration._id.toString()) ?? 0,
    })),
    pagination: pagination(options.page, options.limit, total),
  };
};

export const getManagementTickets = async (
  eventId: string,
  userId: string,
  role: UserRole,
  options: ManagementListOptions,
) => {
  const event = await managedEvent(eventId, userId, role);
  const userIds = await matchingUsers(options.search);
  const filter: Record<string, unknown> = { event: event._id };
  if (options.search) {
    filter.$or = [
      { ticketCode: { $regex: escapeRegex(options.search), $options: "i" } },
      ...(userIds?.length ? [{ user: { $in: userIds } }] : []),
    ];
  }
  if (options.status) filter.status = options.status;
  if (options.ticketType) filter.ticketType = options.ticketType;
  if (options.checkedIn !== undefined) filter.checkedIn = options.checkedIn;

  const [tickets, total] = await Promise.all([
    Ticket.find(filter)
      .select(
        "user ticketCode ticketType status checkedIn checkedInAt createdAt",
      )
      .populate("user", "name email avatar")
      .sort({ createdAt: -1 })
      .skip((options.page - 1) * options.limit)
      .limit(options.limit)
      .lean(),
    Ticket.countDocuments(filter),
  ]);
  return {
    tickets,
    pagination: pagination(options.page, options.limit, total),
  };
};

export const getManagementCheckIns = async (
  eventId: string,
  userId: string,
  role: UserRole,
  options: ManagementListOptions,
) => {
  const event = await managedEvent(eventId, userId, role);
  const userIds = await matchingUsers(options.search);
  const filter: Record<string, unknown> = { event: event._id, checkedIn: true };
  if (options.search) {
    filter.$or = [
      { ticketCode: { $regex: escapeRegex(options.search), $options: "i" } },
      ...(userIds?.length ? [{ user: { $in: userIds } }] : []),
    ];
  }
  if (options.ticketType) filter.ticketType = options.ticketType;

  const [checkIns, total] = await Promise.all([
    Ticket.find(filter)
      .select("user ticketCode ticketType status checkedInAt")
      .populate("user", "name email avatar")
      .sort({ checkedInAt: -1 })
      .skip((options.page - 1) * options.limit)
      .limit(options.limit)
      .lean(),
    Ticket.countDocuments(filter),
  ]);
  return {
    checkIns,
    pagination: pagination(options.page, options.limit, total),
  };
};
