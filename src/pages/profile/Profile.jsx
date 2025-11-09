import { useEffect, useState } from "react";
import api from "../../Services/api";

export default function Profile() {
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    const load = async () => {
      const res = await api.get("/users/me");
      setProfile(res.data);
    };
    load();
  }, []);

  return (
    <div className="p-6">
      {profile ? (
        <>
          <h2 className="text-2xl font-bold mb-2">{profile.name}</h2>
          <p>Email: {profile.email}</p>
        </>
      ) : (
        <p>Loading...</p>
      )}
    </div>
  );
}
