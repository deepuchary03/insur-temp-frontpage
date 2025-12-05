import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import Layout from "../components/Layout";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import {
  adminService,
  appointmentService,
  agentService,
} from "../services/api";
import {
  Users,
  Calendar,
  TrendingUp,
  MessageSquare,
  Trash2,
  UserCog,
  Shield,
  CalendarDays,
  Bell,
  Check,
  X,
  Clock,
  Mail,
} from "lucide-react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";

const AdminDashboard = () => {
  const [analytics, setAnalytics] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [users, setUsers] = useState([]);
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview"); // overview, users, agents, appointments, calendar, notifications
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [showEventModal, setShowEventModal] = useState(false);
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    fetchData();
  }, []);

  // Transform appointments for calendar
  const calendarEvents = appointments.map((apt) => ({
    id: apt.id,
    title: `${apt.customerName || "Unknown"} with ${apt.agentName || "Agent"}`,
    start: apt.appointmentDateTime,
    backgroundColor:
      apt.status === "CONFIRMED"
        ? "#10b981"
        : apt.status === "PENDING"
        ? "#f59e0b"
        : apt.status === "COMPLETED"
        ? "#3b82f6"
        : "#ef4444",
    borderColor:
      apt.status === "CONFIRMED"
        ? "#059669"
        : apt.status === "PENDING"
        ? "#d97706"
        : apt.status === "COMPLETED"
        ? "#2563eb"
        : "#dc2626",
    extendedProps: {
      status: apt.status,
      customerName: apt.customerName,
      customerEmail: apt.customerEmail,
      agentName: apt.agentName,
      agentSpecialization: apt.agentSpecialization,
      type: apt.type,
      notes: apt.notes,
    },
  }));

  const fetchData = async () => {
    try {
      const [analyticsRes, appointmentsRes, usersRes, agentsRes] =
        await Promise.all([
          adminService.getAnalytics(),
          appointmentService.getAllAppointments(),
          adminService.getAllUsers(),
          agentService.getAllAgents(),
        ]);
      setAnalytics(analyticsRes.data);
      setAppointments(appointmentsRes.data);
      setUsers(usersRes.data);
      setAgents(agentsRes.data);

      // Generate notifications from system activities
      generateNotifications(
        appointmentsRes.data,
        usersRes.data,
        agentsRes.data
      );
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const generateNotifications = (appointments, users, agents) => {
    const notifs = [];
    const now = new Date();

    // New user registrations (last 7 days)
    const recentUsers = users.filter((u) => {
      if (!u.createdAt) return false;
      const created = new Date(u.createdAt);
      const daysDiff = (now - created) / (1000 * 60 * 60 * 24);
      return daysDiff <= 7;
    });

    recentUsers.forEach((user) => {
      notifs.push({
        id: `user-${user.id}`,
        type: "user_registered",
        title: "New User Registration",
        message: `${user.fullName} (${user.role}) registered`,
        timestamp: user.createdAt,
        icon: "user",
        read: false,
        priority: "medium",
      });
    });

    // Upcoming appointments (next 24 hours)
    const upcomingAppointments = appointments.filter((apt) => {
      if (apt.status === "CANCELLED") return false;
      const aptDate = new Date(apt.appointmentDateTime);
      const hoursDiff = (aptDate - now) / (1000 * 60 * 60);
      return hoursDiff > 0 && hoursDiff <= 24;
    });

    upcomingAppointments.forEach((apt) => {
      notifs.push({
        id: `apt-${apt.id}`,
        type: "appointment_upcoming",
        title: "Upcoming Appointment",
        message: `${apt.customerName} with ${apt.agentName}`,
        timestamp: apt.appointmentDateTime,
        icon: "calendar",
        read: false,
        priority: "high",
      });
    });

    // Pending appointments
    const pendingAppointments = appointments.filter(
      (apt) => apt.status === "PENDING"
    );
    if (pendingAppointments.length > 0) {
      notifs.push({
        id: "pending-apts",
        type: "appointments_pending",
        title: "Pending Appointments",
        message: `${pendingAppointments.length} appointment${
          pendingAppointments.length > 1 ? "s" : ""
        } awaiting confirmation`,
        timestamp: new Date().toISOString(),
        icon: "clock",
        read: false,
        priority: "medium",
      });
    }

    // System activity summary
    notifs.push({
      id: "system-summary",
      type: "system",
      title: "System Activity Summary",
      message: `${users.length} users, ${agents.length} agents, ${appointments.length} total appointments`,
      timestamp: new Date().toISOString(),
      icon: "bell",
      read: false,
      priority: "low",
    });

    // Sort by timestamp (newest first)
    notifs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    setNotifications(notifs);
  };

  const markNotificationAsRead = (notifId) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === notifId ? { ...n, read: true } : n))
    );
  };

  const clearAllNotifications = () => {
    setNotifications([]);
    toast.success("All notifications cleared");
  };

  const handleDeleteUser = async (userId) => {
    if (
      window.confirm(
        "Are you sure you want to delete this user? This action cannot be undone."
      )
    ) {
      try {
        await adminService.deleteUser(userId);
        setUsers(users.filter((u) => u.id !== userId));
        toast.success("User deleted successfully");
      } catch (error) {
        toast.error(
          "Failed to delete user: " +
            (error.response?.data?.message || "Unknown error")
        );
      }
    }
  };

  const handleDeleteAppointment = async (appointmentId) => {
    if (window.confirm("Are you sure you want to delete this appointment?")) {
      try {
        await appointmentService.deleteAppointment(appointmentId);
        setAppointments(appointments.filter((a) => a.id !== appointmentId));
        toast.success("Appointment deleted successfully");
      } catch (error) {
        toast.error(
          "Failed to delete appointment: " +
            (error.response?.data?.message || "Unknown error")
        );
      }
    }
  };

  // Prepare chart data
  const statusData = analytics?.appointmentsByStatus
    ? Object.entries(analytics.appointmentsByStatus).map(([key, value]) => ({
        name: key,
        value: Number(value),
      }))
    : [];

  const weeklyData = analytics?.weeklyStats || [];

  const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8"];

  if (loading) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      </Layout>
    );
  }

  const stats = [
    {
      label: "Total Users",
      value: analytics?.totalUsers || 0,
      icon: Users,
      color: "bg-blue-500",
    },
    {
      label: "Total Appointments",
      value: analytics?.totalAppointments || 0,
      icon: Calendar,
      color: "bg-green-500",
    },
    {
      label: "Total Agents",
      value: analytics?.totalAgents || 0,
      icon: TrendingUp,
      color: "bg-purple-500",
    },
    {
      label: "AI Queries",
      value: analytics?.totalAIQueries || 0,
      icon: MessageSquare,
      color: "bg-orange-500",
    },
  ];

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-white">Admin Dashboard</h1>
          <p className="text-white/80 mt-1">System management and analytics</p>
        </div>

        {/* Tabs */}
        <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
          <button
            onClick={() => setActiveTab("overview")}
            className={`flex-1 px-4 py-2 rounded-md font-medium transition-colors ${
              activeTab === "overview"
                ? "bg-white text-primary-600 shadow"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            📊 Overview
          </button>
          <button
            onClick={() => setActiveTab("users")}
            className={`flex-1 px-4 py-2 rounded-md font-medium transition-colors ${
              activeTab === "users"
                ? "bg-white text-primary-600 shadow"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            👥 Users ({users.length})
          </button>
          <button
            onClick={() => setActiveTab("agents")}
            className={`flex-1 px-4 py-2 rounded-md font-medium transition-colors ${
              activeTab === "agents"
                ? "bg-white text-primary-600 shadow"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            👔 Agents ({agents.length})
          </button>
          <button
            onClick={() => setActiveTab("appointments")}
            className={`flex-1 px-4 py-2 rounded-md font-medium transition-colors ${
              activeTab === "appointments"
                ? "bg-white text-primary-600 shadow"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            📅 Appointments ({appointments.length})
          </button>
          <button
            onClick={() => setActiveTab("calendar")}
            className={`flex-1 px-4 py-2 rounded-md font-medium transition-colors ${
              activeTab === "calendar"
                ? "bg-white text-primary-600 shadow"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            📆 Calendar
          </button>
          <button
            onClick={() => setActiveTab("notifications")}
            className={`flex-1 px-4 py-2 rounded-md font-medium transition-colors relative ${
              activeTab === "notifications"
                ? "bg-white text-primary-600 shadow"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            🔔 Notifications ({notifications.filter((n) => !n.read).length})
          </button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {stats.map((stat, index) => (
            <div key={index} className="card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm">{stat.label}</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">
                    {stat.value}
                  </p>
                </div>
                <div
                  className={`${stat.color} w-12 h-12 rounded-lg flex items-center justify-center`}
                >
                  <stat.icon className="text-white" size={24} />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Overview Tab */}
        {activeTab === "overview" && (
          <>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Pie Chart - Appointments by Status */}
              <div className="card">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  Appointments by Status
                </h2>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={statusData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) =>
                        `${name}: ${(percent * 100).toFixed(0)}%`
                      }
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {statusData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={COLORS[index % COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Bar Chart - Weekly Stats */}
              <div className="card">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  Weekly Appointment Stats
                </h2>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={weeklyData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="day" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="confirmed" fill="#3b82f6" name="Confirmed" />
                    <Bar dataKey="pending" fill="#fbbf24" name="Pending" />
                    <Bar dataKey="cancelled" fill="#ef4444" name="Cancelled" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </>
        )}

        {/* Users Management Tab */}
        {activeTab === "users" && (
          <div className="card">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-900">All Users</h2>
              <p className="text-sm text-gray-500">
                Total: {users.length} users
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Phone
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Role
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Created
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {users.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        #{user.id}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {user.fullName}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {user.email}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {user.phoneNumber || "N/A"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 py-1 text-xs rounded-full font-medium ${
                            user.role === "ADMIN"
                              ? "bg-purple-100 text-purple-800"
                              : user.role === "AGENT"
                              ? "bg-blue-100 text-blue-800"
                              : "bg-green-100 text-green-800"
                          }`}
                        >
                          {user.role}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {user.createdAt
                          ? new Date(user.createdAt).toLocaleDateString()
                          : "N/A"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <button
                          onClick={() => handleDeleteUser(user.id)}
                          className="text-red-600 hover:text-red-900 font-medium flex items-center space-x-1"
                        >
                          <Trash2 size={16} />
                          <span>Delete</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Agents Management Tab */}
        {activeTab === "agents" && (
          <div className="card">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-900">
                All Agents
              </h2>
              <p className="text-sm text-gray-500">
                Total: {agents.length} agents
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Specialization
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Experience
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Rating
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Appointments
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {agents.map((agent) => (
                    <tr key={agent.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        #{agent.id}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {agent.fullName}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {agent.email}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {agent.specialization}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {agent.experienceYears} years
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <span className="flex items-center">
                          ⭐ {agent.rating || "N/A"}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {agent.totalAppointments || 0}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 py-1 text-xs rounded-full font-medium ${
                            agent.isAvailable
                              ? "bg-green-100 text-green-800"
                              : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {agent.isAvailable ? "Available" : "Unavailable"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Appointments Management Tab */}
        {activeTab === "appointments" && (
          <div className="card">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-900">
                All Appointments
              </h2>
              <p className="text-sm text-gray-500">
                Total: {appointments.length} appointments
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Customer
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Agent
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date & Time
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {appointments.map((appointment) => (
                    <tr key={appointment.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        #{appointment.id}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {appointment.customerName}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {appointment.agentName}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(
                          appointment.appointmentDateTime
                        ).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {appointment.type}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 py-1 text-xs rounded-full font-medium ${
                            appointment.status === "CONFIRMED"
                              ? "bg-blue-100 text-blue-800"
                              : appointment.status === "COMPLETED"
                              ? "bg-green-100 text-green-800"
                              : appointment.status === "CANCELLED"
                              ? "bg-red-100 text-red-800"
                              : "bg-yellow-100 text-yellow-800"
                          }`}
                        >
                          {appointment.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <button
                          onClick={() =>
                            handleDeleteAppointment(appointment.id)
                          }
                          className="text-red-600 hover:text-red-900 font-medium flex items-center space-x-1"
                        >
                          <Trash2 size={16} />
                          <span>Delete</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Calendar Tab */}
        {activeTab === "calendar" && (
          <div className="card">
            <div className="flex items-center space-x-3 mb-6">
              <CalendarDays className="text-primary-600" size={24} />
              <h2 className="text-xl font-bold text-gray-900">
                Appointment Calendar
              </h2>
            </div>

            <div className="bg-white rounded-lg p-4">
              <FullCalendar
                plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
                initialView="dayGridMonth"
                headerToolbar={{
                  left: "prev,next today",
                  center: "title",
                  right: "dayGridMonth,timeGridWeek,timeGridDay",
                }}
                events={calendarEvents}
                height="auto"
                eventClick={(info) => {
                  const event = info.event;
                  const appointment = appointments.find(
                    (apt) => apt.id === parseInt(event.id)
                  );
                  console.log("Event clicked:", event);
                  console.log("Appointment found:", appointment);
                  const eventData = {
                    ...event.extendedProps,
                    title: event.title,
                    start: event.start,
                    id: event.id,
                    appointment: appointment,
                  };
                  console.log("Setting selectedEvent:", eventData);
                  setSelectedEvent(eventData);
                  setShowEventModal(true);
                }}
                eventTimeFormat={{
                  hour: "2-digit",
                  minute: "2-digit",
                  meridiem: "short",
                }}
                slotLabelFormat={{
                  hour: "2-digit",
                  minute: "2-digit",
                  meridiem: "short",
                }}
              />
            </div>

            <div className="mt-4 flex items-center gap-4 flex-wrap">
              <div className="flex items-center space-x-2">
                <div
                  className="w-4 h-4 rounded"
                  style={{ backgroundColor: "#10b981" }}
                ></div>
                <span className="text-sm text-gray-600">Confirmed</span>
              </div>
              <div className="flex items-center space-x-2">
                <div
                  className="w-4 h-4 rounded"
                  style={{ backgroundColor: "#f59e0b" }}
                ></div>
                <span className="text-sm text-gray-600">Pending</span>
              </div>
              <div className="flex items-center space-x-2">
                <div
                  className="w-4 h-4 rounded"
                  style={{ backgroundColor: "#3b82f6" }}
                ></div>
                <span className="text-sm text-gray-600">Completed</span>
              </div>
              <div className="flex items-center space-x-2">
                <div
                  className="w-4 h-4 rounded"
                  style={{ backgroundColor: "#ef4444" }}
                ></div>
                <span className="text-sm text-gray-600">Cancelled</span>
              </div>
            </div>
          </div>
        )}

        {/* Event Details Modal */}
        {showEventModal && selectedEvent && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-fade-in-up">
              {/* Header */}
              <div
                className={`p-6 text-white ${
                  selectedEvent.status === "CONFIRMED"
                    ? "bg-gradient-to-r from-green-500 to-green-600"
                    : selectedEvent.status === "PENDING"
                    ? "bg-gradient-to-r from-yellow-500 to-yellow-600"
                    : selectedEvent.status === "COMPLETED"
                    ? "bg-gradient-to-r from-blue-500 to-blue-600"
                    : "bg-gradient-to-r from-red-500 to-red-600"
                }`}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-2xl font-bold mb-1">
                      Appointment Details
                    </h3>
                    <span className="inline-block px-3 py-1 bg-white/20 rounded-full text-sm font-medium">
                      {selectedEvent.status}
                    </span>
                  </div>
                  <button
                    onClick={() => setShowEventModal(false)}
                    className="text-white hover:bg-white/20 rounded-full p-2 transition-colors"
                  >
                    <svg
                      className="w-6 h-6"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="p-6 space-y-4">
                {/* Customer Info */}
                <div className="flex items-start space-x-3 p-4 bg-blue-50 rounded-lg">
                  <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                    <Users size={20} className="text-white" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 font-medium">
                      Customer
                    </p>
                    <p className="text-lg font-semibold text-gray-900">
                      {selectedEvent.customerName}
                    </p>
                    {selectedEvent.customerEmail && (
                      <p className="text-sm text-gray-600">
                        {selectedEvent.customerEmail}
                      </p>
                    )}
                  </div>
                </div>

                {/* Agent Info */}
                <div className="flex items-start space-x-3 p-4 bg-purple-50 rounded-lg">
                  <div className="w-10 h-10 bg-purple-500 rounded-full flex items-center justify-center flex-shrink-0">
                    <UserCog size={20} className="text-white" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 font-medium">
                      Insurance Agent
                    </p>
                    <p className="text-lg font-semibold text-gray-900">
                      {selectedEvent.agentName}
                    </p>
                    {selectedEvent.agentSpecialization && (
                      <p className="text-sm text-gray-600">
                        {selectedEvent.agentSpecialization}
                      </p>
                    )}
                  </div>
                </div>

                {/* Date & Time */}
                <div className="flex items-start space-x-3 p-4 bg-green-50 rounded-lg">
                  <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                    <Calendar size={20} className="text-white" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 font-medium">
                      Appointment Time
                    </p>
                    <p className="text-lg font-semibold text-gray-900">
                      {new Date(selectedEvent.start).toLocaleDateString(
                        "en-US",
                        {
                          weekday: "long",
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        }
                      )}
                    </p>
                    <p className="text-md font-medium text-gray-700">
                      {new Date(selectedEvent.start).toLocaleTimeString(
                        "en-US",
                        {
                          hour: "2-digit",
                          minute: "2-digit",
                        }
                      )}
                    </p>
                  </div>
                </div>

                {/* Type */}
                {selectedEvent.type && (
                  <div className="p-4 bg-orange-50 rounded-lg">
                    <p className="text-sm text-gray-600 font-medium mb-1">
                      Appointment Type
                    </p>
                    <p className="text-gray-900 font-medium">
                      {selectedEvent.type.replace(/_/g, " ")}
                    </p>
                  </div>
                )}

                {/* Notes */}
                {selectedEvent.notes && (
                  <div className="p-4 bg-indigo-50 rounded-lg">
                    <p className="text-sm text-gray-600 font-medium mb-1">
                      Notes
                    </p>
                    <p className="text-gray-900 text-sm">
                      {selectedEvent.notes}
                    </p>
                  </div>
                )}
              </div>

              {/* Footer Actions */}
              <div className="p-6 bg-gray-50 border-t flex justify-between">
                <button
                  onClick={() =>
                    handleDeleteAppointment(parseInt(selectedEvent.id))
                  }
                  className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  <Trash2 size={16} />
                  <span>Delete</span>
                </button>
                <button
                  onClick={() => setShowEventModal(false)}
                  className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Notifications Tab */}
        {activeTab === "notifications" && (
          <div className="card">
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center space-x-3">
                <Bell className="text-purple-600" size={24} />
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">
                    Notifications
                  </h2>
                  <p className="text-sm text-gray-500">
                    {notifications.filter((n) => !n.read).length} unread
                    notifications
                  </p>
                </div>
              </div>
              <button
                onClick={clearAllNotifications}
                className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors text-sm font-medium"
              >
                Clear All
              </button>
            </div>

            {notifications.length === 0 ? (
              <div className="text-center py-12">
                <Bell size={48} className="mx-auto text-gray-300 mb-4" />
                <p className="text-gray-500 text-lg">No notifications</p>
                <p className="text-gray-400 text-sm mt-2">
                  You're all caught up!
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {notifications.map((notif) => {
                  const getIcon = () => {
                    switch (notif.icon) {
                      case "user":
                        return <Users size={20} />;
                      case "calendar":
                        return <Calendar size={20} />;
                      case "clock":
                        return <Clock size={20} />;
                      case "bell":
                        return <Bell size={20} />;
                      default:
                        return <Bell size={20} />;
                    }
                  };

                  const getPriorityColor = () => {
                    switch (notif.priority) {
                      case "high":
                        return "bg-red-500";
                      case "medium":
                        return "bg-yellow-500";
                      case "low":
                        return "bg-blue-500";
                      default:
                        return "bg-gray-500";
                    }
                  };

                  const getTimeAgo = (timestamp) => {
                    const now = new Date();
                    const time = new Date(timestamp);
                    const diffMs = now - time;
                    const diffMins = Math.floor(diffMs / 60000);
                    const diffHours = Math.floor(diffMs / 3600000);
                    const diffDays = Math.floor(diffMs / 86400000);

                    if (diffMins < 60) return `${diffMins}m ago`;
                    if (diffHours < 24) return `${diffHours}h ago`;
                    return `${diffDays}d ago`;
                  };

                  return (
                    <div
                      key={notif.id}
                      className={`relative p-4 rounded-lg border-l-4 transition-all duration-300 ${
                        notif.read
                          ? "bg-gray-50 border-gray-300 opacity-60"
                          : "bg-white border-purple-500 shadow-sm hover:shadow-md"
                      }`}
                    >
                      <div className="flex items-start space-x-4">
                        <div
                          className={`w-10 h-10 rounded-full flex items-center justify-center ${getPriorityColor()} text-white flex-shrink-0`}
                        >
                          {getIcon()}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h4 className="text-base font-semibold text-gray-900">
                                {notif.title}
                              </h4>
                              <p className="text-sm text-gray-600 mt-1">
                                {notif.message}
                              </p>
                              <div className="flex items-center space-x-4 mt-2">
                                <span className="text-xs text-gray-400">
                                  {getTimeAgo(notif.timestamp)}
                                </span>
                                <span
                                  className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                                    notif.priority === "high"
                                      ? "bg-red-100 text-red-700"
                                      : notif.priority === "medium"
                                      ? "bg-yellow-100 text-yellow-700"
                                      : "bg-blue-100 text-blue-700"
                                  }`}
                                >
                                  {notif.priority}
                                </span>
                              </div>
                            </div>

                            {!notif.read && (
                              <button
                                onClick={() => markNotificationAsRead(notif.id)}
                                className="ml-4 p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                                title="Mark as read"
                              >
                                <Check size={18} />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Notification Stats */}
            <div className="mt-6 grid grid-cols-3 gap-4">
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <p className="text-2xl font-bold text-purple-600">
                  {notifications.length}
                </p>
                <p className="text-sm text-gray-600 mt-1">Total</p>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <p className="text-2xl font-bold text-green-600">
                  {notifications.filter((n) => n.read).length}
                </p>
                <p className="text-sm text-gray-600 mt-1">Read</p>
              </div>
              <div className="text-center p-4 bg-orange-50 rounded-lg">
                <p className="text-2xl font-bold text-orange-600">
                  {notifications.filter((n) => !n.read).length}
                </p>
                <p className="text-sm text-gray-600 mt-1">Unread</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default AdminDashboard;
