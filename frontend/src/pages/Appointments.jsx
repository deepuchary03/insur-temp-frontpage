import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import Layout from "../components/Layout";
import { appointmentService } from "../services/api";
import { getUser } from "../utils/auth";
import { Calendar, Clock, User, X, Check } from "lucide-react";
import { formatDateTime } from "../utils/dateFormatter";
import {
  appointmentStatusColors,
  appointmentTypeLabels,
} from "../utils/constants";

const Appointments = () => {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const user = getUser();

  useEffect(() => {
    fetchAppointments();
  }, []);

  const fetchAppointments = async () => {
    try {
      const response = await appointmentService.getCustomerAppointments(
        user.id
      );
      setAppointments(response.data);
    } catch (error) {
      console.error("Error fetching appointments:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelAppointment = async (id) => {
    if (!confirm("Are you sure you want to cancel this appointment?")) return;

    try {
      await appointmentService.updateAppointmentStatus(
        id,
        "CANCELLED",
        "Cancelled by customer"
      );
      fetchAppointments();
      toast.success("Appointment cancelled successfully");
    } catch (error) {
      console.error("Error cancelling appointment:", error);
      toast.error("Failed to cancel appointment");
    }
  };

  const filteredAppointments = appointments.filter((apt) => {
    if (filter === "all") return true;
    if (filter === "upcoming")
      return (
        new Date(apt.appointmentDateTime) > new Date() &&
        apt.status !== "CANCELLED" &&
        apt.status !== "COMPLETED"
      );
    if (filter === "past")
      return new Date(apt.appointmentDateTime) < new Date();
    if (filter === "cancelled") return apt.status === "CANCELLED";
    return true;
  });

  if (loading) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-white drop-shadow-lg">
              My Appointments
            </h1>
            <p className="text-white/90 mt-1 drop-shadow-md">
              Manage your scheduled appointments
            </p>
          </div>

          <div className="flex space-x-2">
            <button
              onClick={() => setFilter("all")}
              className={`px-4 py-2 rounded-lg ${
                filter === "all"
                  ? "bg-primary-600 text-white"
                  : "bg-gray-100 text-gray-700"
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilter("upcoming")}
              className={`px-4 py-2 rounded-lg ${
                filter === "upcoming"
                  ? "bg-primary-600 text-white"
                  : "bg-gray-100 text-gray-700"
              }`}
            >
              Upcoming
            </button>
            <button
              onClick={() => setFilter("past")}
              className={`px-4 py-2 rounded-lg ${
                filter === "past"
                  ? "bg-primary-600 text-white"
                  : "bg-gray-100 text-gray-700"
              }`}
            >
              Past
            </button>
            <button
              onClick={() => setFilter("cancelled")}
              className={`px-4 py-2 rounded-lg ${
                filter === "cancelled"
                  ? "bg-primary-600 text-white"
                  : "bg-gray-100 text-gray-700"
              }`}
            >
              Cancelled
            </button>
          </div>
        </div>

        {filteredAppointments.length === 0 ? (
          <div className="card text-center py-12">
            <Calendar size={48} className="mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No appointments found
            </h3>
            <p className="text-gray-600 mb-4">
              You don't have any appointments yet
            </p>
            <a
              href="/book-appointment"
              className="btn btn-primary inline-block"
            >
              Book Your First Appointment
            </a>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredAppointments.map((appointment) => (
              <div key={appointment.id} className="card">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4 flex-1">
                    <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <User className="text-primary-600" size={20} />
                    </div>

                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {appointment.agentName}
                        </h3>
                        <span
                          className={`px-3 py-1 rounded-full text-sm font-medium ${
                            appointmentStatusColors[appointment.status]
                          }`}
                        >
                          {appointment.status}
                        </span>
                      </div>

                      <p className="text-sm text-gray-600 mb-3">
                        {appointment.agentSpecialization}
                      </p>

                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div className="flex items-center space-x-2 text-gray-600">
                          <Calendar size={16} />
                          <span>
                            {formatDateTime(appointment.appointmentDateTime)}
                          </span>
                        </div>
                        <div className="flex items-center space-x-2 text-gray-600">
                          <Clock size={16} />
                          <span>{appointmentTypeLabels[appointment.type]}</span>
                        </div>
                      </div>

                      {appointment.notes && (
                        <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                          <p className="text-sm text-gray-700">
                            <span className="font-medium">Notes:</span>{" "}
                            {appointment.notes}
                          </p>
                        </div>
                      )}

                      {appointment.cancellationReason && (
                        <div className="mt-3 p-3 bg-red-50 rounded-lg">
                          <p className="text-sm text-red-700">
                            <span className="font-medium">
                              Cancellation reason:
                            </span>{" "}
                            {appointment.cancellationReason}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex space-x-2">
                    {appointment.status === "PENDING" ||
                    appointment.status === "CONFIRMED" ? (
                      <button
                        onClick={() => handleCancelAppointment(appointment.id)}
                        className="btn btn-danger"
                      >
                        <X size={16} className="mr-1" />
                        Cancel
                      </button>
                    ) : null}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Appointments;
