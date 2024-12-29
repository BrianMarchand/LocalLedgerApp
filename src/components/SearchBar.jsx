import React, { useState, useEffect } from "react";
import { db } from "../firebaseConfig";
import { collection, getDocs } from "firebase/firestore";

const SearchBar = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [projects, setProjects] = useState([]);

  // Fetch Projects
  useEffect(() => {
    const fetchProjects = async () => {
      const querySnapshot = await getDocs(collection(db, "projects"));
      setProjects(
        querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })),
      );
    };
    fetchProjects();
  }, []);

  // Handle Search
  const handleSearch = (query) => {
    setSearchQuery(query);
    if (query) {
      const filtered = projects.filter((p) =>
        p.name.toLowerCase().includes(query.toLowerCase()),
      );
      setSuggestions(filtered);
    } else {
      setSuggestions([]);
    }
  };

  return (
    <div className="position-relative">
      <input
        type="text"
        className="form-control shadow-sm"
        placeholder="Search projects..."
        value={searchQuery}
        onChange={(e) => handleSearch(e.target.value)}
      />
      {suggestions.length > 0 && (
        <ul className="list-group position-absolute w-100 mt-1 shadow-sm">
          {suggestions.map((project) => (
            <li
              key={project.id}
              className="list-group-item list-group-item-action"
              style={{ cursor: "pointer" }}
            >
              {project.name}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default SearchBar;
