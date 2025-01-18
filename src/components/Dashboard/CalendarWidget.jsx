import React, { useState } from "react";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css"; // Default styles

const CalendarWidget = () => {
  const [selectedDate, setSelectedDate] = useState(new Date());

  return (
    <div className="calendar-widget">
      <h4>📆 Project Calendar</h4>
      <Calendar onChange={setSelectedDate} value={selectedDate} />
    </div>
  );
};

export default CalendarWidget;
