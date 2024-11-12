import React, { useEffect, useState } from "react";
import EventContext from "./EventContext";

const EventState = (props) => {
  const [eventData, setEventData] = useState({});
  const [users, setUsers] = useState([]);
  const [userDetailsFirebase, setUserDetailsFirebase] = useState(null);

  return (
    <EventContext.Provider
      value={{
        eventData,
        setEventData,
        users, 
        setUsers,
        userDetailsFirebase,
        setUserDetailsFirebase
      }}
    >
      {props.children}
    </EventContext.Provider>
  );
};

export default EventState;
