import React, { useState } from "react";
import Header from "./common/Header";
import Main from "./common/Main";
import Footer from "./common/Footer";
import "./App.css";
import { library } from "@fortawesome/fontawesome-svg-core";
import { faStroopwafel } from "@fortawesome/free-solid-svg-icons";

// Add FontAwesome icons to the library (done once at app level)
library.add(faStroopwafel);

const App = () => {
  const [project, setProject] = useState("");
  const [session, setSession] = useState({ person: { firstName: "Guest" } });

  const onProjectChange = (newProject) => {
    setProject(newProject);
  };

  const onSessionChange = (newSession) => {
    setSession(newSession);
  };

  return (
    <div>
      <Header
        project={project}
        session={session}
        onSessionChange={onSessionChange}
      />
      <div className="container-fluid">
        <Main
          onProjectChange={onProjectChange}
          session={session}
          onSessionChange={onSessionChange}
        />
      </div>
      <Footer />
    </div>
  );
};

export default App;
