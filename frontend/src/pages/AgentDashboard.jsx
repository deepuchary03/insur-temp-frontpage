import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import Layout from "../components/Layout";
import {
  appointmentService,
  agentService,
  availabilityService,
} from "../services/api";
import { getUser } from "../utils/auth";
import {
  Calendar,
  CheckCircle,
  XCircle,
  Clock,
  Plus,
  Trash2,
  Check,
} from "lucide-react";

const AgentDashboard = () => {
  const [appointments, setAppointments] = useState([]);
  const [agentProfile, setAgentProfile] = useState(null);
  const [availability, setAvailability] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("appointments"); // appointments, slots
  const [showAddSlot, setShowAddSlot] = useState(false);
  const [newSlot, setNewSlot] = useState({
    date: "",
    startTime: "",
    endTime: "",
  });
  const user = getUser();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const agentRes = await agentService.getAgentByUserId(user.id);
      if (agentRes.data) {
        setAgentProfile(agentRes.data);

        const [appointmentsRes, availabilityRes] = await Promise.all([
          appointmentService.getAgentAppointments(agentRes.data.id),
          availabilityService.getAgentAvailability(agentRes.data.id),
        ]);

        setAppointments(appointmentsRes.data);
        setAvailability(availabilityRes.data);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      if (error.response?.status === 404) {
        // Agent profile doesn't exist yet
        setAgentProfile(null);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (id, status) => {
    try {
      await appointmentService.updateAppointmentStatus(id, status, null);
      fetchData();
      toast.success(`Appointment ${status.toLowerCase()} successfully`);
    } catch (error) {
      console.error("Error updating appointment:", error);
      toast.error("Failed to update appointment");
    }
  };

  const handleAddSlot = async (e) => {
    e.preventDefault();
    if (!newSlot.date || !newSlot.startTime || !newSlot.endTime) {
      toast.error("Please fill all fields");
      return;
    }

    try {
      await availabilityService.createAvailability({
        agentId: agentProfile.id,
        date: newSlot.date,
        startTime: newSlot.startTime + ":00",
        endTime: newSlot.endTime + ":00",
      });
      setNewSlot({ date: "", startTime: "", endTime: "" });
      setShowAddSlot(false);
      fetchData();
      toast.success("Time slot added successfully");
    } catch (error) {
      toast.error(
        "Failed to add time slot: " +
          (error.response?.data?.message || "Unknown error")
      );
    }
  };

  const handleDeleteSlot = async (slotId) => {
    if (window.confirm("Are you sure you want to delete this time slot?")) {
      try {
        await availabilityService.deleteAvailability(slotId);
        fetchData();
        toast.success("Time slot deleted successfully");
      } catch (error) {
        toast.error(
          "Failed to delete time slot: " +
            (error.response?.data?.message || "Cannot delete booked slots")
        );
      }
    }
  };

  const handleToggleAvailability = async () => {
    try {
      const newStatus = !agentProfile.isAvailable;
      await agentService.updateAgent(agentProfile.id, {
        ...agentProfile,
        isAvailable: newStatus,
      });
      setAgentProfile({ ...agentProfile, isAvailable: newStatus });
      toast.success(
        `You are now ${
          newStatus ? "available" : "unavailable"
        } for appointments`
      );
    } catch (error) {
      toast.error("Failed to update availability status");
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      </Layout>
    );
  }

  // If agent profile doesn't exist, show profile creation form
  if (!agentProfile) {
    return (
      <Layout>
        <div className="max-w-2xl mx-auto space-y-6">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900">
              Welcome, Agent!
            </h1>
            <p className="text-gray-600 mt-2">
              Please complete your agent profile to get started
            </p>
          </div>

          <div className="card">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">
              Create Your Agent Profile
            </h2>
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                const formData = new FormData(e.target);
                const profileData = {
                  userId: user.id,
                  specialization: formData.get("specialization"),
                  bio: formData.get("bio"),
                  experienceYears: parseInt(formData.get("experienceYears")),
                };

                try {
                  await agentService.createAgent(profileData);
                  toast.success("Profile created successfully!");
                  fetchData();
                } catch (error) {
                  toast.error(
                    "Failed to create profile: " +
                      (error.response?.data?.message || "Unknown error")
                  );
                }
              }}
              className="space-y-5"
            >
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Specialization
                </label>
                <select
                  name="specialization"
                  required
                  className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-lg focus:bg-white focus:border-primary-500 focus:ring-2 focus:ring-primary-200 outline-none transition-all duration-200"
                >
                  <option value="">Select your specialization</option>
                  <option value="Life Insurance">Life Insurance</option>
                  <option value="Health Insurance">Health Insurance</option>
                  <option value="Auto Insurance">Auto Insurance</option>
                  <option value="Home Insurance">Home Insurance</option>
                  <option value="Business Insurance">Business Insurance</option>
                  <option value="Travel Insurance">Travel Insurance</option>
                  <option value="Disability Insurance">
                    Disability Insurance
                  </option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Years of Experience
                </label>
                <input
                  type="number"
                  name="experienceYears"
                  min="0"
                  max="50"
                  required
                  placeholder="e.g., 5"
                  className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-lg focus:bg-white focus:border-primary-500 focus:ring-2 focus:ring-primary-200 outline-none transition-all duration-200"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Bio / About You
                </label>
                <textarea
                  name="bio"
                  rows="4"
                  required
                  placeholder="Tell customers about your expertise and experience..."
                  className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-lg focus:bg-white focus:border-primary-500 focus:ring-2 focus:ring-primary-200 outline-none transition-all duration-200"
                ></textarea>
              </div>

              <button
                type="submit"
                className="w-full bg-primary-600 hover:bg-primary-700 text-white font-semibold py-3 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                Create Agent Profile
              </button>
            </form>
          </div>
        </div>
      </Layout>
    );
  }

  const pendingAppointments = appointments.filter(
    (a) => a.status === "PENDING"
  );
  const confirmedAppointments = appointments.filter(
    (a) => a.status === "CONFIRMED"
  );
  const completedAppointments = appointments.filter(
    (a) => a.status === "COMPLETED"
  );
  const availableSlots = availability.filter((s) => !s.isBooked);

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-white">Agent Dashboard</h1>
            <p className="text-white/80 mt-1">
              Manage your appointments and availability
            </p>
          </div>

          {/* Availability Toggle */}
          <div className="flex items-center space-x-3 bg-white/10 backdrop-blur-md px-6 py-3 rounded-lg border border-white/20">
            <span className="text-white font-medium">Availability Status:</span>
            <button
              onClick={handleToggleAvailability}
              className={`relative inline-flex items-center h-8 rounded-full w-16 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 ${
                agentProfile?.isAvailable ? "bg-green-500" : "bg-gray-400"
              }`}
            >
              <span
                className={`inline-block w-6 h-6 transform transition-transform bg-white rounded-full shadow-lg ${
                  agentProfile?.isAvailable ? "translate-x-9" : "translate-x-1"
                }`}
              />
            </button>
            <span
              className={`font-semibold ${
                agentProfile?.isAvailable ? "text-green-400" : "text-gray-400"
              }`}
            >
              {agentProfile?.isAvailable ? "Available" : "Unavailable"}
            </span>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
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
            onClick={() => setActiveTab("slots")}
            className={`flex-1 px-4 py-2 rounded-md font-medium transition-colors ${
              activeTab === "slots"
                ? "bg-white text-primary-600 shadow"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            🕒 Time Slots ({availability.length})
          </button>
        </div>

        {/* Agent Stats */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
          <div className="card bg-gradient-to-br from-blue-50 to-blue-100">
            <p className="text-blue-700 text-sm font-medium">
              Total Appointments
            </p>
            <p className="text-3xl font-bold text-blue-900 mt-2">
              {appointments.length}
            </p>
          </div>
          <div className="card bg-gradient-to-br from-yellow-50 to-yellow-100">
            <p className="text-yellow-700 text-sm font-medium">Pending</p>
            <p className="text-3xl font-bold text-yellow-900 mt-2">
              {pendingAppointments.length}
            </p>
          </div>
          <div className="card bg-gradient-to-br from-green-50 to-green-100">
            <p className="text-green-700 text-sm font-medium">Confirmed</p>
            <p className="text-3xl font-bold text-green-900 mt-2">
              {confirmedAppointments.length}
            </p>
          </div>
          <div className="card bg-gradient-to-br from-purple-50 to-purple-100">
            <p className="text-purple-700 text-sm font-medium">Completed</p>
            <p className="text-3xl font-bold text-purple-900 mt-2">
              {completedAppointments.length}
            </p>
          </div>
          <div className="card bg-gradient-to-br from-orange-50 to-orange-100">
            <p className="text-orange-700 text-sm font-medium">Rating</p>
            <p className="text-3xl font-bold text-orange-900 mt-2">
              ⭐ {agentProfile?.rating.toFixed(1)}
            </p>
          </div>
        </div>

        {/* Appointments Tab */}
        {activeTab === "appointments" && (
          <>
            {/* Pending Appointments */}
            {pendingAppointments.length > 0 && (
              <div className="card">
                <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                  <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-sm mr-2">
                    {pendingAppointments.length}
                  </span>
                  Pending Requests
                </h2>
                <div className="space-y-4">
                  {pendingAppointments.map((apt) => (
                    <div
                      key={apt.id}
                      className="border-2 border-yellow-200 bg-yellow-50 rounded-lg p-4"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="font-semibold text-lg text-gray-900">
                            {apt.customerName}
                          </p>
                          <p className="text-sm text-gray-600 flex items-center mt-1">
                            <Calendar size={14} className="mr-1" />
                            {new Date(apt.appointmentDateTime).toLocaleString()}
                          </p>
                          <p className="text-sm text-gray-600 mt-1">
                            Type:{" "}
                            <span className="font-medium">{apt.type}</span>
                          </p>
                          <p className="text-sm text-gray-600">
                            Email: {apt.customerEmail}
                          </p>
                          {apt.notes && (
                            <p className="text-sm text-gray-700 mt-2 bg-white p-2 rounded">
                              <strong>Notes:</strong> {apt.notes}
                            </p>
                          )}
                        </div>
                        <div className="flex flex-col space-y-2 ml-4">
                          <button
                            onClick={() =>
                              handleUpdateStatus(apt.id, "CONFIRMED")
                            }
                            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 font-medium"
                          >
                            <CheckCircle size={18} />
                            <span>Accept</span>
                          </button>
                          <button
                            onClick={() =>
                              handleUpdateStatus(apt.id, "CANCELLED")
                            }
                            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 font-medium"
                          >
                            <XCircle size={18} />
                            <span>Decline</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Confirmed Appointments */}
            <div className="card">
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-sm mr-2">
                  {confirmedAppointments.length}
                </span>
                Confirmed Appointments
              </h2>
              {confirmedAppointments.length === 0 ? (
                <p className="text-gray-600 text-center py-8">
                  No confirmed appointments
                </p>
              ) : (
                <div className="space-y-4">
                  {confirmedAppointments.map((apt) => (
                    <div
                      key={apt.id}
                      className="border border-green-200 bg-green-50 rounded-lg p-4"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="font-semibold text-lg text-gray-900">
                            {apt.customerName}
                          </p>
                          <p className="text-sm text-gray-600">
                            {apt.customerEmail}
                          </p>
                          <p className="text-sm text-gray-600 flex items-center mt-1">
                            <Calendar size={14} className="mr-1" />
                            {new Date(apt.appointmentDateTime).toLocaleString()}
                          </p>
                          <p className="text-sm text-gray-600 mt-1">
                            Type:{" "}
                            <span className="font-medium">{apt.type}</span>
                          </p>
                          {apt.notes && (
                            <p className="text-sm text-gray-700 mt-2 bg-white p-2 rounded">
                              <strong>Notes:</strong> {apt.notes}
                            </p>
                          )}
                        </div>
                        <button
                          onClick={() =>
                            handleUpdateStatus(apt.id, "COMPLETED")
                          }
                          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 font-medium ml-4"
                        >
                          <Check size={18} />
                          <span>Mark Complete</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Completed Appointments */}
            {completedAppointments.length > 0 && (
              <div className="card">
                <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                  <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded text-sm mr-2">
                    {completedAppointments.length}
                  </span>
                  Completed Appointments
                </h2>
                <div className="space-y-3">
                  {completedAppointments.slice(0, 5).map((apt) => (
                    <div
                      key={apt.id}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200"
                    >
                      <div>
                        <p className="font-medium text-gray-900">
                          {apt.customerName}
                        </p>
                        <p className="text-sm text-gray-600">
                          {new Date(apt.appointmentDateTime).toLocaleString()}
                        </p>
                      </div>
                      <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm font-medium">
                        ✓ Completed
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {/* Time Slots Tab */}
        {activeTab === "slots" && (
          <div className="space-y-6">
            {/* Add Slot Form */}
            <div className="card">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-gray-900">
                  Manage Time Slots
                </h2>
                <button
                  onClick={() => setShowAddSlot(!showAddSlot)}
                  className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 font-medium"
                >
                  <Plus size={18} />
                  <span>Add New Slot</span>
                </button>
              </div>

              {showAddSlot && (
                <form
                  onSubmit={handleAddSlot}
                  className="bg-blue-50 p-4 rounded-lg border-2 border-blue-200 mb-4"
                >
                  <h3 className="font-semibold text-gray-900 mb-3">
                    Create New Time Slot
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Date
                      </label>
                      <input
                        type="date"
                        value={newSlot.date}
                        onChange={(e) =>
                          setNewSlot({ ...newSlot, date: e.target.value })
                        }
                        min={new Date().toISOString().split("T")[0]}
                        className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-primary-500 focus:ring-2 focus:ring-primary-200 outline-none"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Start Time
                      </label>
                      <input
                        type="time"
                        value={newSlot.startTime}
                        onChange={(e) =>
                          setNewSlot({ ...newSlot, startTime: e.target.value })
                        }
                        className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-primary-500 focus:ring-2 focus:ring-primary-200 outline-none"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        End Time
                      </label>
                      <input
                        type="time"
                        value={newSlot.endTime}
                        onChange={(e) =>
                          setNewSlot({ ...newSlot, endTime: e.target.value })
                        }
                        className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-primary-500 focus:ring-2 focus:ring-primary-200 outline-none"
                        required
                      />
                    </div>
                  </div>
                  <div className="flex space-x-2 mt-4">
                    <button
                      type="submit"
                      className="bg-primary-600 hover:bg-primary-700 text-white px-6 py-2 rounded-lg font-medium"
                    >
                      Add Slot
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowAddSlot(false)}
                      className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-6 py-2 rounded-lg font-medium"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Available Slots */}
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                    <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-sm mr-2">
                      {availableSlots.length}
                    </span>
                    Available Slots
                  </h3>
                  {availableSlots.length === 0 ? (
                    <p className="text-gray-600 text-center py-8 bg-gray-50 rounded-lg">
                      No available slots
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {availableSlots.map((slot) => (
                        <div
                          key={slot.id}
                          className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg"
                        >
                          <div>
                            <p className="font-medium text-gray-900">
                              {slot.date}
                            </p>
                            <p className="text-sm text-gray-600 flex items-center">
                              <Clock size={14} className="mr-1" />
                              {slot.startTime} - {slot.endTime}
                            </p>
                          </div>
                          <button
                            onClick={() => handleDeleteSlot(slot.id)}
                            className="text-red-600 hover:text-red-800 p-2 rounded-lg hover:bg-red-100"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Booked Slots */}
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                    <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm mr-2">
                      {availability.filter((s) => s.isBooked).length}
                    </span>
                    Booked Slots
                  </h3>
                  {availability.filter((s) => s.isBooked).length === 0 ? (
                    <p className="text-gray-600 text-center py-8 bg-gray-50 rounded-lg">
                      No booked slots
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {availability
                        .filter((s) => s.isBooked)
                        .map((slot) => (
                          <div
                            key={slot.id}
                            className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-lg"
                          >
                            <div>
                              <p className="font-medium text-gray-900">
                                {slot.date}
                              </p>
                              <p className="text-sm text-gray-600 flex items-center">
                                <Clock size={14} className="mr-1" />
                                {slot.startTime} - {slot.endTime}
                              </p>
                            </div>
                            <span className="px-2 py-1 bg-blue-600 text-white rounded text-xs font-medium">
                              BOOKED
                            </span>
                          </div>
                        ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default AgentDashboard;
