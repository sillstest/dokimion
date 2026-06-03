import React, { useState } from "react";
import Header from "./common/Header";
import Main from "./common/Main";
import Footer from "./common/Footer";
import "./App.css";
import { library } from "@fortawesome/fontawesome-svg-core";
import { faStroopwafel } from "@fortawesome/free-solid-svg-icons";

library.add(faStroopwafel);

function App() {
  const [project, setProject] = useState("");
  const [session, setSession] = useState({ person: { firstName: "Guest" } });

  return (
    <div>
      <Header project={project} session={session} onSessionChange={setSession} />
      <div className="container-fluid">
        <Main onProjectChange={setProject} session={session} onSessionChange={setSession} />
      </div>
      <Footer />
    </div>
  );
}

export default App;
