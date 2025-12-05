import { useState, useEffect } from "react";
import Layout from "../components/Layout";
import { agentService } from "../services/api";
import { User, Star, Calendar, Award } from "lucide-react";
import { Link } from "react-router-dom";

const Agents = () => {
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    fetchAgents();
  }, [filter]);

  const fetchAgents = async () => {
    try {
      let response;
      if (filter === "all") {
        response = await agentService.getAllAgents();
      } else if (filter === "available") {
        response = await agentService.getAvailableAgents();
      } else if (filter === "top") {
        response = await agentService.getTopAgents();
      }
      setAgents(response.data);
    } catch (error) {
      console.error("Error fetching agents:", error);
    } finally {
      setLoading(false);
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

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-white">Our Agents</h1>
            <p className="text-white mt-1">
              Find the perfect insurance expert for your needs
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
              All Agents
            </button>
            <button
              onClick={() => setFilter("available")}
              className={`px-4 py-2 rounded-lg ${
                filter === "available"
                  ? "bg-primary-600 text-white"
                  : "bg-gray-100 text-gray-700"
              }`}
            >
              Available
            </button>
            <button
              onClick={() => setFilter("top")}
              className={`px-4 py-2 rounded-lg ${
                filter === "top"
                  ? "bg-primary-600 text-white"
                  : "bg-gray-100 text-gray-700"
              }`}
            >
              Top Rated
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {agents.map((agent) => (
            <div
              key={agent.id}
              className="card hover:shadow-lg transition-shadow"
            >
              <div className="flex items-start space-x-4">
                <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <User className="text-primary-600" size={28} />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {agent.fullName}
                  </h3>
                  <p className="text-sm text-primary-600 font-medium">
                    {agent.specialization}
                  </p>

                  <div className="mt-2 space-y-1">
                    <div className="flex items-center text-sm text-gray-600">
                      <Star size={14} className="text-yellow-500 mr-1" />
                      <span className="font-medium">
                        {agent.rating.toFixed(1)}
                      </span>
                      <span className="mx-1">•</span>
                      <span>{agent.totalAppointments} sessions</span>
                    </div>

                    <div className="flex items-center text-sm text-gray-600">
                      <Award size={14} className="mr-1" />
                      <span>{agent.experienceYears} years experience</span>
                    </div>
                  </div>

                  {agent.isAvailable && (
                    <span className="inline-block mt-2 px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                      Available
                    </span>
                  )}

                  {agent.bio && (
                    <p className="mt-3 text-sm text-gray-600 line-clamp-2">
                      {agent.bio}
                    </p>
                  )}

                  <Link
                    to={`/book-appointment?agentId=${agent.id}`}
                    className="mt-4 w-full btn btn-primary flex items-center justify-center space-x-2"
                  >
                    <Calendar size={16} />
                    <span>Book Appointment</span>
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>

        {agents.length === 0 && (
          <div className="text-center py-12">
            <User size={48} className="mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No agents found
            </h3>
            <p className="text-gray-600">Try adjusting your filters</p>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Agents;
