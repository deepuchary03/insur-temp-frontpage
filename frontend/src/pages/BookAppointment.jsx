import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "react-toastify";
import Layout from "../components/Layout";
import {
  appointmentService,
  agentService,
  availabilityService,
} from "../services/api";
import { getUser } from "../utils/auth";
import { Calendar, Clock, User, CheckCircle } from "lucide-react";

const BookAppointment = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const user = getUser();

  const [agents, setAgents] = useState([]);
  const [selectedAgent, setSelectedAgent] = useState(null);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [appointmentType, setAppointmentType] = useState("CONSULTATION");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);

  useEffect(() => {
    fetchAgents();
    const agentId = searchParams.get("agentId");
    if (agentId) {
      loadAgent(parseInt(agentId));
    }
  }, [searchParams]);

  const fetchAgents = async () => {
    try {
      const response = await agentService.getAvailableAgents();
      setAgents(response.data);
    } catch (error) {
      console.error("Error fetching agents:", error);
    }
  };

  const loadAgent = async (agentId) => {
    try {
      const response = await agentService.getAgentById(agentId);
      setSelectedAgent(response.data);
      fetchAvailability(agentId);
      setStep(2);
    } catch (error) {
      console.error("Error loading agent:", error);
    }
  };

  const fetchAvailability = async (agentId) => {
    try {
      const today = new Date().toISOString().split("T")[0];
      const response = await availabilityService.getAvailableSlots(
        agentId,
        today
      );
      setAvailableSlots(response.data);
    } catch (error) {
      console.error("Error fetching availability:", error);
    }
  };

  const handleAgentSelect = (agent) => {
    setSelectedAgent(agent);
    fetchAvailability(agent.id);
    setStep(2);
  };

  const handleSlotSelect = (slot) => {
    setSelectedSlot(slot);
    setStep(3);
  };

  const handleBookAppointment = async () => {
    if (!selectedAgent || !selectedSlot) return;

    setLoading(true);
    try {
      const appointmentDateTime = `${selectedSlot.date}T${selectedSlot.startTime}`;

      await appointmentService.createAppointment({
        customerId: user.id,
        agentId: selectedAgent.id,
        appointmentDateTime,
        type: appointmentType,
        notes,
      });

      toast.success("Appointment booked successfully!");
      navigate("/appointments");
    } catch (error) {
      console.error("Error booking appointment:", error);
      toast.error("Failed to book appointment. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Book an Appointment
          </h1>
          <p className="text-gray-600 mt-1">
            Schedule a meeting with our insurance experts
          </p>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-center mb-8">
          <div className="flex items-center space-x-4">
            <div
              className={`flex items-center ${
                step >= 1 ? "text-primary-600" : "text-gray-400"
              }`}
            >
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  step >= 1 ? "bg-primary-600 text-white" : "bg-gray-200"
                }`}
              >
                {step > 1 ? <CheckCircle size={20} /> : "1"}
              </div>
              <span className="ml-2 font-medium">Select Agent</span>
            </div>
            <div className="w-16 h-0.5 bg-gray-300"></div>
            <div
              className={`flex items-center ${
                step >= 2 ? "text-primary-600" : "text-gray-400"
              }`}
            >
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  step >= 2 ? "bg-primary-600 text-white" : "bg-gray-200"
                }`}
              >
                {step > 2 ? <CheckCircle size={20} /> : "2"}
              </div>
              <span className="ml-2 font-medium">Choose Time</span>
            </div>
            <div className="w-16 h-0.5 bg-gray-300"></div>
            <div
              className={`flex items-center ${
                step >= 3 ? "text-primary-600" : "text-gray-400"
              }`}
            >
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  step >= 3 ? "bg-primary-600 text-white" : "bg-gray-200"
                }`}
              >
                3
              </div>
              <span className="ml-2 font-medium">Confirm</span>
            </div>
          </div>
        </div>

        {/* Step 1: Select Agent */}
        {step === 1 && (
          <div className="card">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Select an Agent
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {agents.map((agent) => (
                <div
                  key={agent.id}
                  onClick={() => handleAgentSelect(agent)}
                  className="p-4 border-2 border-gray-200 rounded-lg hover:border-primary-500 cursor-pointer transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center">
                      <User className="text-primary-600" size={20} />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">
                        {agent.fullName}
                      </p>
                      <p className="text-sm text-gray-600">
                        {agent.specialization}
                      </p>
                      <p className="text-sm text-gray-500">
                        ⭐ {agent.rating.toFixed(1)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Step 2: Choose Time */}
        {step === 2 && (
          <div className="card">
            <button
              onClick={() => setStep(1)}
              className="text-primary-600 mb-4"
            >
              ← Back to agents
            </button>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Select Date & Time
            </h2>
            <div className="mb-4 p-4 bg-gray-50 rounded-lg">
              <p className="font-medium text-gray-900">
                Selected Agent: {selectedAgent?.fullName}
              </p>
              <p className="text-sm text-gray-600">
                {selectedAgent?.specialization}
              </p>
            </div>

            {availableSlots.length === 0 ? (
              <p className="text-gray-600 text-center py-8">
                No available slots at the moment
              </p>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {availableSlots.map((slot) => (
                  <button
                    key={slot.id}
                    onClick={() => handleSlotSelect(slot)}
                    className="p-4 border-2 border-gray-200 rounded-lg hover:border-primary-500 transition-colors text-left"
                  >
                    <div className="flex items-center space-x-2 mb-2">
                      <Calendar size={16} className="text-primary-600" />
                      <span className="text-sm font-medium">{slot.date}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Clock size={16} className="text-primary-600" />
                      <span className="text-sm">
                        {slot.startTime} - {slot.endTime}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Step 3: Confirm */}
        {step === 3 && (
          <div className="card">
            <button
              onClick={() => setStep(2)}
              className="text-primary-600 mb-4"
            >
              ← Back to time selection
            </button>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Confirm Appointment
            </h2>

            <div className="space-y-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <h3 className="font-medium text-gray-900 mb-2">
                  Appointment Details
                </h3>
                <div className="space-y-2 text-sm">
                  <p>
                    <span className="text-gray-600">Agent:</span>{" "}
                    <span className="font-medium">
                      {selectedAgent?.fullName}
                    </span>
                  </p>
                  <p>
                    <span className="text-gray-600">Date:</span>{" "}
                    <span className="font-medium">{selectedSlot?.date}</span>
                  </p>
                  <p>
                    <span className="text-gray-600">Time:</span>{" "}
                    <span className="font-medium">
                      {selectedSlot?.startTime} - {selectedSlot?.endTime}
                    </span>
                  </p>
                </div>
              </div>

              <div>
                <label className="label">Appointment Type</label>
                <select
                  value={appointmentType}
                  onChange={(e) => setAppointmentType(e.target.value)}
                  className="input"
                >
                  <option value="CONSULTATION">Consultation</option>
                  <option value="CLAIM_ASSISTANCE">Claim Assistance</option>
                  <option value="POLICY_REVIEW">Policy Review</option>
                  <option value="NEW_POLICY">New Policy</option>
                  <option value="RENEWAL">Renewal</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>

              <div>
                <label className="label">Notes (Optional)</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="input"
                  rows={4}
                  placeholder="Any additional information..."
                ></textarea>
              </div>

              <button
                onClick={handleBookAppointment}
                disabled={loading}
                className="btn btn-primary w-full"
              >
                {loading ? "Booking..." : "Confirm Appointment"}
              </button>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default BookAppointment;
