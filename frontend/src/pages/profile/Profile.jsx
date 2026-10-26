import { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { updateProfile } from "../../services/auth.service";
import Navbar from "../../components/Navbar";

const Profile = () => {
  const { user, updateUser } = useAuth();

  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [formData, setFormData] = useState({
    name: user?.name || "",
    targetRole: user?.targetRole || "",
    education: user?.education || "",
    skills: user?.skills?.join(", ") || "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleEdit = () => {
    setFormData({
      name: user?.name || "",
      targetRole: user?.targetRole || "",
      education: user?.education || "",
      skills: user?.skills?.join(", ") || "",
    });

    setEditing(true);
    setError("");
    setSuccess("");
  };

  const handleCancel = () => {
    setEditing(false);
    setError("");
    setSuccess("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      const data = {
        name: formData.name.trim(),
        targetRole: formData.targetRole.trim(),
        education: formData.education.trim(),
        skills: formData.skills
          .split(",")
          .map((skill) => skill.trim())
          .filter(Boolean),
      };

      const result = await updateProfile(data);

      updateUser(result.user);

      setSuccess("Profile updated successfully.");
      setEditing(false);
    } catch (error) {
      console.error(error);

      setError(error.response?.data?.message || "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />

      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">


        <div className="mb-6">
          <p className="text-sm font-semibold text-violet-600">ACCOUNT</p>

          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            Your Profile
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Manage your information and assessment preferences.
          </p>
        </div>



        <div className="mb-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              {/* Avatar */}

              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-violet-100 text-2xl font-bold text-violet-600">
                {user?.name ? user.name.charAt(0).toUpperCase() : "U"}
              </div>

              {/* User information */}

              <div className="min-w-0">
                <h2 className="truncate text-xl font-bold text-slate-900">
                  {user?.name || "User"}
                </h2>

                <p className="mt-1 truncate text-sm text-slate-500">
                  {user?.email}
                </p>
              </div>
            </div>

            {/* Edit button */}

            {!editing && (
              <button
                onClick={handleEdit}
                className="rounded-xl bg-violet-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-violet-700"
              >
                Edit Profile
              </button>
            )}
          </div>
        </div>


        {success && (
          <div className="mb-5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
            ✓ {success}
          </div>
        )}


        {error && (
          <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-600">
            {error}
          </div>
        )}


        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
          <div className="mb-6">
            <h2 className="text-lg font-bold text-slate-900">
              Profile Information
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Information used to personalize your OA experience.
            </p>
          </div>


          {!editing ? (
            <>
              {/* Basic information */}

              <div className="grid gap-5 sm:grid-cols-2">
                {/* Target Role */}

                <InfoCard
                  label="Target Role"
                  value={user?.targetRole || "Not specified"}
                  icon="💼"
                />

                {/* Education */}

                <InfoCard
                  label="Education"
                  value={user?.education || "Not specified"}
                  icon="🎓"
                />
              </div>

              {/* Skills */}

              <div className="mt-6">
                <p className="mb-3 text-sm font-medium text-slate-500">
                  Skills
                </p>

                {user?.skills?.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {user.skills.map((skill, index) => (
                      <span
                        key={index}
                        className="rounded-full bg-violet-50 px-3.5 py-1.5 text-sm font-medium text-violet-700"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-slate-400">No skills added yet.</p>
                )}
              </div>
            </>
          ) : (
       

            <form onSubmit={handleSubmit}>
              {/* Name + Email */}

              <div className="grid gap-5 sm:grid-cols-2">
                {/* Name */}

                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                    Name
                  </label>

                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-violet-500 focus:ring-3 focus:ring-violet-100"
                  />
                </div>

                {/* Email */}

                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                    Email
                  </label>

                  <input
                    type="email"
                    value={user?.email || ""}
                    disabled
                    className="w-full cursor-not-allowed rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-400"
                  />

                  <p className="mt-1.5 text-xs text-slate-400">
                    Email cannot be changed.
                  </p>
                </div>
              </div>

              {/* Target Role + Education */}

              <div className="mt-5 grid gap-5 sm:grid-cols-2">
                {/* Target Role */}

                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                    Target Role
                  </label>

                  <input
                    type="text"
                    name="targetRole"
                    value={formData.targetRole}
                    onChange={handleChange}
                    placeholder="Software Developer"
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-violet-500 focus:ring-3 focus:ring-violet-100"
                  />
                </div>

                {/* Education */}

                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                    Education
                  </label>

                  <input
                    type="text"
                    name="education"
                    value={formData.education}
                    onChange={handleChange}
                    placeholder="MCA"
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-violet-500 focus:ring-3 focus:ring-violet-100"
                  />
                </div>
              </div>

              {/* Skills */}

              <div className="mt-5">
                <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                  Skills
                </label>

                <input
                  type="text"
                  name="skills"
                  value={formData.skills}
                  onChange={handleChange}
                  placeholder="C++, React, Node.js"
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-violet-500 focus:ring-3 focus:ring-violet-100"
                />

                <p className="mt-1.5 text-xs text-slate-400">
                  Separate skills with commas.
                </p>
              </div>

              {/* Buttons */}

              <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={handleCancel}
                  disabled={saving}
                  className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-xl bg-violet-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {saving ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          )}
        </div>
      </main>
    </div>
  );
};


const InfoCard = ({ label, value, icon }) => {
  return (
    <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-violet-100 text-sm">
          {icon}
        </div>

        <div className="min-w-0">
          <p className="text-xs font-medium text-slate-500">{label}</p>

          <p className="mt-1 truncate text-sm font-semibold text-slate-900">
            {value}
          </p>
        </div>
      </div>
    </div>
  );
};

export default Profile;
